"""
DCT (Discrete Cosine Transform) kompresija slik
"""

import cv2
import numpy as np
import json
import os
import struct
from typing import Tuple, List, Dict, Optional
from numba import jit

# JPEG kvantizacijska matrika (Q50)
JPEG_QUANTIZATION_MATRIX = np.array([
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
], dtype=np.float32)

# Zigzag pattern za 8x8 blok (64 elementov)
ZIGZAG_PATTERN = [
    (0,0), (0,1), (1,0), (2,0), (1,1), (0,2), (0,3), (1,2), (2,1), (3,0),
    (4,0), (3,1), (2,2), (1,3), (0,4), (0,5), (1,4), (2,3), (3,2), (4,1),
    (5,0), (6,0), (5,1), (4,2), (3,3), (2,4), (1,5), (0,6), (0,7), (1,6),
    (2,5), (3,4), (4,3), (5,2), (6,1), (7,0), (7,1), (6,2), (5,3), (4,4),
    (3,5), (2,6), (1,7), (2,7), (3,6), (4,5), (5,4), (6,3), (7,2), (7,3),
    (6,4), (5,5), (4,6), (3,7), (4,7), (5,6), (6,5), (7,4), (7,5), (6,6),
    (5,7), (6,7), (7,6), (7,7)
]

@jit(nopython=True, cache=True)
def fdct_8x8(block: np.ndarray) -> np.ndarray:
    """
    Izvede DCT (Forward DCT) na 8x8 bloku.
    Port iz C++ FDCT8x8 funkcije.
    
    Args:
        block: 8x8 numpy array (float32, vrednosti -128 do 127)
    
    Returns:
        8x8 numpy array z DCT koeficienti (float32)
    """
    F = np.zeros((8, 8), dtype=np.float32)
    
    for u in range(8):
        for v in range(8):
            Cu = 1.0 / np.sqrt(2.0) if u == 0 else 1.0
            Cv = 1.0 / np.sqrt(2.0) if v == 0 else 1.0
            
            sum_val = 0.0
            for x in range(8):
                for y in range(8):
                    sum_val += block[x, y] * \
                              np.cos(((2 * x + 1) * u * np.pi) / 16.0) * \
                              np.cos(((2 * y + 1) * v * np.pi) / 16.0)
            
            F[u, v] = 0.25 * Cu * Cv * sum_val
    
    return F

@jit(nopython=True, cache=True)
def idct_8x8(F: np.ndarray) -> np.ndarray:
    """
    Izvede inverzno DCT (Inverse DCT) na 8x8 bloku.
    Port iz C++ IDCT8x8 funkcije.
    
    Args:
        F: 8x8 numpy array z DCT koeficienti (float32)
    
    Returns:
        8x8 numpy array rekonstruirane slike (float32)
    """
    f = np.zeros((8, 8), dtype=np.float32)
    
    for x in range(8):
        for y in range(8):
            sum_val = 0.0
            for u in range(8):
                for v in range(8):
                    Cu = 1.0 / np.sqrt(2.0) if u == 0 else 1.0
                    Cv = 1.0 / np.sqrt(2.0) if v == 0 else 1.0
                    sum_val += Cu * Cv * F[u, v] * \
                              np.cos(((2 * x + 1) * u * np.pi) / 16.0) * \
                              np.cos(((2 * y + 1) * v * np.pi) / 16.0)
            f[x, y] = 0.25 * sum_val
    
    return f


def zigzag_scan(block: np.ndarray) -> List[int]:
    """
    Pretvori 8x8 blok v 1D vektor po zigzag zaporedju.
    Port iz C++ zigzagScanInt funkcije.
    
    Args:
        block: 8x8 numpy array (int16)
    
    Returns:
        Lista 64 elementov v zigzag vrstnem redu
    """
    result = []
    for i in range(64):
        row, col = ZIGZAG_PATTERN[i]
        result.append(int(block[row, col]))
    return result


def zigzag_to_block(data: List[int]) -> np.ndarray:
    """
    Pretvori 1D vektor nazaj v 8x8 blok po zigzag vrstnem redu.
    Port iz C++ zigzagToBlockInt funkcije.
    
    Args:
        data: Lista 64 elementov v zigzag vrstnem redu
    
    Returns:
        8x8 numpy array (int16)
    """
    block = np.zeros((8, 8), dtype=np.int16)
    for i in range(64):
        row, col = ZIGZAG_PATTERN[i]
        block[row, col] = data[i]
    return block


def quant_matrix(faktor: int) -> np.ndarray:
    """
    Ustvari kvantizacijsko matriko glede na faktor stiskanja.
    Port iz C++ quantMatrix funkcije.
    
    Args:
        faktor: Faktor stiskanja (1-15), manjši = boljša kakovost
    
    Returns:
        8x8 numpy array kvantizacijske matrike (float32)
    """
    faktor = max(1, min(15, faktor))
    scale = float(faktor)
    Q = JPEG_QUANTIZATION_MATRIX * scale
    return Q


def apply_quant(F: np.ndarray, Q: np.ndarray) -> np.ndarray:
    """
    Izvede kvantizacijo na 8x8 DCT bloku.
    Port iz C++ applyQuant funkcije.
    
    Args:
        F: 8x8 numpy array z DCT koeficienti (float32)
        Q: 8x8 numpy array kvantizacijske matrike (float32)
    
    Returns:
        8x8 numpy array kvantiziranih koeficientov (int16)
    """
    t = F / Q
    t_rounded = np.round(t)
    t16 = t_rounded.astype(np.int16)
    return t16


def inverse_quant(Fq: np.ndarray, Q: np.ndarray) -> np.ndarray:
    """
    Inverzna kvantizacija - obraten postopek pri dekompresiji.
    Port iz C++ inverseQuant funkcije.
    
    Args:
        Fq: 8x8 numpy array kvantiziranih koeficientov (int16)
        Q: 8x8 numpy array kvantizacijske matrike (float32)
    
    Returns:
        8x8 numpy array DCT koeficientov (float32)
    """
    Fq32 = Fq.astype(np.float32)
    F = Fq32 * Q
    return F


def rle_encode(data: List[int]) -> List[Tuple[int, int]]:
    """
    RLE (Run-Length Encoding) kodiranje za zaporedje števil.
    Port iz C++ RLEencode funkcije.
    
    Args:
        data: Lista števil za kodiranje
    
    Returns:
        Lista parov (vrednost, dolžina)
    """
    if not data:
        return []
    
    out = []
    cnt = 1
    
    for i in range(len(data)):
        if i < len(data) - 1 and data[i] == data[i + 1]:
            cnt += 1
        else:
            out.append((data[i], cnt))
            cnt = 1
    
    return out


def rle_decode(encoded: List[Tuple[int, int]]) -> List[int]:
    """
    RLE dekodiranje - obraten postopek.
    Port iz C++ RLEdecode funkcije.
    
    Args:
        encoded: Lista parov (vrednost, dolžina)
    
    Returns:
        Lista dekodiranih števil
    """
    out = []
    for value, count in encoded:
        out.extend([value] * count)
    return out


def save_binary(blocks: List[List[List[Tuple[int, int]]]], 
                filename: str, 
                width: int, 
                height: int,
                orig_width: int,
                orig_height: int,
                faktor: int) -> None:
    """
    Zapiše vse podatke o sliki v binarno datoteko.
    Port iz C++ saveBinary funkcije.
    
    Args:
        blocks: Lista kanalov, vsak kanal vsebuje liste blokov z RLE kodiranimi podatki
        filename: Ime izhodne datoteke
        width: Širina slike (padded na 8)
        height: Višina slike (padded na 8)
        orig_width: Originalna širina slike
        orig_height: Originalna višina slike
        faktor: Faktor stiskanja
    """
    with open(filename, 'wb') as out:
        num_channels = len(blocks)
        out.write(struct.pack('i', num_channels))
        out.write(struct.pack('i', width))
        out.write(struct.pack('i', height))
        out.write(struct.pack('i', orig_width))
        out.write(struct.pack('i', orig_height))
        out.write(struct.pack('i', faktor))
        
        for ch in range(num_channels):
            num_blocks = len(blocks[ch])
            out.write(struct.pack('i', num_blocks))
            
            for blk in blocks[ch]:
                n = len(blk)
                out.write(struct.pack('i', n))
                
                for value, count in blk:
                    out.write(struct.pack('h', value))  # int16_t
                    out.write(struct.pack('i', count))  # int32_t


def read_binary(filename: str) -> Dict:
    """
    Prebere binarno datoteko, ki jo je ustvaril postopek kompresije.
    Port iz C++ readBinary funkcije.
    
    Args:
        filename: Ime vhodne datoteke
    
    Returns:
        Dictionary z podatki:
        - blocks: Lista kanalov z bloki
        - width: Širina slike
        - height: Višina slike
        - orig_width: Originalna širina
        - orig_height: Originalna višina
        - faktor: Faktor stiskanja
    """
    with open(filename, 'rb') as f:
        num_channels = struct.unpack('i', f.read(4))[0]
        width = struct.unpack('i', f.read(4))[0]
        height = struct.unpack('i', f.read(4))[0]
        orig_width = struct.unpack('i', f.read(4))[0]
        orig_height = struct.unpack('i', f.read(4))[0]
        faktor = struct.unpack('i', f.read(4))[0]
        
        blocks = []
        for ch in range(num_channels):
            num_blocks = struct.unpack('i', f.read(4))[0]
            channel_blocks = []
            
            for b in range(num_blocks):
                n = struct.unpack('i', f.read(4))[0]
                block_data = []
                
                for i in range(n):
                    value = struct.unpack('h', f.read(2))[0]  # int16_t
                    count = struct.unpack('i', f.read(4))[0]    # int32_t
                    block_data.append((value, count))
                
                channel_blocks.append(block_data)
            
            blocks.append(channel_blocks)
    
    return {
        'blocks': blocks,
        'width': width,
        'height': height,
        'orig_width': orig_width,
        'orig_height': orig_height,
        'faktor': faktor
    }


def compress_image_dct(image_path: str, output_path: str, faktor: int = 5) -> Dict:
    """
    Kompresira sliko z DCT algoritmom.
    Port iz C++ compressImage funkcije.
    
    Args:
        image_path: Pot do vhodne slike
        output_path: Pot za shranjevanje kompresirane datoteke (.dct)
        faktor: Faktor stiskanja (1-15), manjši = boljša kakovost
    
    Returns:
        Dictionary s statistiko:
        - original_size: Velikost originalne slike (bytes)
        - compressed_size: Velikost kompresirane datoteke (bytes)
        - ratio: Kompresijsko razmerje
        - time: Čas kompresije (sekunde)
    """
    import time
    start_time = time.time()
    
    # Naloži sliko
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Napaka: slike ni mogoče naložiti: {image_path}")
    
    # Razdeli na BGR kanale
    bgr_channels = cv2.split(img)
    rows, cols = img.shape[:2]
    
    # Prilagodi velikost, da je deljiva z 8
    new_rows = rows if rows % 8 == 0 else rows + (8 - rows % 8)
    new_cols = cols if cols % 8 == 0 else cols + (8 - cols % 8)
    
    # Padding za vsak kanal
    processed_channels = []
    for ch in bgr_channels:
        ch_float = ch.astype(np.float32)
        ch_float -= 128.0
        # Padding
        ch_padded = cv2.copyMakeBorder(ch_float, 0, new_rows - rows, 0, new_cols - cols, 
                                      cv2.BORDER_CONSTANT, value=0)
        processed_channels.append(ch_padded)
    
    # Kvantizacijska matrika
    Q = quant_matrix(faktor)
    
    # Obdelaj vsak kanal
    all_blocks = []
    
    for c in range(3):  # B, G, R
        channel_blocks = []
        
        for i in range(0, new_rows, 8):
            for j in range(0, new_cols, 8):
                # Izreži 8x8 blok
                block = processed_channels[c][i:i+8, j:j+8]
                
                # DCT
                F = fdct_8x8(block)
                
                # Kvantizacija
                Fq16 = apply_quant(F, Q)
                
                # Zigzag skeniranje
                zz = zigzag_scan(Fq16)
                
                # RLE kodiranje
                rle_encoded = rle_encode(zz)
                
                channel_blocks.append(rle_encoded)
        
        all_blocks.append(channel_blocks)
    
    # Shrani v binarno datoteko
    save_binary(all_blocks, output_path, new_cols, new_rows, cols, rows, faktor)
    
    # Statistika
    elapsed_time = time.time() - start_time
    original_size = os.path.getsize(image_path)
    compressed_size = os.path.getsize(output_path)
    ratio = original_size / compressed_size if compressed_size > 0 else 0
    
    return {
        'original_size': original_size,
        'compressed_size': compressed_size,
        'ratio': ratio,
        'time': elapsed_time
    }


def decompress_image_dct(compressed_path: str, output_path: str) -> Dict:
    """
    Dekompresira sliko iz DCT formata.
    Port iz C++ decompressImage funkcije.
    
    Args:
        compressed_path: Pot do kompresirane datoteke (.dct)
        output_path: Pot za shranjevanje dekompresirane slike
    
    Returns:
        Dictionary s statistiko:
        - width: Širina slike
        - height: Višina slike
        - time: Čas dekompresije (sekunde)
    """
    import time
    start_time = time.time()
    
    # Preberi binarno datoteko
    data = read_binary(compressed_path)
    
    W = data['width']
    H = data['height']
    Q = quant_matrix(data['faktor'])
    
    # Rekonstruiraj vsak kanal
    reconstructed_channels = []
    
    for c in range(len(data['blocks'])):
        rec = np.zeros((H, W), dtype=np.float32)
        idx = 0
        
        for y in range(0, H, 8):
            for x in range(0, W, 8):
                # RLE dekodiranje
                zz = rle_decode(data['blocks'][c][idx])
                
                # Zigzag nazaj v blok
                Fq16 = zigzag_to_block(zz)
                
                # Inverzna kvantizacija
                F = inverse_quant(Fq16, Q)
                
                # Inverzna DCT
                block = idct_8x8(F)
                
                # Dodaj 128
                block += 128.0
                
                # Kopiraj v rekonstruirano sliko
                rec[y:y+8, x:x+8] = block
                
                idx += 1
        
        # Pretvori v uint8
        rec_uint8 = np.clip(rec, 0, 255).astype(np.uint8)
        reconstructed_channels.append(rec_uint8)
    
    # Združi kanale
    color_img = cv2.merge(reconstructed_channels)
    
    # Obreži na originalno velikost
    cropped = color_img[0:data['orig_height'], 0:data['orig_width']]
    
    # Shrani
    cv2.imwrite(output_path, cropped)
    
    elapsed_time = time.time() - start_time
    
    return {
        'width': data['orig_width'],
        'height': data['orig_height'],
        'time': elapsed_time
    }


def compress_image_array(image_array: np.ndarray, faktor: int = 5) -> bytes:
    """
    Kompresira numpy array slike (ne datoteke).
    
    Args:
        image_array: numpy array slike (BGR format iz cv2, uint8)
        faktor: Faktor stiskanja (1-15)
    
    Returns:
        bytes: Kompresirani podatki (binarni format)
    """
    rows, cols = image_array.shape[:2]
    
    # Razdeli na BGR kanale
    bgr_channels = cv2.split(image_array)
    
    # Prilagodi velikost
    new_rows = rows if rows % 8 == 0 else rows + (8 - rows % 8)
    new_cols = cols if cols % 8 == 0 else cols + (8 - cols % 8)
    
    # Padding in pretvorba
    processed_channels = []
    for ch in bgr_channels:
        ch_float = ch.astype(np.float32)
        ch_float -= 128.0
        ch_padded = cv2.copyMakeBorder(ch_float, 0, new_rows - rows, 0, new_cols - cols,
                                      cv2.BORDER_CONSTANT, value=0)
        processed_channels.append(ch_padded)
    
    Q = quant_matrix(faktor)
    all_blocks = []
    
    for c in range(3):
        channel_blocks = []
        for i in range(0, new_rows, 8):
            for j in range(0, new_cols, 8):
                block = processed_channels[c][i:i+8, j:j+8]
                F = fdct_8x8(block)
                Fq16 = apply_quant(F, Q)
                zz = zigzag_scan(Fq16)
                rle_encoded = rle_encode(zz)
                channel_blocks.append(rle_encoded)
        all_blocks.append(channel_blocks)
    
    # Shrani v začasno datoteko in preberi kot bytes
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix='.dct') as tmp:
        tmp_path = tmp.name
    
    try:
        save_binary(all_blocks, tmp_path, new_cols, new_rows, cols, rows, faktor)
        with open(tmp_path, 'rb') as f:
            compressed_data = f.read()
        return compressed_data
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def decompress_to_array(compressed_data: bytes) -> np.ndarray:
    """
    Dekompresira v numpy array (ne datoteko).
    
    Args:
        compressed_data: bytes kompresiranih podatkov
    
    Returns:
        numpy array slike (BGR format, uint8)
    """
    # Shrani v začasno datoteko
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix='.dct') as tmp:
        tmp.write(compressed_data)
        tmp_path = tmp.name
    
    try:
        # Preberi z read_binary
        data = read_binary(tmp_path)
        W = data['width']
        H = data['height']
        Q = quant_matrix(data['faktor'])
        
        reconstructed_channels = []
        
        for c in range(len(data['blocks'])):
            rec = np.zeros((H, W), dtype=np.float32)
            idx = 0
            
            for y in range(0, H, 8):
                for x in range(0, W, 8):
                    zz = rle_decode(data['blocks'][c][idx])
                    Fq16 = zigzag_to_block(zz)
                    F = inverse_quant(Fq16, Q)
                    block = idct_8x8(F)
                    block += 128.0
                    rec[y:y+8, x:x+8] = block
                    idx += 1
            
            rec_uint8 = np.clip(rec, 0, 255).astype(np.uint8)
            reconstructed_channels.append(rec_uint8)
        
        color_img = cv2.merge(reconstructed_channels)
        cropped = color_img[0:data['orig_height'], 0:data['orig_width']]
        
        return cropped
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
