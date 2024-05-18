const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Pridobi vsa sporočila
router.get('/', messageController.getAllMessages);

// Pridobi sporočilo po ID
router.get('/:id', messageController.getMessageById);

// Dodaj novo sporočilo
router.post('/', messageController.createMessage);

// Posodobi obstoječe sporočilo
router.put('/:id', messageController.updateMessage);

// Izbriši sporočilo
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
