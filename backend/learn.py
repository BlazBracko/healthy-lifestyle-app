import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Input, BatchNormalization
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.optimizers import Adam
import keras_tuner as kt

# Pot do slikovne mape
data_dir = 'samples'
img_size = (150, 150)
batch_size = 32

# Funkcija za nalaganje slik in pripravo oznak
def load_images_and_labels(data_dir):
    images = []
    labels = []
    files = os.listdir(data_dir)
    # print(f"Datoteke v mapi '{data_dir}': {files}")
    for index, filename in enumerate(files):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(data_dir, filename)
            # print(f"Nalaganje slike: {img_path}")
            try:
                image = load_img(img_path, target_size=img_size)
                image = img_to_array(image) / 255.0  # Normalizacija slike
                images.append(image)
                labels.append(index)  # Vsaki sliki dodelimo edinstveno oznako
            except Exception as e:
                print(f"Napaka pri nalaganju slike {filename}: {e}")
    return np.array(images), np.array(labels)

# Nalaganje slik in oznak
images, labels = load_images_and_labels(data_dir)

# Razdelitev podatkov na učni in testni set
def train_test_split_manual(images, labels, test_size=0.2):
    np.random.seed(42)  # Za ponovljivost
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

# Razdelitev podatkov
X_train, X_test, y_train, y_test = train_test_split_manual(images, labels, test_size=0.2)

num_classes = len(np.unique(labels))  # Število razredov mora biti enako 50

print(f"Number of classes: {num_classes}")  # Preverimo, če je število razredov pravilno

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
    model.add(Dense(num_classes, activation='softmax'))  # Sprememba v večrazredno klasifikacijo
    
    model.compile(optimizer=Adam(learning_rate=hp.Float('learning_rate', min_value=1e-4, max_value=1e-2, sampling='LOG')), 
                  loss='sparse_categorical_crossentropy',  # Sprememba izgube za večrazredno klasifikacijo
                  metrics=['accuracy'])
    return model

# Ustvarjanje mape learned_model, če ne obstaja
learned_model_dir = 'learned_model'
if not os.path.exists(learned_model_dir):
    os.makedirs(learned_model_dir)

# Definicija tunerja
tuner = kt.RandomSearch(
    lambda hp: build_model(hp, num_classes),
    objective='val_accuracy',
    max_trials=100,  # Povečajmo število poskusov za boljšo optimizacijo
    executions_per_trial=1,
    directory=os.path.join(learned_model_dir, 'tuner'),  # Shranjevanje tunerja znotraj learned_model
    project_name='face_recognition'
)

# Iskanje najboljših hiperparametrov
tuner.search(X_train, y_train, epochs=10, validation_data=(X_test, y_test))  # Povečajmo število epoha

# Povzetek iskanja
best_hps = tuner.get_best_hyperparameters(num_trials=1)[0]
print(f"Best hyperparameters: {best_hps}")

# Učenje modela z najboljšimi hiperparametri
model = tuner.hypermodel.build(best_hps)
history = model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=50)  # Povečajmo število epoha

# Shrani model
model_path = os.path.join(learned_model_dir, 'face_recognition_model.keras')
model.save(model_path)

# Evalvacija modela
loss, accuracy = model.evaluate(X_test, y_test)
print(f'Test Loss: {loss}')
print(f'Test Accuracy: {accuracy}')