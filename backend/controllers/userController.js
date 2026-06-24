const User = require('../models/User');
const Post = require('../models/Post');
const { uploadImage, deleteImage } = require('../utils/uploadHelper');

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject({ virtuals: true }) : { ...user };
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.resetPasswordToken;
  return obj;
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('followers', 'name username profileImage')
      .populate('following', 'name username profileImage');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOwner = req.user && req.user._id.toString() === user._id.toString();
    const isFollowing = req.user && user.followers.some((f) => f._id.toString() === req.user._id.toString());

    if (user.privacy.profileVisibility === 'private' && !isOwner && !isFollowing) {
      return res.status(403).json({ success: false, message: 'This profile is private' });
    }

    if (!isOwner && req.user) {
      await User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } });
    }

    const postCount = await Post.countDocuments({ userId: user._id, isDraft: { $ne: true } });

    res.json({
      success: true,
      user: {
        ...sanitizeUser(user),
        postCount,
        isFollowing: !!isFollowing,
        isOwner: !!isOwner,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'location', 'website', 'socialLinks'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const user = await User.findById(req.user._id);
    if (user.profileImage) {
      const oldId = user.profileImage.split('/').pop();
      await deleteImage(oldId);
    }

    const result = await uploadImage(req.file.buffer, req.file.originalname);
    user.profileImage = result.url;
    await user.save();

    res.json({ success: true, profileImage: result.url, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.uploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const user = await User.findById(req.user._id);
    if (user.coverImage) {
      const oldId = user.coverImage.split('/').pop();
      await deleteImage(oldId);
    }

    const result = await uploadImage(req.file.buffer, req.file.originalname);
    user.coverImage = result.url;
    await user.save();

    res.json({ success: true, coverImage: result.url, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Notification = require('../models/Notification');

    const userPosts = await Post.find({ userId }).select('images');
    for (const post of userPosts) {
      for (const img of post.images) {
        if (img.publicId) await deleteImage(img.publicId);
      }
    }

    await Promise.all([
      Post.deleteMany({ userId }),
      Comment.deleteMany({ userId }),
      Notification.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
      User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
      User.updateMany({ following: userId }, { $pull: { following: userId } }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { privacy, notificationPreferences } = req.body;
    const updates = {};

    if (privacy) updates.privacy = { ...req.user.privacy?.toObject?.() || req.user.privacy, ...privacy };
    if (notificationPreferences) {
      updates.notificationPreferences = {
        ...req.user.notificationPreferences?.toObject?.() || req.user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excludeIds = [...currentUser.following, currentUser._id];

    const suggested = await User.find({ _id: { $nin: excludeIds } })
      .select('name username profileImage bio followers')
      .sort({ followers: -1 })
      .limit(parseInt(req.query.limit) || 5);

    res.json({ success: true, users: suggested });
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, users: [], pagination: { page: 1, total: 0 } });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const regex = new RegExp(q.trim(), 'i');

    const [users, total] = await Promise.all([
      User.find({ $or: [{ name: regex }, { username: regex }] })
        .select('name username profileImage bio followers')
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments({ $or: [{ name: regex }, { username: regex }] }),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
