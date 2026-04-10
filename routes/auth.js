const express = require('express');

const {register, login, getMe, getAll, logout, uploadAvatar, deactivateUser} = require('../controllers/auth');
const {googleLogin} = require('../controllers/oAuth');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.get('/all', protect, authorize('admin'), getAll);
router.put('/avatar', protect, uploadAvatar);
router.delete('/:id', protect, authorize('admin'), deactivateUser);
router.get('/logout', logout)


module.exports = router;

