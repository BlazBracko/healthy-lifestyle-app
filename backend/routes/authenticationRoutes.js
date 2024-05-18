const express = require('express');
const router = express.Router();
const authenticationController = require('../controllers/authenticationController');

// Ustvari novo avtentikacijo
router.post('/', authenticationController.createAuthentication);

// Pridobi avtentikacijo po ID
router.get('/:id', authenticationController.getAuthenticationById);

// Posodobi obstoječo avtentikacijo (npr. preveri avtentikacijo)
router.put('/:id', authenticationController.updateAuthentication);

module.exports = router;
