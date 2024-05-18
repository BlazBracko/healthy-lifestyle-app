const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Pridobi vse uporabnike
router.get('/', userController.getAllUsers);

// Pridobi uporabnika po ID
router.get('/:id', userController.getUserById);

// Dodaj novega uporabnika
router.post('/', userController.createUser);

// Posodobi obstoječega uporabnika
router.put('/:id', userController.updateUser);

// Izbriši uporabnika
router.delete('/:id', userController.deleteUser);

module.exports = router;
