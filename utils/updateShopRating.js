const Rating = require('../models/Rating');
const Shop = require('../models/Shop');

// Helper: recalculate and update shop's averageRating and ratingCount
exports.updateShopRating = async (shopId) => {
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