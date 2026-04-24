const mongoose = require('mongoose');

const DeletedUserEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    role: {
        type: String,
        enum: ['user', 'shopowner', 'admin'],
        default: 'user'
    },
    originalUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MS_Users',
    },
    deletedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DeletedUserEmail', DeletedUserEmailSchema);