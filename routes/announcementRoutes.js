const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET: ดึงข้อมูลประกาศทั้งหมด
router.get('/', async (req, res) => {
    try {
        // ดึงข้อมูลและเรียงจากใหม่ไปเก่า (desc)
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: สร้างประกาศใหม่
router.post('/', async (req, res) => {
    try {
        // 🌟 แก้ไข: รับ imageUrl เข้ามาด้วย
        const { title, content, imageUrl } = req.body; 
        const newAnnouncement = await Announcement.create({ title, content, imageUrl });
        res.status(201).json({ success: true, data: newAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT: แก้ไขประกาศ
router.put('/:id', async (req, res) => {
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

// DELETE: ลบประกาศ
router.delete('/:id', async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบสำเร็จ" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;