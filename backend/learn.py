import ssl
ssl._create_default_https_context = ssl._create_unverified_context
import os
import sys
import io
import numpy as np
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input, BatchNormalization, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam
import cv2
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Nastavi kodiranje standardnega izhoda na UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

# Pot do slikovne mape
username = sys.argv[1]
data_dir = os.path.join('learnPhotos', username)
img_size = (224, 224)  # MobileNetV2 pričakuje vhodne slike velikosti 224x224
batch_size = 32

# Funkcija za zaznavanje in obrezovanje obraza na sliki
def detect_and_crop_face(image_path, target_size=img_size):
    image = cv2.imread(image_path)
    image = cv2.GaussianBlur(image, (5, 5), 0)  # Uporabi Gaussianov filter za zmanjšanje šuma
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return None
    (x, y, w, h) = faces[0]
    face = image[y:y+h, x:x+w]
    face = cv2.resize(face, target_size)
    return face

# Funkcija za nalaganje slik in pripravo oznak
def load_images_and_labels(data_dir):
    images = []
    labels = []
    files = os.listdir(data_dir)
    for filename in files:
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(data_dir, filename)
            try:
                face = detect_and_crop_face(img_path, img_size)
                if face is not None:
                    images.append(preprocess_input(face))  # Uporabi preprocess_input za MobileNetV2
                    label = filename.split('_')[0]  # Predpostavka: ime datoteke je v obliki 'ime_številka.jpg'
                    labels.append(label)
            except Exception as e:
                print(f"Napaka pri nalaganju slike {filename}: {e}")
    return np.array(images), np.array(labels)

print("Nalaganje slik in oznak...")
images, labels = load_images_and_labels(data_dir)
print(f"Število naloženih slik: {len(images)}")

# Pretvorba oznak v številčne vrednosti
label_encoder = LabelEncoder()
labels = label_encoder.fit_transform(labels)

# Razdelitev podatkov na učni in testni set
def train_test_split_manual(images, labels, test_size=0.2):
    np.random.seed(42)
    indices = np.arange(len(images))
    np.random.shuffle(indices)
    
    split_index = int(len(images) * (1 - test_size))
    
    train_indices = indices[:split_index]
    test_indices = indices[split_index:]
    
    X_train = images[train_indices]
    X_test = images[test_indices]
    y_train = labels[train_indices]
    y_test = labels[test_indices]
    
    return X_train, X_test, y_train, y_test

print("Razdelitev podatkov...")
X_train, X_test, y_train, y_test = train_test_split_manual(images, labels, test_size=0.2)

num_classes = len(np.unique(labels))
print(f"Number of classes: {num_classes}")

# Definicija modela z uporabo MobileNetV2
def build_model(num_classes):
    base_model = MobileNetV2(input_shape=(img_size[0], img_size[1], 3), include_top=False, weights='imagenet')
    base_model.trainable = False  # Ne treniramo osnovnih slojev MobileNetV2

    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dense(256, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(optimizer=Adam(learning_rate=1e-4), 
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

print("Gradnja modela...")
model = build_model(num_classes)

print("Učenje modela...")
history = model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=100, batch_size=batch_size, verbose=1)

# Preveri in ustvari mapo learned_model
learned_model_dir = os.path.join('learned_model', username)
if not os.path.exists(learned_model_dir):
    os.makedirs(learned_model_dir)

print("Shranjevanje modela...")
model_path = os.path.join(learned_model_dir, 'face_recognition_model.keras')
model.save(model_path)

print("Evalvacija modela...")
loss, accuracy = model.evaluate(X_test, y_test, verbose=1)
print(f'Test Loss: {loss}')
print(f'Test Accuracy: {accuracy}')

# Shranjevanje zgodovine učenja
history_path = os.path.join(learned_model_dir, 'training_history.npy')
np.save(history_path, history.history)