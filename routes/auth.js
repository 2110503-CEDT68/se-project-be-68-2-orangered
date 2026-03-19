const express = require('express');

const {register, login, getMe, getAll, logout} = require('../controllers/auth');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/all', protect, authorize('admin'), getAll);
router.get('/logout', logout)


module.exports = router;

