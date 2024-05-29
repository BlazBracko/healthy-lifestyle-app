import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.metrics.pairwise import cosine_similarity

# Pot do mape s shranjenim modelom
model_path = os.path.join('learned_model', 'face_recognition_model.keras')
model = load_model(model_path)

# Velikost slik
img_size = (150, 150)

# Prag podobnosti za prepoznavanje uporabnika (med 0 in 1)
similarity_threshold = 0.5

# Funkcija za nalaganje in pripravo slik
def load_and_prepare_image(image_path, img_size):
    image = load_img(image_path, target_size=img_size)
    image = img_to_array(image) / 255.0
    image = np.expand_dims(image, axis=0)  # Dodaj dimenzijo za batch
    return image

# Štetje slik v mapah
uploads_dir = 'uploads'
saved_users_dir = 'saved_users'

uploads_count = len([f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
saved_users_count = len([f for f in os.listdir(saved_users_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

print(f"Število slik v mapi 'uploads': {uploads_count}")
print(f"Število slik v mapi 'saved_users': {saved_users_count}")

# Naloži in pripravi slike
upload_image_path = os.path.join(uploads_dir, os.listdir(uploads_dir)[0])
saved_user_image_path = os.path.join(saved_users_dir, os.listdir(saved_users_dir)[0])

upload_image = load_and_prepare_image(upload_image_path, img_size)
saved_user_image = load_and_prepare_image(saved_user_image_path, img_size)

# Pridobitev značilk iz modela
upload_features = model.predict(upload_image)
saved_user_features = model.predict(saved_user_image)

# Izračun cosine podobnosti
similarity = cosine_similarity(upload_features, saved_user_features)[0][0]
print(f'Similarity: {similarity}')

# Odločanje o identiteti uporabnika
if similarity >= similarity_threshold:
    print("user identified")
else:
    print("user not identified")