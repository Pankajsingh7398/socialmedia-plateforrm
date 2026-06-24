const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const { enrichPost, enrichReel, populateAuthor } = require('../utils/postHelper');

exports.toggleBookmark = async (req, res, next) => {
  try {
    const { postId, reelId } = req.body;
    if (!postId && !reelId) {
      return res.status(400).json({ success: false, message: 'postId or reelId required' });
    }

    const query = { userId: req.user._id, ...(postId ? { postId } : { reelId }) };
    const existing = await Bookmark.findOne(query);

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      if (postId) await Post.findByIdAndUpdate(postId, { $pull: { saves: req.user._id } });
      if (reelId) await Reel.findByIdAndUpdate(reelId, { $pull: { saves: req.user._id } });
      return res.json({ success: true, saved: false });
    }

    await Bookmark.create({ userId: req.user._id, postId, reelId });
    if (postId) await Post.findByIdAndUpdate(postId, { $addToSet: { saves: req.user._id } });
    if (reelId) await Reel.findByIdAndUpdate(reelId, { $addToSet: { saves: req.user._id } });

    res.json({ success: true, saved: true });
  } catch (error) {
    next(error);
  }
};

exports.getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const postIds = bookmarks.filter((b) => b.postId).map((b) => b.postId);
    const reelIds = bookmarks.filter((b) => b.reelId).map((b) => b.reelId);

    const [posts, reels] = await Promise.all([
      Post.find({ _id: { $in: postIds } }).populate(populateAuthor),
      Reel.find({ _id: { $in: reelIds } }).populate(populateAuthor),
    ]);

    res.json({
      success: true,
      posts: posts.map((p) => enrichPost(p, req.user._id)),
      reels: reels.map((r) => enrichReel(r, req.user._id)),
    });
  } catch (error) {
    next(error);
  }
};
