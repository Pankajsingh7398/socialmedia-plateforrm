const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/search', optionalAuth, userController.searchUsers);
router.get('/suggested', protect, userController.getSuggestedUsers);
router.get('/:username', optionalAuth, userController.getProfile);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ max: 50 }),
    body('bio').optional().isLength({ max: 160 }),
    body('location').optional().isLength({ max: 100 }),
  ],
  validate,
  userController.updateProfile
);

router.post(
  '/profile-image',
  protect,
  upload.single('image'),
  handleUploadError,
  userController.uploadProfileImage
);

router.post(
  '/cover-image',
  protect,
  upload.single('image'),
  handleUploadError,
  userController.uploadCoverImage
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  userController.changePassword
);

router.put('/settings', protect, userController.updateSettings);
router.delete('/account', protect, userController.deleteProfile);

module.exports = router;
