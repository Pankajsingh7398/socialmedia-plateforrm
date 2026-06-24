const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', protect, messageController.getConversations);
router.get('/conversations/search', protect, messageController.searchConversations);
router.get('/unread-count', protect, messageController.getUnreadCount);
router.get('/with/:username', protect, messageController.getOrCreateConversation);
router.get('/:id/messages', protect, messageController.getMessages);
router.post('/:id/messages', protect, upload.single('media'), handleUploadError, messageController.sendMessage);

module.exports = router;
