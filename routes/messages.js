const express = require('express');
const { sendMessage, getMessages, editMessage, deleteMessage, getRooms } = require('../controllers/messages');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, sendMessage);
// Must come before /:id routes to avoid Express matching "shop" as an id
router.route('/shop/:shopId/rooms').get(protect, getRooms);
router.route('/:id')
  .put(protect, editMessage)
  .delete(protect, deleteMessage);
router.route('/:roomId').get(protect, getMessages);

module.exports = router;