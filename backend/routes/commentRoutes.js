const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

const router = express.Router();

router.get('/post/:postId', optionalAuth, commentController.getComments);

router.post(
  '/post/:postId',
  protect,
  [
    body('text').trim().notEmpty().isLength({ max: 1000 }),
    body('parentCommentId').optional().isMongoId(),
  ],
  validate,
  commentController.addComment
);

router.put(
  '/:id',
  protect,
  [body('text').trim().notEmpty().isLength({ max: 1000 })],
  validate,
  commentController.updateComment
);

router.delete('/:id', protect, commentController.deleteComment);
router.post('/:id/like', protect, commentController.toggleLikeComment);

module.exports = router;
