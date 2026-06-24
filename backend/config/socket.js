const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit('user_online', { userId });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { userId, conversationId });
    });

    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user_offline', { userId });
    });
  });

  logger.info('Socket.io initialized');
};

module.exports = { initSocket };
