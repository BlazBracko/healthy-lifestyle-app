const express = require('express');
const router = express.Router();
const { upload, recognizeFace } = require('../controllers/recognitionController');

router.post('/', upload.single('photo'), recognizeFace);

module.exports = router;
