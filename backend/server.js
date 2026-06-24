const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const { initSocket } = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const storyRoutes = require('./routes/storyRoutes');
const reelRoutes = require('./routes/reelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

connectDB();
configureCloudinary();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [/localhost/, /127\.0\.0\.1/],
    credentials: true,
  },
});

app.set('io', io);
initSocket(io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, process.env.CLIENT_URL || true);
    }
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Pulse API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`Pulse server running on port ${PORT}`);
});

module.exports = app;
