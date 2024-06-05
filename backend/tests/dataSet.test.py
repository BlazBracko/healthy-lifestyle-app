import unittest
from unittest.mock import MagicMock, patch, mock_open
import numpy as np
import cv2
import sys
import os 
import dataSet

class TestDataSet(unittest.TestCase):
    def setUp(self):
        # Mock cv2 functions
        self.image = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.imread = MagicMock(return_value=self.image)
        cv2.imwrite = MagicMock()
        cv2.VideoCapture = MagicMock()
        cv2.cvtColor = MagicMock(return_value=self.image)
        cv2.GaussianBlur = MagicMock(return_value=self.image)
        cv2.getRotationMatrix2D = MagicMock()
        cv2.warpAffine = MagicMock(return_value=self.image)
        cv2.add = MagicMock(return_value=self.image)
        cv2.cvtColor = MagicMock(return_value=self.image)
        cv2.flip = MagicMock(return_value=self.image)
        cv2.split = MagicMock(return_value=(self.image, self.image, self.image))
        cv2.merge = MagicMock(return_value=self.image)
        cv2.convertScaleAbs = MagicMock(return_value=self.image)
        cv2.resize = MagicMock(return_value=self.image)
        
        # Mock os functions
        os.path.exists = MagicMock(return_value=True)
        os.makedirs = MagicMock()

    @patch('cv2.VideoCapture')
    def test_process_video(self, mock_capture):
        # Setup mock for video capture and frame reading
        cap_instance = mock_capture.return_value
        cap_instance.isOpened.return_value = True
        cap_instance.read.side_effect = [(True, self.image), (False, None)]  # Returns one frame then stops
        cap_instance.get.return_value = 30  # Mock FPS to 30

        # Call the function
        dataSet.process_video('dummy_path.mp4')
        
        # Check if the correct calls were made
        self.assertEqual(cv2.imwrite.call_count, 8)  # Checks if all augmentations were saved
        mock_capture.assert_called_with('dummy_path.mp4')
        self.assertTrue(cap_instance.release.called)

    def test_preprocess_image(self):
        # Test the preprocessing of an image
        result = dataSet.preprocess_image(self.image)
        self.assertTrue(np.array_equal(result, self.image))  # Just checks the return due to MagicMock

    def test_rotate_image(self):
        # Test image rotation
        result = dataSet.rotate_image(self.image, 45)
        cv2.getRotationMatrix2D.assert_called_with((50, 50), 45, 1)
        self.assertTrue(np.array_equal(result, self.image))

    def test_adjust_brightness(self):
        # Test brightness adjustment
        result = dataSet.adjust_brightness(self.image, 30)
        self.assertTrue(np.array_equal(result, self.image))

    # Additional test cases for each image transformation function...

if __name__ == '__main__':
    unittest.main()