import os
import numpy as np
import cv2
import sys
import io
import json
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Nastavi kodiranje standardnega izhoda na UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')
img_size = (224, 224)  # Velikost slik, ki jih pričakuje model

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

# Funkcija za nalaganje in obdelavo novih slik
def load_and_preprocess_image(image_path):
    face = detect_and_crop_face(image_path, img_size)
    if face is not None:
        return preprocess_input(face)
    return None

# Preveri nove slike v mapi uploads
def recognize_faces(uploads_dir, model, confidence_threshold=0.50):
    # Preveri, ali mapa obstaja
    if not os.path.exists(uploads_dir):
        print(f"Error: Directory {uploads_dir} does not exist", file=sys.stderr)
        return False, []
    
    try:
        files = os.listdir(uploads_dir)
    except OSError as e:
        print(f"Error listing directory {uploads_dir}: {e}", file=sys.stderr)
        return False, []
    
    results = []
    for filename in files:
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(uploads_dir, filename)
            # Preveri, ali datoteka obstaja
            if not os.path.exists(img_path):
                print(f"Warning: File {img_path} does not exist", file=sys.stderr)
                continue
                
            image = load_and_preprocess_image(img_path)
            if image is not None:
                image = np.expand_dims(image, axis=0)  # Dodaj batch dimension
                prediction = model.predict(image, verbose=0)
                confidence = float(np.max(prediction))  # Convert numpy float to Python float
                match = confidence > confidence_threshold  # Uporabi nastavljeni prag zaupanja
                match = bool(match)  # Convert numpy bool to Python bool
                results.append((filename, match, confidence * 100))  # Dodan % zaupanja
                if match:
                    return True, results  # Takoj vrni True, če je ujemanje uspešno
            else:
                results.append((filename, False, float(0.0)))
    return False, results  # Vrni False, če ni bilo nobenega ujemanja

def main():
    # Settings
    username = sys.argv[1]
    model_path = os.path.join('learned_model', username, 'face_recognition_model.keras')
    uploads_dir = 'login-photo'

    # Load the trained model without compilation (to avoid optimizer compatibility issues)
    # For inference, we don't need the optimizer, only the weights
    model = load_model(model_path, compile=False)
    
    # Model weights are already loaded, no need to compile for inference
    # The model can make predictions without compilation

    # Run face recognition
    is_match, results = recognize_faces(uploads_dir, model)
    # Output the results in JSON format
    print(json.dumps({"is_match": is_match}))

if __name__ == "__main__":
    main()