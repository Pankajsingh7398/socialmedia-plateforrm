const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/posts/:id', adminController.deletePost);
router.put('/reports/:id/resolve', adminController.resolveReport);

module.exports = router;
