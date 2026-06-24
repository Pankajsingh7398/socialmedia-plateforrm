const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createNotification } = require('../utils/notifications');

exports.addComment = async (req, res, next) => {
  try {
    const { text, parentCommentId } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent || parent.postId.toString() !== post._id.toString()) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment' });
      }
    }

    const comment = await Comment.create({
      userId: req.user._id,
      postId: post._id,
      parentCommentId: parentCommentId || null,
      text,
    });

    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
      });

      const parent = await Comment.findById(parentCommentId);
      await createNotification({
        senderId: req.user._id,
        receiverId: parent.userId,
        type: 'reply',
        referenceId: comment._id,
        message: 'replied to your comment',
      });
    } else {
      post.comments.push(comment._id);
      await post.save();

      await createNotification({
        senderId: req.user._id,
        receiverId: post.userId,
        type: 'comment',
        referenceId: comment._id,
        message: 'commented on your post',
      });
    }

    await comment.populate('userId', 'name username profileImage');

    res.status(201).json({
      success: true,
      comment: {
        ...comment.toObject(),
        likesCount: 0,
        isLiked: false,
      },
      commentsCount: post.comments.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({
      postId: req.params.postId,
      parentCommentId: null,
    })
      .populate('userId', 'name username profileImage')
      .populate({
        path: 'replies',
        populate: { path: 'userId', select: 'name username profileImage' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const enriched = comments.map((c) => ({
      ...c.toObject(),
      likesCount: c.likes.length,
      isLiked: req.user ? c.likes.some((id) => id.toString() === req.user._id.toString()) : false,
      replies: (c.replies || []).map((r) => ({
        ...r.toObject(),
        likesCount: r.likes.length,
        isLiked: req.user ? r.likes.some((id) => id.toString() === req.user._id.toString()) : false,
      })),
    }));

    res.json({ success: true, comments: enriched });
  } catch (error) {
    next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.text = req.body.text;
    await comment.save();
    await comment.populate('userId', 'name username profileImage');

    res.json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, {
        $pull: { replies: comment._id },
      });
    } else {
      await Post.findByIdAndUpdate(comment.postId, {
        $pull: { comments: comment._id },
      });
    }

    await Comment.deleteMany({ parentCommentId: comment._id });
    await Comment.findByIdAndDelete(comment._id);

    const post = await Post.findById(comment.postId);

    res.json({
      success: true,
      message: 'Comment deleted',
      commentsCount: post?.comments.length || 0,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user._id;
    const index = comment.likes.findIndex((id) => id.toString() === userId.toString());
    let liked;

    if (index > -1) {
      comment.likes.splice(index, 1);
      liked = false;
    } else {
      comment.likes.push(userId);
      liked = true;

      await createNotification({
        senderId: userId,
        receiverId: comment.userId,
        type: 'like_comment',
        referenceId: comment._id,
        message: 'liked your comment',
      });
    }

    await comment.save();

    res.json({ success: true, liked, likesCount: comment.likes.length });
  } catch (error) {
    next(error);
  }
};
