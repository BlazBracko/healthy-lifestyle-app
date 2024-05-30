import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input, BatchNormalization
from tensorflow.keras.optimizers import Adam
import keras_tuner as kt
import cv2
from sklearn.preprocessing import LabelEncoder

# Pot do slikovne mape
data_dir = 'learnPhotos/blaz'
img_size = (150, 150)
batch_size = 32

# Funkcija za zaznavanje in obrezovanje obraza na sliki
def detect_and_crop_face(image_path, target_size=img_size):
    image = cv2.imread(image_path)
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
                    images.append(face / 255.0)
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

# Definicija modela za iskanje hiperparametrov
def build_model(hp, num_classes):
    model = Sequential()
    model.add(Input(shape=(img_size[0], img_size[1], 3)))
    model.add(Conv2D(filters=hp.Int('conv_1_filters', min_value=32, max_value=128, step=16), kernel_size=(3, 3), activation='relu'))
    model.add(BatchNormalization())
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Conv2D(filters=hp.Int('conv_2_filters', min_value=32, max_value=128, step=16), kernel_size=(3, 3), activation='relu'))
    model.add(BatchNormalization())
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Conv2D(filters=hp.Int('conv_3_filters', min_value=32, max_value=128, step=16), kernel_size=(3, 3), activation='relu'))
    model.add(BatchNormalization())
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Flatten())
    model.add(Dense(units=hp.Int('dense_units', min_value=128, max_value=512, step=64), activation='relu'))
    model.add(Dropout(rate=hp.Float('dropout_rate', min_value=0.2, max_value=0.5, step=0.1)))
    model.add(Dense(num_classes, activation='softmax'))
    
    model.compile(optimizer=Adam(learning_rate=hp.Float('learning_rate', min_value=1e-5, max_value=1e-3, sampling='LOG')), 
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

print("Ustvarjanje mape learned_model, če ne obstaja...")
learned_model_dir = 'learned_model'
if not os.path.exists(learned_model_dir):
    os.makedirs(learned_model_dir)

# Definicija tunerja
print("Definicija tunerja...")
tuner = kt.RandomSearch(
    lambda hp: build_model(hp, num_classes),
    objective='val_accuracy',
    max_trials=3,
    executions_per_trial=1,
    directory=os.path.join(learned_model_dir, 'tuner'),
    project_name='face_recognition'
)

print("Iskanje najboljših hiperparametrov...")
tuner.search(X_train, y_train, epochs=50, validation_data=(X_test, y_test), verbose=1)

print("Povzetek iskanja...")
best_hps = tuner.get_best_hyperparameters(num_trials=1)[0]
print(f"Best hyperparameters: {best_hps}")

print("Učenje modela z najboljšimi hiperparametri...")
model = tuner.hypermodel.build(best_hps)
history = model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=50, verbose=1)

print("Shranjevanje modela...")
model_path = os.path.join(learned_model_dir, 'face_recognition_model.keras')
model.save(model_path)

print("Evalvacija modela...")
loss, accuracy = model.evaluate(X_test, y_test, verbose=1)
print(f'Test Loss: {loss}')
print(f'Test Accuracy: {accuracy}')