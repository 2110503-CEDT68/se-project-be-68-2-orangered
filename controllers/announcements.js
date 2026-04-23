const Announcement = require('../models/Announcement');
const Shop = require('../models/Shop');

// @desc    Get all announcements for a specific shop (Public)
// @route   GET /api/v1/announcements/shop/:shopId
exports.getShopAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ shop: req.params.shopId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all announcements from all shops (Public)
// @route   GET /api/v1/announcements/all
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('shop', 'name picture').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get announcements (filtered by shop for shopowner, all for admin)
// @route   GET /api/v1/announcements
exports.getAnnouncements = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'shopowner') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (shop) {
                query.shop = shop._id;
            } else {
                return res.status(200).json({ success: true, data: [] });
            }
        }
        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new announcement
// @route   POST /api/v1/announcements
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;

        let shopId;
        if (req.user.role === 'shopowner') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (!shop) {
                return res.status(404).json({ success: false, message: 'Shop not found for this user' });
            }
            shopId = shop._id;
        } else {
            shopId = req.body.shop;
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            imageUrl,
            shop: shopId
        });
        res.status(201).json({ success: true, data: newAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update an announcement
// @route   PUT /api/v1/announcements/:id
exports.updateAnnouncement = async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedAnnouncement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/v1/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.status(200).json({ success: true, message: 'ลบสำเร็จ' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
