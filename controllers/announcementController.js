// backend/controllers/announcementController.js
const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
exports.getAnnouncements = async (req, res) => {
    try {
        // ดึงข้อมูลทั้งหมด และเรียงจากล่าสุดไปเก่าสุด
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.getAnnouncement = async (req, res) => {
    try {
        let query = {};
        // ถ้าเป็น shopowner ให้ดึงเฉพาะประกาศของร้านตัวเอง
        if (req.user.role === 'shopowner') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (shop) {
                query.shop = shop._id;
            } else {
                return res.status(200).json({ success: true, data: [] });
            }
        }
        
        // ดึงข้อมูลและเรียงจากใหม่ไปเก่า (desc)
        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

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
            // ถ้าเป็น admin ให้ใส่ shop id จาก body ได้เลย
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
}

exports.editAnnouncement = async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบสำเร็จ" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}