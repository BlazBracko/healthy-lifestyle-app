# Logika za prepoznavo obraza

# Sedaj samo test če sprejme sliko
import sys
import json
import cv2
import os

def test_image_loading(image_path):
    try:
        # Preverjanje, ali datoteka obstaja
        if not os.path.exists(image_path):
            raise ValueError(f"Datoteka ne obstaja na poti: {image_path}")

        # Nalaganje slike
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Slike ni mogoče naložiti.")

        # Preberemo osnovne informacije o sliki
        height, width, channels = img.shape
        result = {
            "loaded": True,
            "message": "Slika uspešno prebrana.",
            "dimensions": {
                "width": width,
                "height": height,
                "channels": channels
            }
        }
    except Exception as e:
        result = {
            "loaded": False,
            "message": "Slike ni mogoče prebrati.",
            "error": str(e)
        }

    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"Preverjanje poti: {image_path}")  # Dodano za preverjanje poti
        print(f"Uporablja se Python verzija: {sys.version}")  # Dodano za izpis verzije Pythona
        result = test_image_loading(image_path)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No image path provided"}))
