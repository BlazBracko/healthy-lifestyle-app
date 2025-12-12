const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Pridobi uporabnika po ID
router.get('/:id', userController.getUserById);

// Pridobi vse uporabnike
router.get('/', userController.getAllUsers);

// Dodaj novega uporabnika
router.post('/register', userController.createUser);
router.post('/notif/:id', userController.sendNotification);

// Follow userja
// User routes
router.get('/follow-status/:userId', userController.getUsersWithFollowStatus);
router.post('/follow', userController.followUser);
router.post('/unfollow', userController.unfollowUser);
//Login
router.post('/login', userController.login);

// Upload profilne slike (mora biti pred :id route)
router.post('/:username/profile-photo', userController.uploadProfilePhotoMulter.single('photo'), userController.uploadProfilePhoto);

// Pridobi profilno sliko (mora biti pred :id route)
router.get('/:username/profile-photo', userController.getProfilePhoto);

// Posodobi obstoječega uporabnika
router.put('/:id', userController.updateUser);

// Izbriši uporabnika
router.delete('/:id', userController.deleteUser);

module.exports = router;
