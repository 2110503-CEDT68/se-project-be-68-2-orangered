const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Shop = require('../models/Shop');
// const { }
const { protect, authorize } = require('../middleware/auth');

// GET: ดึงข้อมูลประกาศของร้านเฉพาะร้าน (Public)
router.get('/shop/:shopId', async (req, res) => {
    try {
        const announcements = await Announcement.find({ shop: req.params.shopId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: ดึงข้อมูลประกาศทั้งหมด (กรองตามร้านถ้าเป็น shopowner)
router.get('/', protect, authorize('admin', 'shopowner'), async (req, res) => {
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
});

// POST: สร้างประกาศใหม่ (admin หรือ shop owner เท่านั้น)
router.post('/', protect, authorize('admin', 'shopowner'), async (req, res) => {
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
});

// PUT: แก้ไขประกาศ (admin หรือ shop owner เท่านั้น)
router.put('/:id', protect, authorize('admin', 'shopowner'), async (req, res) => {
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
});

// DELETE: ลบประกาศ (admin หรือ shop owner เท่านั้น)
router.delete('/:id', protect, authorize('admin', 'shopowner'), async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบสำเร็จ" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;