const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    shop: {
        type: mongoose.Schema.ObjectId,
        ref: 'Shop',
        required: true
    }
}, { timestamps: true }); // timestamps จะสร้าง createdAt และ updatedAt ให้อัตโนมัติ

module.exports = mongoose.model('Announcement', AnnouncementSchema);