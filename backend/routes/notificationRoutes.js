const express = require('express');
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, notificationController.getNotifications);
router.get('/unread-count', protect, notificationController.getUnreadCount);
router.put('/:id/read', protect, notificationController.markAsRead);
router.put('/read-all', protect, notificationController.markAllAsRead);

module.exports = router;
