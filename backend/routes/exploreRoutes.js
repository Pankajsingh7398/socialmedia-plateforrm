const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const exploreController = require('../controllers/exploreController');

const router = express.Router();

router.get('/', optionalAuth, exploreController.getExplore);

module.exports = router;
