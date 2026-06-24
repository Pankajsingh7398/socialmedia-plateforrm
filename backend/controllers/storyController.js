const Story = require('../models/Story');
const User = require('../models/User');
const { uploadImage, uploadVideo } = require('../utils/uploadHelper');
const { createNotification } = require('../utils/notifications');

exports.createStory = async (req, res, next) => {
  try {
    const { text, mediaType } = req.body;
    let media = {};

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');
      const result = isVideo
        ? await uploadVideo(req.file.buffer, req.file.originalname)
        : await uploadImage(req.file.buffer, req.file.originalname);
      media = { url: result.url, publicId: result.publicId, type: isVideo ? 'video' : 'image' };
    } else if (!text) {
      return res.status(400).json({ success: false, message: 'Story needs media or text' });
    }

    const story = await Story.create({
      userId: req.user._id,
      media,
      text: text || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await story.populate('userId', 'name username profileImage isVerified');
    res.status(201).json({ success: true, story });
  } catch (error) {
    next(error);
  }
};

exports.getFeedStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const followingIds = [...user.following, req.user._id];
    const now = new Date();

    const stories = await Story.find({ userId: { $in: followingIds }, expiresAt: { $gt: now } })
      .populate('userId', 'name username profileImage isVerified')
      .sort({ createdAt: -1 });

    const grouped = {};
    stories.forEach((s) => {
      const uid = s.userId._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.userId, stories: [], hasUnviewed: false };
      const viewed = s.viewers.some((v) => v.userId.toString() === req.user._id.toString());
      if (!viewed) grouped[uid].hasUnviewed = true;
      grouped[uid].stories.push(s);
    });

    res.json({ success: true, storyGroups: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
};

exports.viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    const already = story.viewers.some((v) => v.userId.toString() === req.user._id.toString());
    if (!already) {
      story.viewers.push({ userId: req.user._id });
      await story.save();
    }

    await story.populate('userId', 'name username profileImage isVerified');
    res.json({ success: true, story });
  } catch (error) {
    next(error);
  }
};

exports.reactToStory = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    story.reactions = story.reactions.filter((r) => r.userId.toString() !== req.user._id.toString());
    story.reactions.push({ userId: req.user._id, emoji: emoji || '❤️' });
    await story.save();

    if (story.userId.toString() !== req.user._id.toString()) {
      await createNotification({
        senderId: req.user._id,
        receiverId: story.userId,
        type: 'story_reply',
        referenceId: story._id,
        message: 'reacted to your story',
      });
    }

    res.json({ success: true, reactions: story.reactions.length });
  } catch (error) {
    next(error);
  }
};

exports.replyToStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    story.replies.push({ userId: req.user._id, text: req.body.text });
    await story.save();

    await createNotification({
      senderId: req.user._id,
      receiverId: story.userId,
      type: 'story_reply',
      referenceId: story._id,
      message: 'replied to your story',
    });

    res.json({ success: true, message: 'Reply sent' });
  } catch (error) {
    next(error);
  }
};

exports.getStoryViewers = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('viewers.userId', 'name username profileImage');
    if (!story || story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, viewers: story.viewers });
  } catch (error) {
    next(error);
  }
};

exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Story.findByIdAndDelete(story._id);
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
};
