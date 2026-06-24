const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    media: { url: String, publicId: String, type: { type: String, enum: ['image', 'video'], default: 'image' } },
    text: { type: String, maxlength: 200, default: '' },
    expiresAt: { type: Date, required: true },
    viewers: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: { type: Date, default: Date.now } }],
    reactions: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: { type: String, default: '❤️' } }],
    replies: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
