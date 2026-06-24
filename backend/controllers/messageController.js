const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { uploadImage } = require('../utils/uploadHelper');
const { createNotification } = require('../utils/notifications');

const getOtherParticipant = (conversation, userId) =>
  conversation.participants.find((p) => p.toString() !== userId.toString());

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name username profileImage isOnline lastSeen')
      .sort({ lastMessageAt: -1 });

    const enriched = await Promise.all(conversations.map(async (conv) => {
      const other = conv.participants.find((p) => p._id.toString() !== req.user._id.toString());
      const unread = conv.unreadCounts?.get?.(req.user._id.toString()) || conv.unreadCounts?.[req.user._id.toString()] || 0;
      return {
        _id: conv._id,
        otherUser: other,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unread,
      };
    }));

    res.json({ success: true, conversations: enriched });
  } catch (error) {
    next(error);
  }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { username } = req.params;
    const otherUser = await User.findOne({ username: username.toLowerCase() });
    if (!otherUser) return res.status(404).json({ success: false, message: 'User not found' });
    if (otherUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUser._id], $size: 2 },
    }).populate('participants', 'name username profileImage isOnline lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, otherUser._id],
        unreadCounts: new Map(),
      });
      await conversation.populate('participants', 'name username profileImage isOnline lastSeen');
    }

    res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId: req.params.id })
      .populate('senderId', 'name username profileImage')
      .sort({ createdAt: 1 })
      .limit(100);

    conversation.unreadCounts.set(req.user._id.toString(), 0);
    await conversation.save();

    const unreadMsgs = messages.filter((m) =>
      m.senderId._id.toString() !== req.user._id.toString() &&
      !m.readBy.some((id) => id.toString() === req.user._id.toString())
    );
    await Promise.all(unreadMsgs.map((m) => {
      m.readBy.push(req.user._id);
      return m.save();
    }));

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let media = {};
    if (req.file) {
      const result = await uploadImage(req.file.buffer, req.file.originalname);
      media = { url: result.url, publicId: result.publicId, type: 'image' };
    }

    const text = req.body.text || '';
    if (!text && !media.url) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text,
      media,
      readBy: [req.user._id],
    });

    conversation.lastMessage = text || '📷 Photo';
    conversation.lastMessageAt = new Date();
    const otherId = getOtherParticipant(conversation, req.user._id);
    const currentUnread = conversation.unreadCounts.get(otherId.toString()) || 0;
    conversation.unreadCounts.set(otherId.toString(), currentUnread + 1);
    await conversation.save();

    await message.populate('senderId', 'name username profileImage');

    await createNotification({
      senderId: req.user._id,
      receiverId: otherId,
      type: 'message',
      referenceId: conversation._id,
      message: 'sent you a message',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${otherId}`).emit('new_message', { message, conversationId: conversation._id });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    let total = 0;
    conversations.forEach((c) => {
      total += c.unreadCounts?.get?.(req.user._id.toString()) || c.unreadCounts?.[req.user._id.toString()] || 0;
    });
    res.json({ success: true, unreadCount: total });
  } catch (error) {
    next(error);
  }
};

exports.searchConversations = async (req, res, next) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ name: regex }, { username: regex }],
      _id: { $ne: req.user._id },
    }).select('name username profileImage isOnline').limit(10);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};
