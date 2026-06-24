const Post = require('../models/Post');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { enrichPost, enrichReel, populateAuthor } = require('../utils/postHelper');

exports.getExplore = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [trendingPosts, trendingReels, suggestedUsers, hashtagAgg] = await Promise.all([
      Post.find({ createdAt: { $gte: oneWeekAgo }, isDraft: { $ne: true } })
        .populate(populateAuthor)
        .sort({ views: -1, createdAt: -1 })
        .limit(12),
      Reel.find().populate(populateAuthor).sort({ views: -1 }).limit(8),
      User.find({ _id: { $ne: req.user?._id } })
        .select('name username profileImage bio followers isVerified')
        .sort({ followers: -1 })
        .limit(6),
      Post.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $unwind: '$hashtags' },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      trendingPosts: trendingPosts.map((p) => enrichPost(p, req.user?._id)),
      trendingReels: trendingReels.map((r) => enrichReel(r, req.user?._id)),
      suggestedUsers,
      trendingHashtags: hashtagAgg.map((h) => ({ tag: h._id, count: h.count })),
    });
  } catch (error) {
    next(error);
  }
};
