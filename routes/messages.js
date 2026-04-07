const express = require('express');
const { sendMessage, getMessages, editMessage, deleteMessage } = require('../controllers/messages');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:id')
  .put(protect, editMessage)
  .delete(protect, deleteMessage);
router.route('/:roomId').get(protect, getMessages);

module.exports = router;