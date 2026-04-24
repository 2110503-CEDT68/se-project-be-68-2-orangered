const express = require('express');
const router = express.Router();
const {
    getShopAnnouncements,
    getAllAnnouncements,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcements');
const { protect, authorize } = require('../middleware/auth');

router.get('/shop/:shopId', getShopAnnouncements);
router.get('/all', getAllAnnouncements);
router.get('/', protect, authorize('admin', 'shopowner'), getAnnouncements);
router.post('/', protect, authorize('admin', 'shopowner'), createAnnouncement);
router.put('/:id', protect, authorize('admin', 'shopowner'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin', 'shopowner'), deleteAnnouncement);

module.exports = router;
