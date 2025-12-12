"""
Dekompresija profilne slike iz DCT formata
Uporablja se za dekompresijo profilnih slik uporabnikov
"""
import sys
import json
import cv2
import base64
import numpy as np
from utils.image_compression_dct import decompress_to_array

def decompress_profile_image(compressed_base64):
    try:
        # Dekompresiraj
        compressed_data = base64.b64decode(compressed_base64)
        decompressed_image = decompress_to_array(compressed_data)
        
        # Pretvori v PNG format (boljša kakovost za profilne slike)
        success, buffer = cv2.imencode('.png', decompressed_image)
        if not success:
            return {"error": "Failed to encode image"}
        
        # Pretvori v base64
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "image_base64": image_base64,
            "format": "png"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Compressed data required"}))
        sys.exit(1)
    
    compressed_base64 = sys.argv[1]
    result = decompress_profile_image(compressed_base64)
    print(json.dumps(result))
