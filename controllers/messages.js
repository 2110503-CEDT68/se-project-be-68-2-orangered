// controllers/messages.js
const Message = require('../models/Message');
const Pusher = require('pusher');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// @desc    Send message
// @route   POST /api/v1/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const message = await Message.create({
            room: req.body.roomId,
            user: req.user.id,
            text: req.body.text
        });

        await message.populate({ path: 'user', select: 'name profilePicture' });

        // Trigger Pusher event on the private room channel
        await pusher.trigger(req.body.roomId, 'receiveMessage', {
            _id: message._id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt
        });

        // Notify the shop channel so admin inbox stays up-to-date
        // roomId format is "<shopId>_<userId>" — extract shopId as everything before the last "_"
        const parts = req.body.roomId.split('_');
        if (parts.length === 2) {
            const shopId = parts[0];
            await pusher.trigger(shopId, 'shopRoom', {
                room: req.body.roomId,
                user: { _id: message.user._id, name: message.user.name, profilePicture: message.user.profilePicture }
            });
        }

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Cannot send message"
        });
    }
};

// @desc    Get chat history for a room
// @route   GET /api/v1/messages/:roomId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const messages = await Message.find({ room: req.params.roomId })
            .populate({ path: 'user', select: 'name profilePicture' })
            .sort('createdAt');

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot get messages"
        });
    }
};

// @desc    Edit message
// @route   PUT /api/v1/messages/:id
exports.editMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Only allow owner to edit
        if (message.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Push current version to history before overwriting
        message.history.push({
            text: message.text,
            editedAt: message.editedAt || message.createdAt
        });
        message.text = req.body.text;
        message.editedAt = new Date();
        await message.save();

        await message.populate({ path: 'user', select: 'name profilePicture' });

        // 🔥 notify everyone
        await pusher.trigger(message.room, 'messageUpdated', {
            _id: message._id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt,
            editedAt: message.editedAt,
            history: message.history,
            room: message.room
        });
        
        res.status(200).json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cannot edit message" });
    }
};

// @desc    Get all user rooms for a shop (admin only)
// @route   GET /api/v1/messages/shop/:shopId/rooms
// @access  Private (admin)
exports.getRooms = async (req, res) => {
    try {
        const shopId = req.params.shopId;

        // Only admin or the shop owner can view all rooms
        if (req.user.role !== 'admin') {
            const Shop = require('../models/Shop');
            const shop = await Shop.findById(shopId);
            if (!shop || shop.owner.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: "Not authorized to view this shop's chats" });
            }
        }

        const rooms = await Message.distinct('room', {
            room: new RegExp(`^${shopId}_`)
        });

        const User = require('../models/Users');
        const userIds = rooms.map(room => room.split(`${shopId}_`)[1]).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }).select('name');

        const result = rooms.map(room => {
            const userId = room.split(`${shopId}_`)[1];
            const user = users.find(u => u._id.toString() === userId);
            return user ? { room, user: { _id: user._id, name: user.name } } : null;
        }).filter(Boolean);

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Cannot get rooms" });
    }
};

// @desc    Delete message
// @route   DELETE /api/v1/messages/:id
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        message.deleted = true;
        await message.save();

        // 🔥 notify everyone
        await pusher.trigger(message.room, 'messageDeleted', {
            _id: req.params.id
        });

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cannot delete message" });
    }
};