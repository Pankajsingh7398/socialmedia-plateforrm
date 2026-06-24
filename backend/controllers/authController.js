const User = require('../models/User');
const { generateToken, generateRandomToken, hashToken } = require('../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    const verificationToken = generateRandomToken();
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    try {
      await sendVerificationEmail(user, verificationToken);
    } catch {
      // Registration succeeds even if email fails
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = generateRandomToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch {
      // Don't reveal email failure
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
};

exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationToken = generateRandomToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};
