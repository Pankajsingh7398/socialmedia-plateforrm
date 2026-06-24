const populateAuthor = { path: 'userId', select: 'name username profileImage isVerified' };

const enrichPost = (post, userId) => {
  const obj = post.toObject ? post.toObject({ virtuals: true }) : { ...post };
  const reactions = obj.reactions || { like: [], love: [], laugh: [], wow: [] };
  const types = ['like', 'love', 'laugh', 'wow'];
  let userReaction = null;

  if (userId) {
    userReaction = types.find((t) =>
      (reactions[t] || []).some((id) => id.toString() === userId.toString())
    ) || null;
  }

  const likesCount = types.reduce((sum, t) => sum + (reactions[t]?.length || 0), 0) || obj.likes?.length || 0;

  return {
    ...obj,
    likesCount,
    commentsCount: obj.comments?.length || obj.commentsCount || 0,
    savesCount: obj.saves?.length || 0,
    userReaction,
    isLiked: !!userReaction || (userId && obj.likes?.some((id) => id.toString() === userId.toString())),
    isSaved: userId ? (obj.saves || []).some((id) => id.toString() === userId.toString()) : false,
    reactionCounts: Object.fromEntries(types.map((t) => [t, reactions[t]?.length || 0])),
  };
};

const enrichReel = (reel, userId) => {
  const obj = reel.toObject ? reel.toObject({ virtuals: true }) : { ...reel };
  return {
    ...obj,
    likesCount: obj.likes?.length || 0,
    commentsCount: obj.comments?.length || 0,
    isLiked: userId ? obj.likes?.some((id) => id.toString() === userId.toString()) : false,
    isSaved: userId ? obj.saves?.some((id) => id.toString() === userId.toString()) : false,
  };
};

module.exports = { populateAuthor, enrichPost, enrichReel };
