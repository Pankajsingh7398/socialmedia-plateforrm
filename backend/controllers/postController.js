const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { uploadImage, uploadVideo, deleteImage } = require('../utils/uploadHelper');
const { createNotification } = require('../utils/notifications');
const { populateAuthor, enrichPost } = require('../utils/postHelper');

exports.createPost = async (req, res, next) => {
  try {
    const { caption, location, audience, isDraft, scheduledAt, poll, gif } = req.body;
    const images = [];
    let video = null;

    if (req.files?.length) {
      for (const file of req.files) {
        if (file.mimetype.startsWith('video/')) {
          video = await uploadVideo(file.buffer, file.originalname);
        } else {
          images.push(await uploadImage(file.buffer, file.originalname));
        }
      }
    }

    if (!caption && images.length === 0 && !video && !gif) {
      return res.status(400).json({ success: false, message: 'Post must have content' });
    }

    let pollData = null;
    if (poll) {
      const parsed = typeof poll === 'string' ? JSON.parse(poll) : poll;
      pollData = {
        question: parsed.question,
        options: parsed.options.map((o) => ({ text: o, votes: [] })),
        expiresAt: parsed.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    const post = await Post.create({
      userId: req.user._id,
      caption: caption || '',
      images,
      video,
      gif: gif ? { url: gif } : undefined,
      location: location || '',
      audience: audience || 'public',
      isDraft: isDraft === 'true' || isDraft === true,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      poll: pollData,
      reactions: { like: [], love: [], laugh: [], wow: [] },
    });

    await post.populate(populateAuthor);
    res.status(201).json({ success: true, post: enrichPost(post, req.user._id) });
  } catch (error) {
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate(populateAuthor)
      .populate({
        path: 'comments',
        populate: [
          { path: 'userId', select: 'name username profileImage' },
          {
            path: 'replies',
            populate: { path: 'userId', select: 'name username profileImage' },
          },
        ],
      });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (req.user) post.views += 1;
    await post.save();

    res.json({
      success: true,
      post: enrichPost(post, req.user?._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    if (req.body.caption !== undefined) post.caption = req.body.caption;
    await post.save();
    await post.populate(populateAuthor);

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    for (const img of post.images) {
      if (img.publicId) await deleteImage(img.publicId);
    }

    await Comment.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(post._id);

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [posts, total] = await Promise.all([
      Post.find({ userId: user._id })
        .populate(populateAuthor)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments({ userId: user._id }),
    ]);

    const enriched = posts.map((post) => enrichPost(post, req.user?._id));

    res.json({
      success: true,
      posts: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const currentUser = await User.findById(req.user._id);
    const followingIds = [...currentUser.following, req.user._id];

    const [posts, total] = await Promise.all([
      Post.find({ userId: { $in: followingIds }, isDraft: { $ne: true }, $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] })
        .populate(populateAuthor)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments({ userId: { $in: followingIds }, isDraft: { $ne: true } }),
    ]);

    const enriched = posts.map((post) => enrichPost(post, req.user._id));

    res.json({
      success: true,
      posts: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrending = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } })
      .populate(populateAuthor)
      .sort({ createdAt: -1 });

    const sorted = posts
      .map((p) => ({ post: p, score: p.likes.length * 2 + p.comments.length }))
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + parseInt(limit))
      .map(({ post }) => enrichPost(post, req.user?._id));

    res.json({ success: true, posts: sorted });
  } catch (error) {
    next(error);
  }
};

exports.getLatest = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find()
        .populate(populateAuthor)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(),
    ]);

    const enriched = posts.map((post) => enrichPost(post, req.user?._id));

    res.json({
      success: true,
      posts: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleLikePost = async (req, res, next) => {
  try {
    const { reaction = 'like' } = req.body;
    const valid = ['like', 'love', 'laugh', 'wow'];
    if (!valid.includes(reaction)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!post.reactions) post.reactions = { like: [], love: [], laugh: [], wow: [] };
    const userId = req.user._id.toString();
    let active = null;

    valid.forEach((t) => {
      post.reactions[t] = (post.reactions[t] || []).filter((id) => id.toString() !== userId);
    });

    const existing = valid.find((t) =>
      (post.reactions[t] || []).some((id) => id.toString() === userId)
    );

    if (!existing) {
      post.reactions[reaction].push(req.user._id);
      active = reaction;
      await createNotification({
        senderId: req.user._id,
        receiverId: post.userId,
        type: 'reaction',
        referenceId: post._id,
        message: `reacted ${reaction} to your post`,
      });
    }

    await post.save();
    const likesCount = valid.reduce((s, t) => s + (post.reactions[t]?.length || 0), 0);

    res.json({ success: true, reaction: active, likesCount, reactionCounts: Object.fromEntries(valid.map((t) => [t, post.reactions[t]?.length || 0])) });
  } catch (error) {
    next(error);
  }
};

exports.sharePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, shares: post.shares });
  } catch (error) {
    next(error);
  }
};

exports.pinPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ success: true, isPinned: post.isPinned });
  } catch (error) {
    next(error);
  }
};

exports.votePoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post?.poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    post.poll.options.forEach((o) => {
      o.votes = o.votes.filter((id) => id.toString() !== req.user._id.toString());
    });
    post.poll.options[optionIndex].votes.push(req.user._id);
    await post.save();
    res.json({ success: true, poll: post.poll });
  } catch (error) {
    next(error);
  }
};

exports.getDrafts = async (req, res, next) => {
  try {
    const posts = await Post.find({ userId: req.user._id, isDraft: true })
      .populate(populateAuthor)
      .sort({ updatedAt: -1 });
    res.json({ success: true, posts: posts.map((p) => enrichPost(p, req.user._id)) });
  } catch (error) {
    next(error);
  }
};
