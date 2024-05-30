import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from sklearn.metrics.pairwise import cosine_similarity
import cv2

# Pot do mape s shranjenim modelom
model_path = os.path.join('learned_model', 'face_recognition_model.keras')
model = load_model(model_path)

# Velikost slik
img_size = (150, 150)

# Prag podobnosti za prepoznavanje uporabnika (med 0 in 1)
similarity_threshold = 0.9

# Funkcija za zaznavanje in obrezovanje obraza na sliki
def detect_and_crop_face(image_path, target_size=img_size):
    # Preberi sliko z uporabo OpenCV
    image = cv2.imread(image_path)
    # Pretvori sliko v sivinsko sliko za boljše delovanje detektorja obraza
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Uporabi detektor obraza (lahko bi uporabil tudi bolj kompleksne metode za boljše rezultate)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    # Če ni zaznan noben obraz, vrni None
    if len(faces) == 0:
        return None
    # Predpostavimo, da bo na sliki samo en obraz, zato vzamemo prvega zaznanega
    (x, y, w, h) = faces[0]
    # Obreži in vrni obraz kot sliko
    face = image[y:y+h, x:x+w]
    face = cv2.resize(face, target_size)
    return face

# Štetje slik v mapah
uploads_dir = 'uploads'
saved_users_dir = 'saved_users'

uploads_count = len([f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
saved_users_count = len([f for f in os.listdir(saved_users_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

print(f"Število slik v mapi 'uploads': {uploads_count}")
print(f"Število slik v mapi 'saved_users': {saved_users_count}")

# Naloži in pripravi obrezane slike obrazov
upload_image_path = os.path.join(uploads_dir, os.listdir(uploads_dir)[0])
saved_user_image_path = os.path.join(saved_users_dir, os.listdir(saved_users_dir)[0])

upload_face = detect_and_crop_face(upload_image_path, img_size)
saved_user_face = detect_and_crop_face(saved_user_image_path, img_size)

# Če ni bilo mogoče najti obrazov na slikah, prekini izvajanje
if upload_face is None or saved_user_face is None:
    print("Ni bilo mogoče najti obrazov na eni ali obeh slikah.")
    exit()

# Priprava obrazov za napovedovanje
upload_face = img_to_array(upload_face) / 255.0
upload_face = np.expand_dims(upload_face, axis=0)
saved_user_face = img_to_array(saved_user_face) / 255.0
saved_user_face = np.expand_dims(saved_user_face, axis=0)

# Pridobitev značilk iz modela
upload_features = model.predict(upload_face)
saved_user_features = model.predict(saved_user_face)

# Izračun cosine podobnosti
similarity = cosine_similarity(upload_features, saved_user_features)[0][0]
print(f'Similarity: {similarity}')

recognized = None  # Spremenljivka za shranjevanje rezultata prepoznavanja

# Odločanje o identiteti uporabnika
if similarity >= similarity_threshold:
    print("user identified")
    recognized = True
else:
    print("user not identified")
    recognized = False

# Vrnemo rezultat prepoznavanja
print(recognized)