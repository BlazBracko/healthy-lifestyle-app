const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController'); // Prilagodite pot, če je potrebno


// Pridobi aktivnosti uporabnika
router.get('/user/:userId', activityController.getUserActivities);

// Pridobi aktivnost po ID
router.get('/:id', activityController.getActivityById);

// Pridobi vse aktivnosti
router.get('/', activityController.getAllActivities);

// Dodaj novo aktivnost
router.post('/', activityController.createActivity);

router.post('/update', activityController.updateActivityData);
router.post('/end', activityController.endActivity);


// Posodobi obstoječo aktivnost
router.put('/:id', activityController.updateActivity);

// Izbriši aktivnost
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
