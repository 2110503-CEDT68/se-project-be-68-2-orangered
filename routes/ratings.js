const express = require('express');
const {
    getRatings,
    getRating,
    addRating,
    updateRating,
    deleteRating
} = require('../controllers/ratings');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, getRatings)
    .post(protect, authorize('admin', 'user'), addRating);

router.route('/:id')
    .get(protect, getRating)
    .put(protect, authorize('admin', 'user'), updateRating)
    .delete(protect, authorize('admin', 'user'), deleteRating);

module.exports = router;