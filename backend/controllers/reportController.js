const Report = require('../models/Report');

exports.createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
