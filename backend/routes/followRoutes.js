const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const followController = require('../controllers/followController');

const router = express.Router();

router.get('/requests', protect, followController.getFollowRequests);
router.post('/requests/:userId/accept', protect, followController.acceptFollowRequest);
router.post('/:username/block', protect, followController.blockUser);
router.post('/:username/mute', protect, followController.muteUser);
router.post('/:username/follow', protect, followController.followUser);
router.delete('/:username/follow', protect, followController.unfollowUser);
router.get('/:username/followers', optionalAuth, followController.getFollowers);
router.get('/:username/following', optionalAuth, followController.getFollowing);

module.exports = router;
