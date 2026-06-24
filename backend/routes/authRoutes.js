const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post('/verify-email', [body('token').notEmpty()], validate, authController.verifyEmail);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  authController.resetPassword
);

router.get('/me', protect, authController.getMe);
router.post('/resend-verification', protect, authController.resendVerification);

module.exports = router;
