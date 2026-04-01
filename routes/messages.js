const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messages');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:roomId').get(protect, getMessages);

module.exports = router;