const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

exports.getStats = async (req, res, next) => {
  try {
    const [users, posts, reels, reports] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Reel.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    const recentUsers = await User.find().select('name username email createdAt role').sort({ createdAt: -1 }).limit(10);
    const pendingReports = await Report.find({ status: 'pending' })
      .populate('reporterId', 'name username')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      stats: { users, posts, reels, pendingReports: reports },
      recentUsers,
      pendingReports,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name username email role isVerified createdAt followers').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { role, isVerified } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, isVerified }, { new: true })
      .select('name username email role isVerified');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    await Comment.deleteMany({ postId: req.params.id });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
