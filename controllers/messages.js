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