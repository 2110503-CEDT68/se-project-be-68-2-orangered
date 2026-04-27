const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    shop: {
        type: mongoose.Schema.ObjectId,
        ref: 'Shop',
        required: true
    },
    imagePosition: { 
        type: String, 
        default: 'center' 
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Announcement', AnnouncementSchema);