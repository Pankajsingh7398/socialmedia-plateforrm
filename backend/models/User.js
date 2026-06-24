const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      default: '',
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequests: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
    profileViews: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
      },
      showEmail: { type: Boolean, default: false },
    },
    notificationPreferences: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      replies: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      stories: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('followersCount').get(function () {
  return this.followers?.length || 0;
});

userSchema.virtual('followingCount').get(function () {
  return this.following?.length || 0;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ name: 'text', username: 'text' });

module.exports = mongoose.model('User', userSchema);
