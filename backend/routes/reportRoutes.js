const express = require('express');
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.post('/', protect, reportController.createReport);

module.exports = router;
