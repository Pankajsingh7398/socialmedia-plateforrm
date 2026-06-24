const express = require('express');
const { protect } = require('../middleware/auth');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

router.get('/', protect, bookmarkController.getBookmarks);
router.post('/toggle', protect, bookmarkController.toggleBookmark);

module.exports = router;
