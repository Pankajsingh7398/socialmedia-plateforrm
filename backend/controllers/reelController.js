const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const { uploadVideo } = require('../utils/uploadHelper');
const { enrichReel, populateAuthor } = require('../utils/postHelper');
const { createNotification } = require('../utils/notifications');

exports.createReel = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Video required' });

    const result = await uploadVideo(req.file.buffer, req.file.originalname);
    const reel = await Reel.create({
      userId: req.user._id,
      video: result,
      caption: req.body.caption || '',
    });

    await reel.populate(populateAuthor);
    res.status(201).json({ success: true, reel: enrichReel(reel, req.user._id) });
  } catch (error) {
    next(error);
  }
};

exports.getReels = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reels = await Reel.find()
      .populate(populateAuthor)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      reels: reels.map((r) => enrichReel(r, req.user?._id)),
    });
  } catch (error) {
    next(error);
  }
};

exports.getReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id).populate(populateAuthor);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    reel.views += 1;
    await reel.save();

    res.json({ success: true, reel: enrichReel(reel, req.user?._id) });
  } catch (error) {
    next(error);
  }
};

exports.toggleLikeReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    const idx = reel.likes.findIndex((id) => id.toString() === req.user._id.toString());
    const liked = idx === -1;
    if (liked) reel.likes.push(req.user._id);
    else reel.likes.splice(idx, 1);
    await reel.save();

    if (liked) {
      await createNotification({
        senderId: req.user._id,
        receiverId: reel.userId,
        type: 'like_post',
        referenceId: reel._id,
        message: 'liked your reel',
      });
    }

    res.json({ success: true, liked, likesCount: reel.likes.length });
  } catch (error) {
    next(error);
  }
};

exports.toggleSaveReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    const idx = reel.saves.findIndex((id) => id.toString() === req.user._id.toString());
    const saved = idx === -1;
    if (saved) reel.saves.push(req.user._id);
    else reel.saves.splice(idx, 1);
    await reel.save();

    res.json({ success: true, saved, savesCount: reel.saves.length });
  } catch (error) {
    next(error);
  }
};

exports.deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    if (reel.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Comment.deleteMany({ postId: reel._id });
    await Reel.findByIdAndDelete(reel._id);
    res.json({ success: true, message: 'Reel deleted' });
  } catch (error) {
    next(error);
  }
};
