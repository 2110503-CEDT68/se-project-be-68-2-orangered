const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'MS_Users',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  history: [
    {
      text: { type: String },
      editedAt: { type: Date }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);
