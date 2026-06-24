const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true, sparse: true });
bookmarkSchema.index({ userId: 1, reelId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
