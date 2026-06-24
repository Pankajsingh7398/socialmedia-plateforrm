const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadVideo, handleUploadError } = require('../middleware/upload');
const reelController = require('../controllers/reelController');

const router = express.Router();

router.get('/', optionalAuth, reelController.getReels);
router.post('/', protect, uploadVideo.single('video'), handleUploadError, reelController.createReel);
router.get('/:id', optionalAuth, reelController.getReel);
router.post('/:id/like', protect, reelController.toggleLikeReel);
router.post('/:id/save', protect, reelController.toggleSaveReel);
router.delete('/:id', protect, reelController.deleteReel);

module.exports = router;
