const express = require('express');
const router = express.Router();
const { upload, processVideo, processPhoto } = require('../controllers/recognitionController');

router.post('/user/:username', upload.single('photo'), processPhoto);
// Updated to handle video upload
router.post('/:username', upload.single('video'), processVideo);

module.exports = router;
