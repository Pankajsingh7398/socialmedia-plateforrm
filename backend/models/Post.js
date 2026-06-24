const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    images: [{ url: String, publicId: String }],
    video: { url: String, publicId: String, thumbnail: String },
    gif: { url: String },
    hashtags: [{ type: String, lowercase: true }],
    mentions: [{ type: String, lowercase: true }],
    location: { type: String, default: '' },
    audience: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    isDraft: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    isPinned: { type: Boolean, default: false },
    poll: {
      question: String,
      options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
      expiresAt: Date,
    },
    reactions: {
      like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual('likesCount').get(function () {
  const r = this.reactions || {};
  return (r.like?.length || 0) + (r.love?.length || 0) + (r.laugh?.length || 0) + (r.wow?.length || 0) || this.likes?.length || 0;
});

postSchema.virtual('commentsCount').get(function () {
  return this.comments?.length || 0;
});

postSchema.virtual('savesCount').get(function () {
  return this.saves?.length || 0;
});

postSchema.pre('save', function (next) {
  if (this.caption) {
    const tags = this.caption.match(/#[\w]+/g);
    const mentions = this.caption.match(/@[\w]+/g);
    this.hashtags = tags ? [...new Set(tags.map((t) => t.slice(1).toLowerCase()))] : [];
    this.mentions = mentions ? [...new Set(mentions.map((m) => m.slice(1).toLowerCase()))] : [];
  }
  next();
});

postSchema.index({ caption: 'text', hashtags: 'text' });
postSchema.index({ createdAt: -1 });
postSchema.index({ isDraft: 1, scheduledAt: 1 });

module.exports = mongoose.model('Post', postSchema);
