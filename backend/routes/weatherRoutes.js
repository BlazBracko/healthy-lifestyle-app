const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Ustvari novo vreme
router.post('/', weatherController.createWeather);

// Pridobi vse vremenske napovedi
router.get('/', weatherController.getAllWeather);

// Pridobi vreme po ID
router.get('/:id', weatherController.getWeatherById);

// Posodobi vreme
router.put('/:id', weatherController.updateWeather);

// Izbriše vreme
router.delete('/:id', weatherController.deleteWeather);

module.exports = router;
