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

        await message.populate({ path: 'user', select: 'name' });

        // Trigger Pusher event — this replaces socket.emit
        await pusher.trigger(req.body.roomId, 'receiveMessage', {
            _id: message._id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt
        });

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (err) {
        console.log(err);
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
            .populate({ path: 'user', select: 'name' })
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

        message.text = req.body.text;
        await message.save();

        await message.populate({ path: 'user', select: 'name' });

        // 🔥 notify everyone
        await pusher.trigger(req.body.roomId, 'editMessage', {
            _id: message._id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt,
            room: message.room
        });
        
        res.status(200).json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cannot edit message" });
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

        await message.deleteOne();

        // 🔥 notify everyone
        await pusher.trigger(message.room, 'messageDeleted', {
            _id: req.params.id
        });

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cannot delete message" });
    }
};