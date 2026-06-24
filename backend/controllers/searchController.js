const Post = require('../models/Post');
const User = require('../models/User');

exports.search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ success: true, users: [], posts: [], hashtags: [] });
    }

    const query = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const results = { users: [], posts: [], hashtags: [] };

    if (type === 'all' || type === 'users') {
      const regex = new RegExp(query.replace('#', ''), 'i');
      results.users = await User.find({
        $or: [{ name: regex }, { username: regex }],
      })
        .select('name username profileImage bio followers')
        .limit(parseInt(limit));
    }

    if (type === 'all' || type === 'posts') {
      const regex = new RegExp(query.replace('#', ''), 'i');
      results.posts = await Post.find({
        $or: [{ caption: regex }, { hashtags: regex }],
      })
        .populate('userId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      results.posts = results.posts.map((p) => ({
        ...p.toObject(),
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
      }));
    }

    if (type === 'all' || type === 'hashtags') {
      const tag = query.startsWith('#') ? query.slice(1).toLowerCase() : query.toLowerCase();
      const hashtagPosts = await Post.find({ hashtags: tag })
        .populate('userId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .limit(5);

      results.hashtags = [{
        tag,
        count: await Post.countDocuments({ hashtags: tag }),
        recentPosts: hashtagPosts.map((p) => ({
          ...p.toObject(),
          likesCount: p.likes.length,
          commentsCount: p.comments.length,
        })),
      }];
    }

    res.json({ success: true, ...results });
  } catch (error) {
    next(error);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(`^${q}`, 'i');
    const [users, hashtags] = await Promise.all([
      User.find({ $or: [{ username: regex }, { name: regex }] })
        .select('name username profileImage')
        .limit(5),
      Post.aggregate([
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $regex: new RegExp(`^${q.replace('#', '')}`, 'i') } } },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const suggestions = [
      ...users.map((u) => ({ type: 'user', ...u.toObject() })),
      ...hashtags.map((h) => ({ type: 'hashtag', tag: h._id, count: h.count })),
    ];

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};
