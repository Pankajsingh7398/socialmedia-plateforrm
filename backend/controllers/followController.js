const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

exports.followUser = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(req.user._id);

    if (currentUser.following.some((id) => id.toString() === targetUser._id.toString())) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    const isPrivate = targetUser.privacy?.profileVisibility === 'private';

    if (isPrivate) {
      const existing = targetUser.followRequests?.find(
        (r) => r.from.toString() === currentUser._id.toString() && r.status === 'pending'
      );
      if (existing) {
        return res.status(400).json({ success: false, message: 'Follow request already sent' });
      }
      targetUser.followRequests = targetUser.followRequests || [];
      targetUser.followRequests.push({ from: currentUser._id, status: 'pending' });
      await targetUser.save();
      await createNotification({
        senderId: currentUser._id,
        receiverId: targetUser._id,
        type: 'follow_request',
        referenceId: currentUser._id,
        message: 'requested to follow you',
      });
      return res.json({ success: true, message: 'Follow request sent', pending: true });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await Promise.all([currentUser.save(), targetUser.save()]);

    await createNotification({
      senderId: currentUser._id,
      receiverId: targetUser._id,
      type: 'follow',
      referenceId: currentUser._id,
      message: 'started following you',
    });

    res.json({
      success: true,
      message: `Now following ${targetUser.username}`,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUser._id.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: `Unfollowed ${targetUser.username}`,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('followers', 'name username profileImage bio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, followers: user.followers });
  } catch (error) {
    next(error);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('following', 'name username profileImage bio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, following: user.following });
  } catch (error) {
    next(error);
  }
};

exports.acceptFollowRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.followRequests?.find(
      (r) => r.from.toString() === req.params.userId && r.status === 'pending'
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'accepted';
    const follower = await User.findById(request.from);
    if (!follower) return res.status(404).json({ success: false, message: 'User not found' });

    user.followers.push(follower._id);
    follower.following.push(user._id);
    await Promise.all([user.save(), follower.save()]);

    res.json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    next(error);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(target._id)) user.blockedUsers.push(target._id);
    user.following = user.following.filter((id) => id.toString() !== target._id.toString());
    user.followers = user.followers.filter((id) => id.toString() !== target._id.toString());
    await user.save();

    res.json({ success: true, message: `Blocked @${target.username}` });
  } catch (error) {
    next(error);
  }
};

exports.muteUser = async (req, res, next) => {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const user = await User.findById(req.user._id);
    if (!user.mutedUsers.includes(target._id)) user.mutedUsers.push(target._id);
    await user.save();

    res.json({ success: true, message: `Muted @${target.username}` });
  } catch (error) {
    next(error);
  }
};

exports.getFollowRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('followRequests.from', 'name username profileImage');
    const pending = (user.followRequests || []).filter((r) => r.status === 'pending');
    res.json({ success: true, requests: pending });
  } catch (error) {
    next(error);
  }
};
