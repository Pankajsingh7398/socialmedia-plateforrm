const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { handleUploadError } = require('../middleware/upload');
const storyController = require('../controllers/storyController');

const router = express.Router();

router.get('/feed', protect, storyController.getFeedStories);
router.post('/', protect, upload.single('media'), handleUploadError, storyController.createStory);
router.get('/:id', protect, storyController.viewStory);
router.post('/:id/react', protect, storyController.reactToStory);
router.post('/:id/reply', protect, storyController.replyToStory);
router.get('/:id/viewers', protect, storyController.getStoryViewers);
router.delete('/:id', protect, storyController.deleteStory);

module.exports = router;
