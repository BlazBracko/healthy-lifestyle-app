const express = require('express');
const router = express.Router();
const { uploadVideo, processVideo } = require('../controllers/recognitionController');

// Updated to handle video upload
router.post('/', uploadVideo.single('video'), processVideo);

module.exports = router;
