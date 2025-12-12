"""
Kompresija profilne slike z DCT
Uporablja se za kompresijo profilnih slik uporabnikov
"""
import sys
import json
import cv2
import numpy as np
import base64
from utils.image_compression_dct import compress_image_array

def compress_profile_image(image_path, faktor=10):
    try:
        # Preberi sliko
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image file"}
        
        # Kompresiraj sliko
        compressed_data = compress_image_array(image, faktor=faktor)
        compressed_base64 = base64.b64encode(compressed_data).decode('utf-8')
        
        return {
            "success": True,
            "compressed_data": compressed_base64,
            "original_size": image.shape[0] * image.shape[1] * 3,
            "compressed_size": len(compressed_data)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Image path required"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    faktor = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    result = compress_profile_image(image_path, faktor)
    print(json.dumps(result))
