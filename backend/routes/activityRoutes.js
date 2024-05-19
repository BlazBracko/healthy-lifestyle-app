const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController'); // Prilagodite pot, če je potrebno

// Pridobi vse aktivnosti
router.get('/', activityController.getAllActivities);

// Pridobi aktivnost po ID
router.get('/:id', activityController.getActivityById);

// Dodaj novo aktivnost
router.post('/', activityController.createActivity);

// Posodobi obstoječo aktivnost
router.put('/:id', activityController.updateActivity);

// Izbriši aktivnost
router.delete('/:id', activityController.deleteActivity);

module.exports = router;