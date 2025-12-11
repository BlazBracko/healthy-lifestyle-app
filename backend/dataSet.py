import sys
import json
import cv2
import os
import numpy as np

def preprocess_image(image):
    # Odstranjevanje šuma z Gaussovim zamegljevanjem
    blurred_image = cv2.GaussianBlur(image, (5, 5), 0)
    # Pretvorba v sivinske tone
    gray_image = cv2.cvtColor(blurred_image, cv2.COLOR_BGR2GRAY)
    return gray_image

def rotate_image(image, angle):
    height, width = image.shape[:2]
    rotation_matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
    return cv2.warpAffine(image, rotation_matrix, (width, height))

def adjust_brightness(image, value=30):
    if len(image.shape) == 2:  # Grayscale image
        return cv2.add(image, np.uint8(value))
    else:  # Color image
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = np.clip(v + value, 0, 255)
        final_hsv = cv2.merge((h, s, v))
        return cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)


def flip_image(image):
    return cv2.flip(image, 1)

def add_noise(image):
    row, col, ch = image.shape
    gauss = np.random.normal(0, 0.1**0.5, (row, col, ch))
    noisy_image = image + gauss * 255
    return noisy_image.astype('uint8')

def apply_translation(image, tx=50, ty=50):
    rows, cols = image.shape[:2]
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    return cv2.warpAffine(image, M, (cols, rows))

def change_contrast(image, contrast=1.5):
    alpha = contrast  # Simple contrast control
    adjusted = cv2.convertScaleAbs(image, alpha=alpha)
    return adjusted

def apply_zoom(image, zoom_factor=1.2):
    center_x, center_y = image.shape[1] // 2, image.shape[0] // 2
    width = int(image.shape[1] / zoom_factor)
    height = int(image.shape[0] / zoom_factor)
    cropped = image[center_y - height // 2:center_y + height // 2, center_x - width // 2:center_x + width // 2]
    return cv2.resize(cropped, (image.shape[1], image.shape[0]))


def save_augmented_images(image, directory, base_name, image_index):
    if not os.path.exists(directory):
        os.makedirs(directory)
    cv2.imwrite(os.path.join(directory, f'{base_name}_{image_index}.jpg'), image)

def process_video(video_path, username):
    cap = cv2.VideoCapture(video_path)
    try:
        if not cap.isOpened():
            print("Error: Could not open video.")
            return

        frame_rate = 20  # frames to process per second
        count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Only process certain frames to reduce workload
            if int(cap.get(cv2.CAP_PROP_POS_FRAMES)) % int(cap.get(cv2.CAP_PROP_FPS) // frame_rate) == 0:
                processed_image = preprocess_image(frame)  # this now returns a grayscale image
                person_name = username

                # Ensure operations compatible with grayscale are handled
                bright = adjust_brightness(frame, 50)  # Apply brightness on the original frame
                rotated = rotate_image(processed_image, 45)
                flipped = flip_image(processed_image)
                noisy = add_noise(frame)  # Apply noise on the original frame
                translation = apply_translation(frame)  
                contrast = change_contrast(frame)  
                zoom = apply_zoom(frame) 

                # Save all images
                save_augmented_images(frame, 'learnPhotos/' + person_name, 'original', count)
                save_augmented_images(bright, 'learnPhotos/' + person_name, 'bright', count)
                # save_augmented_images(rotated, 'learnPhotos/' + person_name, 'rotated', count)
                save_augmented_images(flipped, 'learnPhotos/' + person_name, 'flipped', count)
                # save_augmented_images(noisy, 'learnPhotos/' + person_name, 'noisy', count)
                save_augmented_images(translation, 'learnPhotos/' + person_name, 'translation', count)
                save_augmented_images(contrast, 'learnPhotos/' + person_name, 'contrast', count)
                # save_augmented_images(zoom, 'learnPhotos/' + person_name, 'nozoomisy', count)
                count += 1

        cap.release()
        print("Done processing video.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        cap.release()
        print("Released video resources.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        username = sys.argv[2]
        print(f"Processing video: {video_path}")
        process_video(video_path, username)
    else:
        print(json.dumps({"error": "No video path provided"}))