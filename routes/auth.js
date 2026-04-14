const express = require('express');

const {register, login, getMe, updateMe, getAll, adminUpdateUser, logout, uploadAvatar, deactivateUser, hardDeleteUser} = require('../controllers/auth');
const {googleLogin} = require('../controllers/oAuth');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/avatar', protect, uploadAvatar);
router.get('/all', protect, authorize('admin'), getAll);
router.put('/:id', protect, authorize('admin'), adminUpdateUser);
router.delete('/:id/hard', protect, authorize('admin'), hardDeleteUser);
router.delete('/:id', protect, authorize('admin'), deactivateUser);
router.get('/logout', logout)


module.exports = router;

