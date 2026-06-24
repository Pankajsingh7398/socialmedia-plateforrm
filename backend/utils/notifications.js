const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ senderId, receiverId, type, referenceId, message }) => {
  if (senderId.toString() === receiverId.toString()) return null;

  const receiver = await User.findById(receiverId).select('notificationPreferences');
  if (!receiver) return null;

  const prefMap = {
    follow: 'follows',
    follow_request: 'follows',
    like_post: 'likes',
    like_comment: 'likes',
    reaction: 'likes',
    comment: 'comments',
    reply: 'replies',
    story_reply: 'stories',
    message: 'messages',
  };

  const prefKey = prefMap[type];
  if (prefKey && receiver.notificationPreferences?.[prefKey] === false) {
    return null;
  }

  const notification = await Notification.create({
    senderId,
    receiverId,
    type,
    referenceId,
    message,
  });

  return notification;
};

module.exports = { createNotification };
