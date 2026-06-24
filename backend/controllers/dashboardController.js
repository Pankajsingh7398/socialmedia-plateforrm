const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [postCount, user, posts, recentNotifications] = await Promise.all([
      Post.countDocuments({ userId }),
      User.findById(userId),
      Post.find({ userId }).select('likes comments createdAt caption'),
      Notification.find({ receiverId: userId })
        .populate('senderId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const totalLikesReceived = posts.reduce((sum, p) => {
      const r = p.reactions || {};
      return sum + (r.like?.length || 0) + (r.love?.length || 0) + (r.laugh?.length || 0) + (r.wow?.length || 0) + (p.likes?.length || 0);
    }, 0);
    const totalCommentsReceived = posts.reduce((sum, p) => sum + p.comments.length, 0);

    const recentPosts = posts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        caption: p.caption?.substring(0, 80),
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
        createdAt: p.createdAt,
      }));

    res.json({
      success: true,
      stats: {
        postCount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        totalLikesReceived,
        totalCommentsReceived,
        profileViews: user.profileViews || 0,
      },
      recentPosts,
      recentActivity: recentNotifications,
    });
  } catch (error) {
    next(error);
  }
};
