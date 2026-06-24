const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.get('/', optionalAuth, searchController.search);
router.get('/suggestions', optionalAuth, searchController.getSuggestions);

module.exports = router;
