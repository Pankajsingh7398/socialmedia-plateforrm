const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const postController = require('../controllers/postController');

const router = express.Router();

router.get('/drafts', protect, postController.getDrafts);
router.get('/feed', protect, postController.getFeed);
router.get('/trending', optionalAuth, postController.getTrending);
router.get('/latest', optionalAuth, postController.getLatest);
router.get('/user/:username', optionalAuth, postController.getUserPosts);

router.post(
  '/',
  protect,
  upload.array('images', 10),
  handleUploadError,
  [body('caption').optional().isLength({ max: 2200 })],
  validate,
  postController.createPost
);

router.get('/:id', optionalAuth, postController.getPost);

router.put(
  '/:id',
  protect,
  [body('caption').optional().isLength({ max: 2200 })],
  validate,
  postController.updatePost
);

router.delete('/:id', protect, postController.deletePost);
router.post('/:id/like', protect, postController.toggleLikePost);
router.post('/:id/share', protect, postController.sharePost);
router.post('/:id/pin', protect, postController.pinPost);
router.post('/:id/vote', protect, postController.votePoll);

module.exports = router;
