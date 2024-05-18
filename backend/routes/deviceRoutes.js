const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Pridobi vse naprave
router.get('/', deviceController.getAllDevices);

// Pridobi napravo po ID
router.get('/:id', deviceController.getDeviceById);

// Dodaj novo napravo
router.post('/', deviceController.createDevice);

// Posodobi obstoječo napravo
router.put('/:id', deviceController.updateDevice);

// Izbriši napravo
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
