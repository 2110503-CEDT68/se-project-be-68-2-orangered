const express = require('express');
const {getShop, getShops, createShop, updateShop, deleteShop} = require('../controllers/shops')

// Include other resource routers
const reservationRouter = require('./reservations');
const ratingRouter = require('./ratings');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

// Re-route into other resource router
router.use('/:shopId/reservations/', reservationRouter);
router.use('/:shopId/rating', ratingRouter);
router.route('/').get(getShops).post(protect, authorize('shopowner', 'admin'), createShop);
router.route('/:id').get(getShop).put(protect, authorize('shopowner', 'admin'), updateShop).delete(protect, authorize('shopowner', 'admin'), deleteShop);

module.exports = router; 