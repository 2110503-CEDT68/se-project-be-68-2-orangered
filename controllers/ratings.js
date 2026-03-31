const Rating = require('../models/Rating');
const Reservation = require('../models/Reservation');
const Shop = require('../models/Shop');

// @desc    Get all ratings (admin) or ratings for a shop or by a user
// @route   GET /api/v1/ratings
// @route   GET /api/v1/shops/:shopId/ratings
// @access  Private
exports.getRatings = async (req, res, next) => {
    try {
        let query;

        if (req.params.shopId) {
            // Get all ratings for a specific shop
            query = Rating.find({ shop: req.params.shopId })
                .populate({ path: 'user', select: 'name' })
                .populate({ path: 'shop', select: 'name' });
        } else if (req.user.role !== 'admin') {
            // Regular user sees only their own ratings
            query = Rating.find({ user: req.user.id })
                .populate({ path: 'shop', select: 'name province tel' });
        } else {
            // Admin sees all ratings
            query = Rating.find()
                .populate({ path: 'user', select: 'name email' })
                .populate({ path: 'shop', select: 'name province' });
        }

        const ratings = await query;

        res.status(200).json({
            success: true,
            count: ratings.length,
            data: ratings
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot find ratings"
        });
    }
};

// @desc    Get single rating
// @route   GET /api/v1/ratings/:id
// @access  Private
exports.getRating = async (req, res, next) => {
    try {
        const rating = await Rating.findById(req.params.id)
            .populate({ path: 'user', select: 'name email' })
            .populate({ path: 'shop', select: 'name province tel' });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: `No rating with the id of ${req.params.id}`
            });
        }

        // Only owner or admin can view
        if (rating.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to view this rating`
            });
        }

        res.status(200).json({
            success: true,
            data: rating
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot find rating"
        });
    }
};

// @desc    Add rating
// @route   POST /api/v1/reservations/:reservationId/ratings
// @access  Private (user/admin)
exports.addRating = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.reservationId);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.reservationId}`
            });
        }

        // Only the reservation owner can rate
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to rate this reservation`
            });
        }

        // Reservation must be in the past
        if (new Date(reservation.appDate) > new Date()) {
            return res.status(400).json({
                success: false,
                message: "Cannot rate a reservation that hasn't occurred yet"
            });
        }

        // Check if this reservation was already rated
        const existingRating = await Rating.findOne({ reservation: req.params.reservationId });
        if (existingRating) {
            return res.status(400).json({
                success: false,
                message: "This reservation has already been rated"
            });
        }

        const rating = await Rating.create({
            user: req.user.id,
            shop: reservation.shop,
            reservation: reservation._id,
            score: req.body.score,
            review: req.body.review
        });

        res.status(201).json({
            success: true,
            data: rating
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot create rating"
        });
    }
};

// @desc    Update rating
// @route   PUT /api/v1/ratings/:id
// @access  Private (owner/admin)
exports.updateRating = async (req, res, next) => {
    try {
        let rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: `No rating with the id of ${req.params.id}`
            });
        }

        // Only owner or admin can update
        if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this rating`
            });
        }

        // Only allow score and review to be updated
        const { score, review } = req.body;

        rating = await Rating.findByIdAndUpdate(
            req.params.id,
            { score, review },
            { new: true, runValidators: true }
        );

        // Manually trigger shop average update since findByIdAndUpdate won't fire post('save')
        await updateShopRating(rating.shop);

        res.status(200).json({
            success: true,
            data: rating
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot update rating"
        });
    }
};

// @desc    Delete rating
// @route   DELETE /api/v1/ratings/:id
// @access  Private (owner/admin)
exports.deleteRating = async (req, res, next) => {
    try {
        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: `No rating with the id of ${req.params.id}`
            });
        }

        // Only owner or admin can delete
        if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this rating`
            });
        }

        const shopId = rating.shop;
        await rating.deleteOne();
        await updateShopRating(shopId);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot delete rating"
        });
    }
};

// Helper: recalculate and update shop's averageRating and ratingCount
async function updateShopRating(shopId) {
    const result = await Rating.aggregate([
        { $match: { shop: shopId } },
        { $group: { _id: '$shop', avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    if (result.length > 0) {
        await Shop.findByIdAndUpdate(shopId, {
            averageRating: Math.round(result[0].avgScore * 10) / 10,
            ratingCount: result[0].count
        });
    } else {
        await Shop.findByIdAndUpdate(shopId, { averageRating: 0, ratingCount: 0 });
    }
}