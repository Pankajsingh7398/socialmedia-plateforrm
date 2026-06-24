import { getMediaUrl } from '../api.js';
import { formatDate, parseHashtags, escapeHtml } from '../utils.js';
import { getUser } from '../auth.js';

const REACTIONS = { like: '👍', love: '❤️', laugh: '😂', wow: '😮' };

const icons = {
  comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
};

const verifiedBadge = (u) => u?.isVerified ? '<span class="verified-badge">✓</span>' : '';

export const renderPostSkeleton = () => `
  <div class="post-card glass-card" style="margin-bottom:1rem;padding:1rem">
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
      <div class="skeleton skeleton-avatar" style="width:48px;height:48px"></div>
      <div style="flex:1"><div class="skeleton skeleton-text" style="width:40%"></div><div class="skeleton skeleton-text" style="width:25%"></div></div>
    </div>
    <div class="skeleton" style="height:280px;border-radius:16px"></div>
  </div>
`.repeat(2);

const renderCarousel = (images, postId) => {
  if (!images?.length) return '';
  if (images.length === 1) {
    return `<div class="post-media"><img src="${getMediaUrl(images[0].url)}" alt="" loading="lazy" data-lightbox="${getMediaUrl(images[0].url)}" style="width:100%;border-radius:0 0 16px 16px;max-height:500px;object-fit:cover"></div>`;
  }
  return `
    <div class="carousel post-media" data-carousel="${postId}">
      <div class="carousel-track" style="width:${images.length * 100}%">
        ${images.map((img) => `<div class="carousel-slide" style="width:${100 / images.length}%"><img src="${getMediaUrl(img.url)}" alt="" loading="lazy" data-lightbox="${getMediaUrl(img.url)}"></div>`).join('')}
      </div>
      <button class="carousel-nav prev" data-carousel-prev="${postId}">‹</button>
      <button class="carousel-nav next" data-carousel-next="${postId}">›</button>
      <div class="carousel-dots">${images.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-carousel-dot="${postId}" data-index="${i}"></button>`).join('')}</div>
    </div>
  `;
};

const renderPoll = (poll, postId) => {
  if (!poll?.options?.length) return '';
  const total = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  return `
    <div class="post-poll" style="padding:0 1.25rem 1rem">
      <p style="font-weight:600;margin-bottom:0.75rem">${escapeHtml(poll.question)}</p>
      ${poll.options.map((o, i) => {
        const pct = total ? Math.round((o.votes?.length || 0) / total * 100) : 0;
        return `<button class="poll-option" data-action="vote-poll" data-id="${postId}" data-index="${i}" style="display:block;width:100%;margin-bottom:0.5rem;padding:0.75rem;border-radius:12px;border:1px solid var(--border);background:var(--bg-tertiary);text-align:left;position:relative;overflow:hidden">
          <div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:var(--accent-light);transition:width 0.3s"></div>
          <span style="position:relative">${escapeHtml(o.text)} ${total ? `(${pct}%)` : ''}</span>
        </button>`;
      }).join('')}
    </div>
  `;
};

export const renderPostCard = (post, options = {}) => {
  const user = getUser();
  const author = post.userId;
  const isOwner = user && author._id === user._id;
  const reaction = post.userReaction;
  const reactionEmoji = reaction ? REACTIONS[reaction] : '👍';

  const mediaHtml = post.video?.url
    ? `<div class="post-media"><video src="${getMediaUrl(post.video.url)}" controls style="width:100%;max-height:500px;border-radius:0 0 16px 16px"></video></div>`
    : renderCarousel(post.images, post._id);

  const menuHtml = `
    <div class="dropdown" style="position:relative">
      <button class="btn btn-ghost post-menu-btn" data-post-id="${post._id}">${icons.more}</button>
      <div class="dropdown-menu hidden" id="menu-${post._id}">
        ${isOwner ? `<button class="dropdown-item" data-action="edit-post" data-id="${post._id}">Edit</button><button class="dropdown-item" data-action="pin-post" data-id="${post._id}">${post.isPinned ? 'Unpin' : 'Pin'}</button>` : ''}
        <button class="dropdown-item" data-action="copy-link" data-id="${post._id}">Copy link</button>
        <button class="dropdown-item" data-action="share-post" data-id="${post._id}">Share</button>
        ${!isOwner ? `<button class="dropdown-item danger" data-action="report-post" data-id="${post._id}">Report</button>` : ''}
        ${isOwner ? `<button class="dropdown-item danger" data-action="delete-post" data-id="${post._id}">Delete</button>` : ''}
      </div>
    </div>
  `;

  return `
    <article class="post-card glass-card fade-in" data-post-id="${post._id}" style="margin-bottom:1.25rem;overflow:hidden">
      <div class="post-header" style="display:flex;align-items:center;gap:0.875rem;padding:1rem 1.25rem">
        <a href="#profile/${author.username}"><img class="avatar" style="width:48px;height:48px" src="${getMediaUrl(author.profileImage) || ''}" alt="" onerror="this.style.background='var(--bg-tertiary)'"></a>
        <div style="flex:1;min-width:0">
          <a href="#profile/${author.username}" style="font-weight:700;font-size:0.9375rem;color:var(--text-primary)">${escapeHtml(author.name)}${verifiedBadge(author)}</a>
          <div style="font-size:0.8125rem;color:var(--text-muted)">@${escapeHtml(author.username)} · ${formatDate(post.createdAt)}${post.location ? ` · 📍 ${escapeHtml(post.location)}` : ''}</div>
        </div>
        ${menuHtml}
      </div>
      ${post.caption ? `<div class="post-caption" style="padding:0 1.25rem 0.75rem;white-space:pre-wrap;line-height:1.5">${parseHashtags(post.caption)}</div>` : ''}
      ${mediaHtml}
      ${renderPoll(post.poll, post._id)}
      <div class="post-stats" style="padding:0.5rem 1.25rem;font-size:0.875rem;color:var(--text-secondary)">
        ${post.likesCount > 0 ? `<span>${post.likesCount} reactions</span>` : ''}
        ${post.views ? ` · <span>${post.views} views</span>` : ''}
        ${post.shares ? ` · <span>${post.shares} shares</span>` : ''}
        ${post.commentsCount > 0 ? ` · <span>${post.commentsCount} comments</span>` : ''}
      </div>
      <div class="post-actions" style="display:flex;align-items:center;gap:0.25rem;padding:0.5rem 1rem;border-top:1px solid var(--border)">
        <div style="position:relative;flex:1">
          <button class="post-action reaction-trigger ${reaction ? `reaction-${reaction} active` : ''}" data-action="react-post" data-id="${post._id}" style="display:flex;align-items:center;gap:0.375rem;padding:0.5rem 0.75rem;border-radius:12px;width:100%;justify-content:center;background:none;border:none;color:var(--text-secondary);font-weight:600;font-size:0.875rem;cursor:pointer">
            <span class="${reaction ? 'like-animate' : ''}">${reactionEmoji}</span> React
          </button>
        </div>
        <a href="#post/${post._id}" class="post-action" style="flex:1;display:flex;align-items:center;gap:0.375rem;padding:0.5rem;justify-content:center;color:var(--text-secondary);font-weight:600;font-size:0.875rem">${icons.comment} Comment</a>
        <button class="post-action" data-action="share-post" data-id="${post._id}" style="flex:1;display:flex;align-items:center;gap:0.375rem;padding:0.5rem;justify-content:center;background:none;border:none;color:var(--text-secondary);font-weight:600;font-size:0.875rem;cursor:pointer">${icons.share}</button>
        <button class="post-action ${post.isSaved ? 'active' : ''}" data-action="bookmark" data-id="${post._id}" data-type="post" style="padding:0.5rem;background:none;border:none;color:${post.isSaved ? 'var(--accent)' : 'var(--text-secondary)'};cursor:pointer">${icons.bookmark}</button>
      </div>
      ${options.showComments ? renderCommentSection(post._id) : ''}
    </article>
  `;
};

export const renderCommentSection = (postId) => `
  <div class="comment-section" data-post-id="${postId}" style="padding:1rem 1.25rem;border-top:1px solid var(--border)">
    <form class="comment-form" data-comment-form="${postId}" style="display:flex;gap:0.5rem;margin-bottom:1rem">
      <input type="text" placeholder="Add a comment... Use @username to mention" required style="flex:1;padding:0.75rem 1rem;border-radius:999px;border:1px solid var(--border);background:var(--input-bg)">
      <button type="submit" class="btn btn-gradient btn-sm">Post</button>
    </form>
    <div class="comments-list" data-comments="${postId}"><div class="skeleton skeleton-text"></div></div>
  </div>
`;

export const renderComment = (comment, postId) => {
  const user = getUser();
  const isOwner = user && comment.userId._id === user._id;
  const author = comment.userId;
  const repliesHtml = comment.replies?.length
    ? `<div class="comment-replies" style="margin-left:2.5rem;margin-top:0.5rem;border-left:2px solid var(--border);padding-left:0.75rem">${comment.replies.map((r) => renderReply(r, postId)).join('')}</div>`
    : '';

  return `
    <div class="comment-item" data-comment-id="${comment._id}" style="display:flex;gap:0.75rem;margin-bottom:1rem">
      <img class="avatar avatar-sm" src="${getMediaUrl(author.profileImage) || ''}" alt="">
      <div style="flex:1">
        <div style="background:var(--bg-tertiary);padding:0.625rem 1rem;border-radius:16px;display:inline-block">
          <span style="font-weight:700;font-size:0.875rem;margin-right:0.5rem">${escapeHtml(author.name)}</span>
          <span style="font-size:0.875rem">${escapeHtml(comment.text)}</span>
        </div>
        <div style="display:flex;gap:1rem;margin-top:0.25rem;padding-left:0.5rem;font-size:0.75rem;color:var(--text-muted)">
          <span>${formatDate(comment.createdAt)}</span>
          <button data-action="like-comment" data-id="${comment._id}" style="background:none;border:none;cursor:pointer;color:${comment.isLiked ? 'var(--danger)' : 'inherit'}">${comment.isLiked ? 'Unlike' : 'Like'}${comment.likesCount ? ` (${comment.likesCount})` : ''}</button>
          <button data-action="reply-comment" data-id="${comment._id}" data-post="${postId}" style="background:none;border:none;cursor:pointer">Reply</button>
          ${isOwner ? `<button data-action="delete-comment" data-id="${comment._id}" style="background:none;border:none;cursor:pointer;color:var(--danger)">Delete</button>` : ''}
        </div>
        ${repliesHtml}
      </div>
    </div>
  `;
};

const renderReply = (reply, postId) => {
  const user = getUser();
  const isOwner = user && reply.userId._id === user._id;
  const author = reply.userId;
  return `
    <div class="comment-item" data-comment-id="${reply._id}" style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
      <img class="avatar avatar-sm" src="${getMediaUrl(author.profileImage) || ''}" alt="" style="width:28px;height:28px">
      <div>
        <div style="background:var(--bg-tertiary);padding:0.5rem 0.75rem;border-radius:12px;font-size:0.875rem">
          <strong>${escapeHtml(author.name)}</strong> ${escapeHtml(reply.text)}
        </div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem">
          <button data-action="like-comment" data-id="${reply._id}" style="background:none;border:none;cursor:pointer">Like</button>
          ${isOwner ? `<button data-action="delete-comment" data-id="${reply._id}" style="background:none;border:none;cursor:pointer;color:var(--danger)">Delete</button>` : ''}
        </div>
      </div>
    </div>
  `;
};

export const renderUserSuggestion = (user) => `
  <div class="user-suggestion" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0">
    <a href="#profile/${user.username}"><img class="avatar avatar-sm" src="${getMediaUrl(user.profileImage) || ''}" alt=""></a>
    <div style="flex:1;min-width:0">
      <a href="#profile/${user.username}" style="font-weight:600;font-size:0.875rem">${escapeHtml(user.name)}${verifiedBadge(user)}</a>
      <div style="font-size:0.75rem;color:var(--text-muted)">@${escapeHtml(user.username)}</div>
    </div>
    <button class="btn btn-primary btn-sm" data-action="follow" data-username="${user.username}">Follow</button>
  </div>
`;

export const showReactionPicker = (btn, postId) => {
  document.querySelectorAll('.reaction-picker').forEach((p) => p.remove());
  const picker = document.createElement('div');
  picker.className = 'reaction-picker';
  picker.innerHTML = Object.entries(REACTIONS).map(([type, emoji]) =>
    `<button class="reaction-btn" data-action="set-reaction" data-id="${postId}" data-reaction="${type}">${emoji}</button>`
  ).join('');
  btn.parentElement.appendChild(picker);
  setTimeout(() => document.addEventListener('click', function close(e) {
    if (!picker.contains(e.target) && e.target !== btn) { picker.remove(); document.removeEventListener('click', close); }
  }), 10);
};

export const bindCarousels = () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const id = carousel.dataset.carousel;
    let index = 0;
    const slides = carousel.querySelectorAll('.carousel-slide').length;
    const track = carousel.querySelector('.carousel-track');
    const dots = carousel.querySelectorAll(`[data-carousel-dot="${id}"]`);

    const goTo = (i) => {
      index = (i + slides) % slides;
      track.style.transform = `translateX(-${index * (100 / slides)}%)`;
      dots.forEach((d, di) => d.classList.toggle('active', di === index));
    };

    carousel.querySelector(`[data-carousel-prev="${id}"]`)?.addEventListener('click', () => goTo(index - 1));
    carousel.querySelector(`[data-carousel-next="${id}"]`)?.addEventListener('click', () => goTo(index + 1));
    dots.forEach((d) => d.addEventListener('click', () => goTo(parseInt(d.dataset.index))));
  });
};
