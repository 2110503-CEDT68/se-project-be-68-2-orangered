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