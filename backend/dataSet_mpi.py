#!/usr/bin/env python3
"""
Porazdeljena obdelava video frame-ov z OpenMPI.
Razdeli frame-e med procese in jih obdela paralelno.
"""

import sys
import json
import cv2
import os
import numpy as np
import subprocess
import socket
import time
from mpi4py import MPI

# MPI setup
comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

def preprocess_image(image):
    """Odstranjevanje šuma z Gaussovim zamegljevanjem"""
    blurred_image = cv2.GaussianBlur(image, (5, 5), 0)
    gray_image = cv2.cvtColor(blurred_image, cv2.COLOR_BGR2GRAY)
    return gray_image

def rotate_image(image, angle):
    """Rotacija slike za podani kot"""
    height, width = image.shape[:2]
    rotation_matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
    return cv2.warpAffine(image, rotation_matrix, (width, height))

def adjust_brightness(image, value=30):
    """Prilagoditev svetlosti slike"""
    if len(image.shape) == 2:  # Grayscale image
        return cv2.add(image, np.uint8(value))
    else:  # Color image
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = np.clip(v + value, 0, 255)
        final_hsv = cv2.merge((h, s, v))
        return cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)

def flip_image(image):
    """Horizontalno zrcaljenje slike"""
    return cv2.flip(image, 1)

def add_noise(image):
    """Dodajanje Gaussovega šuma"""
    row, col, ch = image.shape
    gauss = np.random.normal(0, 0.1**0.5, (row, col, ch))
    noisy_image = image + gauss * 255
    return noisy_image.astype('uint8')

def apply_translation(image, tx=50, ty=50):
    """Premik slike po x in y osi"""
    rows, cols = image.shape[:2]
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    return cv2.warpAffine(image, M, (cols, rows))

def change_contrast(image, contrast=1.5):
    """Sprememba kontrasta slike"""
    alpha = contrast
    adjusted = cv2.convertScaleAbs(image, alpha=alpha)
    return adjusted

def apply_zoom(image, zoom_factor=1.2):
    """Povečava (zoom) na sredino slike"""
    center_x, center_y = image.shape[1] // 2, image.shape[0] // 2
    width = int(image.shape[1] / zoom_factor)
    height = int(image.shape[0] / zoom_factor)
    cropped = image[center_y - height // 2:center_y + height // 2, center_x - width // 2:center_x + width // 2]
    return cv2.resize(cropped, (image.shape[1], image.shape[0]))

def save_augmented_images(image, directory, base_name, image_index):
    """
    Shrani sliko v direktorij.
    
    Returns:
        str: Pot do shranjene datoteke
    """
    if not os.path.exists(directory):
        os.makedirs(directory)
    file_path = os.path.join(directory, f'{base_name}_{image_index}.jpg')
    cv2.imwrite(file_path, image)
    return file_path

def extract_all_frames(video_path, frame_rate=20):
    """
    Ekstrahira vse frame-e iz videa.
    Samo master proces (rank 0) mora imeti dostop do video datoteke.
    """
    """
    Ekstrahira vse frame-e iz videa, ki jih je potrebno obdelati.
    
    Args:
        video_path: Pot do video datoteke
        frame_rate: Število frame-ov na sekundo za obdelavo
    
    Returns:
        List[tuple]: Seznam (frame_index, frame_array) parov
    """
    cap = cv2.VideoCapture(video_path)
    frames = []
    count = 0
    
    if not cap.isOpened():
        if rank == 0:
            print(json.dumps({"error": "Could not open video"}))
        return frames
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps // frame_rate) if fps > 0 else 1
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Only process certain frames to reduce workload
        if int(cap.get(cv2.CAP_PROP_POS_FRAMES)) % frame_interval == 0:
            frames.append((count, frame.copy()))
            count += 1
    
    cap.release()
    return frames

def process_single_frame(frame_data, username, save_path):
    """
    Obdela en frame in shrani vse augmentirane verzije.
    
    Args:
        frame_data: Tuple (frame_index, frame_array)
        username: Uporabniško ime
        save_path: Pot za shranjevanje slik
    
    Returns:
        List[str]: Seznam poti do shranjenih datotek
    """
    frame_index, frame = frame_data
    person_name = username
    saved_files = []
    
    # Preprocess
    processed_image = preprocess_image(frame)
    
    # Vse augmentacije
    bright = adjust_brightness(frame, 50)
    rotated = rotate_image(processed_image, 45)
    flipped = flip_image(processed_image)
    noisy = add_noise(frame)
    translation = apply_translation(frame)
    contrast = change_contrast(frame)
    zoom = apply_zoom(frame)
    
    # Shrani vse slike in zabeleži poti
    saved_files.append(save_augmented_images(frame, save_path, 'original', frame_index))
    saved_files.append(save_augmented_images(bright, save_path, 'bright', frame_index))
    # saved_files.append(save_augmented_images(rotated, save_path, 'rotated', frame_index))
    saved_files.append(save_augmented_images(flipped, save_path, 'flipped', frame_index))
    # saved_files.append(save_augmented_images(noisy, save_path, 'noisy', frame_index))
    saved_files.append(save_augmented_images(translation, save_path, 'translation', frame_index))
    saved_files.append(save_augmented_images(contrast, save_path, 'contrast', frame_index))
    # saved_files.append(save_augmented_images(zoom, save_path, 'zoom', frame_index))
    
    return saved_files

def split_frames(frames, num_processes):
    """
    Razdeli frame-e med procese.
    
    Args:
        frames: List[tuple] - seznam (index, frame) parov
        num_processes: Število procesov
    
    Returns:
        List[List[tuple]]: Seznam seznamov frame-ov za vsak proces
    """
    chunks = [[] for _ in range(num_processes)]
    for i, frame_data in enumerate(frames):
        chunks[i % num_processes].append(frame_data)
    return chunks

def process_video_mpi(video_path, username, save_path, worker_log_file=None):
    """
    Porazdeljena obdelava videa z MPI.
    
    Args:
        video_path: Pot do video datoteke
        username: Uporabniško ime
        save_path: Pot za shranjevanje slik (mora biti dostopna vsem procesom)
        worker_log_file: File objekt za lokalno logiranje (samo za worker procese)
    """
    if rank == 0:
        # Master proces: ekstrahira frame-e in jih razdeli
        # Preveri, ali video obstaja
        if not os.path.exists(video_path):
            print(json.dumps({"error": f"Video file not found: {video_path}"}), flush=True, file=sys.stdout)
            empty_chunks = [[] for _ in range(size)]
            frame_chunks = comm.scatter(empty_chunks, root=0)
            return
        
        print(json.dumps({"status": "extracting_frames", "rank": rank, "video": video_path}), flush=True)
        all_frames = extract_all_frames(video_path)
        total_frames = len(all_frames)
        print(json.dumps({"status": "frames_extracted", "count": total_frames, "rank": rank}), flush=True)
        
        if total_frames == 0:
            print(json.dumps({"error": "No frames extracted"}), flush=True)
            # Pošlji prazne sezname vsem procesom
            empty_chunks = [[] for _ in range(size)]
            frame_chunks = comm.scatter(empty_chunks, root=0)
            return
        
        # Razdeli frame-e med procese
        frame_chunks = split_frames(all_frames, size)
    else:
        # Delavci: pripravijo se za prejem
        frame_chunks = None
    
    # Scatter frame-ov - vsak proces dobi svoj del
    my_frames = comm.scatter(frame_chunks, root=0)
    
    # Izpiši status za vse procese
    # Master: stdout (zbrano na master), Worker: lokalna log datoteka (že odprta zgoraj)
    output_stream = sys.stdout if rank == 0 else sys.stderr
    
    print(json.dumps({
        "status": "processing_started",
        "rank": rank,
        "hostname": socket.gethostname(),
        "frames": len(my_frames),
        "save_path": save_path
    }), flush=True, file=output_stream)
    
    # Obdelaj svoje frame-e in zberi poti do shranjenih datotek
    processed_count = 0
    all_saved_files = []
    
    # Worker: izpiši tudi lokalno v log datoteko
    if rank != 0 and worker_log_file:
        print(f"\n[WORKER {rank} @ {socket.gethostname()}] Začenjam obdelavo {len(my_frames)} frame-ov...", flush=True, file=worker_log_file)
        print(f"[WORKER {rank}] Shranjujem v: {save_path}", flush=True, file=worker_log_file)
    
    print(json.dumps({
        "status": "worker_started_processing",
        "rank": rank,
        "hostname": socket.gethostname(),
        "total_frames_to_process": len(my_frames)
    }), flush=True, file=output_stream)
    
    for frame_data in my_frames:
        try:
            saved_files = process_single_frame(frame_data, username, save_path)
            all_saved_files.extend(saved_files)
            processed_count += 1
            
            # Progress update vsakih 5 frame-ov z več informacijami
            if processed_count % 5 == 0:
                progress_json = json.dumps({
                    "status": "progress",
                    "rank": rank,
                    "hostname": socket.gethostname(),
                    "processed": processed_count,
                    "total": len(my_frames),
                    "files_saved": len(all_saved_files)
                })
                print(progress_json, flush=True, file=output_stream)
                
                # Worker: izpiši tudi lokalno v log datoteko
                if rank != 0 and worker_log_file:
                    percentage = (processed_count / len(my_frames)) * 100 if len(my_frames) > 0 else 0
                    print(f"[WORKER {rank}] Napredek: {processed_count}/{len(my_frames)} frame-ov ({percentage:.1f}%), shranjenih {len(all_saved_files)} datotek", flush=True, file=worker_log_file)
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "rank": rank,
                "hostname": socket.gethostname(),
                "error": str(e),
                "frame_index": frame_data[0] if frame_data else None
            }), flush=True, file=sys.stderr)
    
    # Gather rezultatov - pošlji število obdelanih frame-ov in seznam datotek nazaj master procesu
    all_counts = comm.gather(processed_count, root=0)
    all_file_lists = comm.gather(all_saved_files, root=0)
    
    # Worker: izpiši, da je poslal datoteke in čaka na kopiranje
    if rank != 0 and worker_log_file:
        print(f"[WORKER {rank}] Poslal {len(all_saved_files)} datotek master procesu", flush=True, file=worker_log_file)
        print(f"[WORKER {rank}] Čakam na master za kopiranje datotek...", flush=True, file=worker_log_file)
    
    if rank == 0:
        total_processed = sum(all_counts) if all_counts else 0
        print(json.dumps({"status": "processing_completed", "total_frames": total_processed, "rank": rank}), flush=True)
        
        # Kopiraj datoteke z worker računalnikov na master
        print(json.dumps({"status": "copying_files", "rank": rank}), flush=True)
        
        # Pošlji sporočilo vsem worker procesom, da je master začel kopirati
        for worker_rank in range(1, size):
            try:
                comm.send({"status": "master_started_copying"}, dest=worker_rank, tag=100)
            except:
                pass  # Če worker ni več aktiven, preskoči
        # Uporabi absolutno pot do backend/learnPhotos
        # Če je __file__ definiran, uporabi ga, sicer uporabi znano pot
        try:
            script_file = __file__
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(script_file)))
        except NameError:
            # __file__ ni definiran (izvajanje preko exec), uporabi znano pot
            backend_dir = '/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend'
        master_save_path = os.path.join(backend_dir, 'learnPhotos', username)
        if not os.path.exists(master_save_path):
            os.makedirs(master_save_path)
        
        copied_count = 0
        for rank_idx, file_list in enumerate(all_file_lists):
            if rank_idx == 0:
                # Master datoteke - preveri in kopiraj v master_save_path
                print(json.dumps({"status": "checking_master_files", "count": len(file_list), "rank": rank}), flush=True)
                for file_path in file_list:
                    filename = os.path.basename(file_path)
                    dest_path = os.path.join(master_save_path, filename)
                    
                    # Preveri, ali datoteka že obstaja na pravem mestu
                    if os.path.exists(dest_path):
                        copied_count += 1
                        continue
                    
                    # Poskusi najti datoteko na različnih lokacijah
                    possible_sources = []
                    
                    # 1. Relativna pot iz trenutnega direktorija
                    if not os.path.isabs(file_path):
                        possible_sources.append(os.path.join(os.getcwd(), file_path))
                        possible_sources.append(os.path.join(backend_dir, file_path))
                    
                    # 2. Absolutna pot direktno
                    if os.path.isabs(file_path):
                        possible_sources.append(file_path)
                    
                    # 3. V master save_path (morda že obstaja)
                    possible_sources.append(dest_path)
                    
                    # 4. V hla_backend direktoriju (če se izvaja od tam)
                    hla_backend_path = os.path.join('/Users/blazbracko/hla_backend', file_path)
                    possible_sources.append(hla_backend_path)
                    
                    found = False
                    for source_path in possible_sources:
                        if os.path.exists(source_path):
                            # Kopiraj v master_save_path
                            try:
                                import shutil
                                shutil.copy2(source_path, dest_path)
                                copied_count += 1
                                found = True
                                break
                            except Exception as e:
                                print(json.dumps({
                                    "status": "copy_master_error",
                                    "source": source_path,
                                    "dest": dest_path,
                                    "error": str(e)
                                }), flush=True, file=sys.stderr)
                    
                    if not found:
                        print(json.dumps({
                            "status": "master_file_not_found",
                            "file": file_path,
                            "filename": filename,
                            "dest": dest_path,
                            "tried_sources": possible_sources
                        }), flush=True, file=sys.stderr)
            else:
                # Kopiraj datoteke z worker računalnika
                for file_path in file_list:
                    try:
                        # Določi worker hostname
                        worker_host = "valbracko@192.168.50.244"
                        # Določi lokalno ime datoteke
                        filename = os.path.basename(file_path)
                        dest_path = os.path.join(master_save_path, filename)
                        
                        # Preveri, ali datoteka že obstaja (ne prepisuj)
                        if os.path.exists(dest_path):
                            copied_count += 1
                            continue
                        
                        # Kopiraj preko SCP
                        scp_command = ['scp', f'{worker_host}:{file_path}', dest_path]
                        result = subprocess.run(scp_command, capture_output=True, text=True, timeout=30)
                        
                        if result.returncode == 0:
                            copied_count += 1
                        else:
                            print(json.dumps({
                                "status": "copy_error",
                                "file": file_path,
                                "error": result.stderr
                            }), flush=True, file=sys.stderr)
                    except Exception as e:
                        print(json.dumps({
                            "status": "copy_exception",
                            "file": file_path,
                            "error": str(e)
                        }), flush=True, file=sys.stderr)
        
        print(json.dumps({
            "status": "completed",
            "total_frames": total_processed,
            "files_copied": copied_count,
            "rank": rank
        }), flush=True)
        
        # Pošlji sporočilo vsem worker procesom, da je master končal kopiranje
        for worker_rank in range(1, size):
            try:
                comm.send({"status": "master_finished_copying", "files_copied": copied_count}, dest=worker_rank, tag=101)
            except:
                pass  # Če worker ni več aktiven, preskoči
    else:
        # Worker: počakaj na sporočilo od master procesa, da je začel kopirati
        try:
            # Poskusi prejeti sporočilo od master procesa (non-blocking)
            status = MPI.Status()
            if comm.Iprobe(source=0, tag=100, status=status):
                copy_msg = comm.recv(source=0, tag=100)
                if worker_log_file:
                    print(f"[WORKER {rank}] Master je začel kopirati datoteke...", flush=True, file=worker_log_file)
        except:
            pass  # Če ni sporočila, ni problema
        
        # Worker: izpiši lokalno v log datoteko
        if worker_log_file:
            print(f"\n[WORKER {rank} @ {socket.gethostname()}] ✅ Obdelava končana!", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Obdelanih: {processed_count} frame-ov", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Shranjenih: {len(all_saved_files)} datotek", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Lokacija: {save_path}", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Poslal datoteke master procesu za kopiranje", flush=True, file=worker_log_file)
            
            # Počakaj malo in preveri, ali master kopira
            time.sleep(0.5)  # Kratek delay za master, da začne kopirati
            
            # Poskusi prejeti sporočilo od master procesa
            try:
                status = MPI.Status()
                if comm.Iprobe(source=0, tag=100, status=status):
                    copy_msg = comm.recv(source=0, tag=100)
                    print(f"[WORKER {rank}] Master je začel kopirati datoteke...", flush=True, file=worker_log_file)
            except:
                pass
            
            print(f"[WORKER {rank}] Čakam na končanje kopiranja...", flush=True, file=worker_log_file)
            
            # Počakaj na sporočilo, da je master končal kopiranje
            try:
                finished_msg = comm.recv(source=0, tag=101)
                if finished_msg.get("status") == "master_finished_copying":
                    files_copied = finished_msg.get("files_copied", 0)
                    print(f"[WORKER {rank}] ✅ Master je končal kopiranje!", flush=True, file=worker_log_file)
                    print(f"[WORKER {rank}] Skupaj kopiranih datotek: {files_copied}", flush=True, file=worker_log_file)
            except:
                # Če ne prejme sporočila, ni problema
                pass
            
            print(f"[WORKER {rank}] Proces končan.\n", flush=True, file=worker_log_file)
            worker_log_file.close()
        
        print(json.dumps({
            "status": "processing_completed",
            "rank": rank,
            "hostname": socket.gethostname(),
            "processed": processed_count,
            "files_saved": len(all_saved_files),
            "save_path": save_path
        }), flush=True, file=output_stream)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        if rank == 0:
            print(json.dumps({"error": "No video path or username provided"}), flush=True)
        sys.exit(1)
    
    video_path = sys.argv[1]
    username = sys.argv[2]
    
    # Preveri, ali je video_path absolutna pot, če ne, poskusi najti na worker
    hostname = socket.gethostname()
    
    # Če je worker računalnik in video ne obstaja, poskusi z worker potjo
    if rank != 0 and not os.path.exists(video_path):
        # Worker računalnik - video mora biti kopiran lokalno
        video_basename = os.path.basename(video_path)
        worker_video_path = os.path.expanduser(f'~/hla_backend/{video_basename}')
        if os.path.exists(worker_video_path):
            video_path = worker_video_path
            print(json.dumps({"status": "using_worker_video", "path": video_path, "rank": rank}), flush=True)
        else:
            # Poskusi z absolutno potjo
            abs_worker_video = f'/Users/valbracko/hla_backend/{video_basename}'
            if os.path.exists(abs_worker_video):
                video_path = abs_worker_video
                print(json.dumps({"status": "using_worker_video_abs", "path": video_path, "rank": rank}), flush=True)
            else:
                print(json.dumps({"error": f"Video not found on worker: {video_path}, {worker_video_path}, or {abs_worker_video}", "rank": rank}), flush=True)
    
    # Pot za shranjevanje - vsak proces shranjuje lokalno
    # Master shranjuje direktno v learnPhotos, worker v lokalni direktorij
    if rank == 0:
        # Master: shrani direktno v learnPhotos
        save_path = os.path.join('learnPhotos', username)
    else:
        # Worker: shrani lokalno, nato bomo kopirali nazaj
        worker_local_dir = os.path.expanduser('~/hla_backend/learnPhotos')
        if not os.path.exists(worker_local_dir):
            os.makedirs(worker_local_dir)
        save_path = os.path.join(worker_local_dir, username)
    
    # Worker: pripravi lokalno log datoteko
    worker_log_file = None
    if rank != 0:
        log_dir = os.path.expanduser('~/hla_backend/logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        log_file_path = os.path.join(log_dir, f'worker_{rank}_{username}.log')
        try:
            worker_log_file = open(log_file_path, 'w', buffering=1)  # Line buffered
            print(f"\n{'='*60}", flush=True, file=worker_log_file)
            print(f"[WORKER {rank} @ {socket.gethostname()}] MPI proces zagnan", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Video: {os.path.basename(video_path)}", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Uporabnik: {username}", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Shranjujem v: {save_path}", flush=True, file=worker_log_file)
            print(f"[WORKER {rank}] Log datoteka: {log_file_path}", flush=True, file=worker_log_file)
            print(f"{'='*60}\n", flush=True, file=worker_log_file)
        except Exception as e:
            worker_log_file = None
            print(f"[WORKER {rank}] Napaka pri odpiranju log datoteke: {e}", file=sys.stderr, flush=True)
    
    if rank == 0:
        print(json.dumps({
            "status": "mpi_started",
            "rank": rank,
            "size": size,
            "video": video_path,
            "user": username,
            "save_path": save_path
        }), flush=True, file=sys.stdout)
    
    try:
        process_video_mpi(video_path, username, save_path, worker_log_file)
    except Exception as e:
        print(json.dumps({
            "status": "fatal_error",
            "rank": rank,
            "error": str(e)
        }), flush=True, file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
    
    if rank == 0:
        print(json.dumps({"status": "done"}), flush=True)
