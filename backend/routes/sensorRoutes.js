const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController'); 

// Pridobi vse podatke iz senzorjev
router.get('/', sensorController.getAllSensorData);

// Pridobi podatke iz senzorjev po ID
router.get('/:id', sensorController.getSensorDataById);

// Dodaj nove podatke iz senzorja
router.post('/', sensorController.createSensorData);

// Posodobi obstoječe podatke iz senzorjev
router.put('/:id', sensorController.updateSensorData);

// Izbriši podatke iz senzorjev
router.delete('/:id', sensorController.deleteSensorData);

module.exports = router;
