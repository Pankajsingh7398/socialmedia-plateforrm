const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    video: { url: String, publicId: String, thumbnail: String },
    caption: { type: String, maxlength: 2200, default: '' },
    hashtags: [{ type: String, lowercase: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reelSchema.virtual('likesCount').get(function () { return this.likes?.length || 0; });
reelSchema.virtual('commentsCount').get(function () { return this.comments?.length || 0; });

reelSchema.pre('save', function (next) {
  if (this.caption) {
    const tags = this.caption.match(/#[\w]+/g);
    this.hashtags = tags ? [...new Set(tags.map((t) => t.slice(1).toLowerCase()))] : [];
  }
  next();
});

module.exports = mongoose.model('Reel', reelSchema);
