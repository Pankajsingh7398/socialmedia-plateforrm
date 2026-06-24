const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['follow', 'like_post', 'like_comment', 'comment', 'reply', 'story_reply', 'message', 'follow_request', 'reaction'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ receiverId: 1, createdAt: -1 });
notificationSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
