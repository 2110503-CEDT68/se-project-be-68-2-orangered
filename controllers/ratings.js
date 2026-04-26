const Rating = require('../models/Rating');
const Reservation = require('../models/Reservation');
const Shop = require('../models/Shop');
const { updateShopRating } = require("../utils/updateShopRating")

// @desc    Get all ratings (admin) or ratings for a shop or by a user
// @route   GET /api/v1/ratings
// @route   GET /api/v1/shops/:shopId/rating
// @access  Public for shop ratings, private for user/admin listing
exports.getRatings = async (req, res, next) => {
    try {
        let query;

        if (req.params.shopId) {
            // Get all ratings for a specific shop
            query = Rating.find({ shop: req.params.shopId })
                .populate({ path: 'user', select: 'name profilePicture' })
                .populate({ path: 'shop', select: 'name' });
        } else if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route"
            });
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
        return res.status(500).json({
            success: false,
            message: "Cannot find ratings"
        });
    }
};

// @desc    Get single rating
// @route   GET /api/v1/ratings/:id
// @access  Public
exports.getRating = async (req, res, next) => {
    try {
        const rating = await Rating.findById(req.params.id)
            .populate({ path: 'user', select: 'name profilePicture' })
            .populate({ path: 'shop', select: 'name province tel' });

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: `No rating with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: rating
        });
    } catch (err) {
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
        let reservation = null;
        let shopId = req.params.shopId || req.body.shop;

        if (req.params.reservationId) {
            reservation = await Reservation.findById(req.params.reservationId);

            if (!reservation) {
                return res.status(404).json({
                    success: false,
                    message: `No reservation with the id of ${req.params.reservationId}`
                });
            }

            shopId = reservation.shop;

            // Only the reservation owner can rate
            if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: `User ${req.user.id} is not authorized to rate this reservation`
                });
            }

            // Reservation must be in the past for regular users
            if (req.user.role !== 'admin' && new Date(reservation.appDate) > new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot rate a reservation that hasn't occurred yet"
                });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: "Reservation is required to create a rating"
            });
        }

        if (!shopId) {
            return res.status(400).json({
                success: false,
                message: "Shop is required to create a rating"
            });
        }

        if (req.user.role !== 'admin') {
            const userRatingCount = await Rating.countDocuments({ 
                user: req.user.id,
                shop: shopId
            });
            if (userRatingCount >= 5) {
                return res.status(400).json({
                    success: false,
                    message: "You can review this shop at most 5 times. Please edit or delete one of your old reviews first."
                });
            }
        }

        const score = Number(req.body.score);

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({
                success: false,
                message: "Please select a star rating between 1 and 5"
            });
        }

        const rating = await Rating.create({
            user: req.user.id,
            shop: shopId,
            reservation: reservation?._id || null,
            score: req.body.score,
            review: req.body.review
        });

        await updateShopRating(shopId);

        res.status(201).json({
            success: true,
            data: rating
        });
    } catch (err) {
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

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({
                success: false,
                message: "Please select a star rating between 1 and 5"
            });
        }

        // Manually trigger shop average update since findByIdAndUpdate won't fire post('save')
        await updateShopRating(rating.shop);

        res.status(200).json({
            success: true,
            data: rating
        });
    } catch (err) {
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
        return res.status(500).json({
            success: false,
            message: "Cannot delete rating"
        });
    }
};
