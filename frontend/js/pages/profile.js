import { api, getMediaUrl } from '../api.js';
import { getUser } from '../auth.js';
import { renderPostCard, renderPostSkeleton } from '../components/postCard.js';
import { escapeHtml, showToast, formatDate } from '../utils.js';

export const renderProfilePage = (username) => `
  <div class="page-container">
    <div id="profile-content">${renderPostSkeleton()}</div>
  </div>
`;

export const loadProfile = async (username) => {
  const container = document.getElementById('profile-content');
  container.innerHTML = renderPostSkeleton();

  try {
    const [profileData, postsData] = await Promise.all([
      api.get(`/users/${username}`),
      api.get(`/posts/user/${username}?page=1&limit=10`),
    ]);

    const user = profileData.user;
    const currentUser = getUser();

    container.innerHTML = `
      <div class="profile-header glass-card fade-in" style="overflow:hidden;margin-bottom:1.5rem">
        <div class="profile-cover" style="height:220px;background:var(--gradient-primary);position:relative">
          ${user.coverImage ? `<img src="${getMediaUrl(user.coverImage)}" alt="Cover" style="width:100%;height:100%;object-fit:cover">` : ''}
          ${user.isOwner ? `<label class="btn btn-secondary btn-sm" style="position:absolute;bottom:1rem;right:1rem;cursor:pointer">Change Cover<input type="file" id="cover-upload" accept="image/*" hidden></label>` : ''}
        </div>
        <div class="profile-info" style="padding:0 1.5rem 1.5rem;position:relative">
          <div class="profile-avatar-wrap" style="margin-top:-56px;margin-bottom:1rem;display:inline-block">
            <img class="avatar" src="${getMediaUrl(user.profileImage) || ''}" alt="" style="width:112px;height:112px;border:4px solid var(--card-bg);border-radius:50%">
            ${user.isOwner ? `<label class="btn btn-gradient btn-sm" style="position:absolute;bottom:4px;right:4px;cursor:pointer;border-radius:50%;width:36px;height:36px;padding:0">📷<input type="file" id="avatar-upload" accept="image/*" hidden></label>` : ''}
          </div>
          <h1 style="font-size:1.75rem;font-weight:800">${escapeHtml(user.name)}${user.isVerified ? '<span class="verified-badge">✓</span>' : ''}</h1>
          <div style="color:var(--text-secondary);margin-bottom:0.75rem">@${escapeHtml(user.username)}</div>
          ${user.bio ? `<p style="margin-bottom:1rem;white-space:pre-wrap">${escapeHtml(user.bio)}</p>` : ''}
          <div class="profile-meta" style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.875rem;color:var(--text-secondary);margin-bottom:1rem">
            ${user.location ? `<span>📍 ${escapeHtml(user.location)}</span>` : ''}
            ${user.website ? `<span><a href="${escapeHtml(user.website)}" target="_blank">🔗 ${escapeHtml(user.website)}</a></span>` : ''}
            <span>📅 Joined ${formatDate(user.createdAt)}</span>
          </div>
          <div class="dashboard-stats" style="margin-bottom:1rem">
            <div class="stat-card-premium"><div class="stat-value">${user.postCount || 0}</div><div class="stat-label">Posts</div></div>
            <div class="stat-card-premium"><div class="stat-value">${user.followers?.length || 0}</div><div class="stat-label">Followers</div></div>
            <div class="stat-card-premium"><div class="stat-value">${user.following?.length || 0}</div><div class="stat-label">Following</div></div>
            <div class="stat-card-premium"><div class="stat-value">${user.profileViews || 0}</div><div class="stat-label">Views</div></div>
          </div>
          <div class="profile-actions" style="display:flex;gap:0.75rem;flex-wrap:wrap">
            ${user.isOwner
              ? '<a href="#settings" class="btn btn-secondary">Edit Profile</a>'
              : `${user.isFollowing
                  ? `<button class="btn btn-secondary" data-action="unfollow" data-username="${username}">Unfollow</button>`
                  : `<button class="btn btn-gradient" data-action="follow" data-username="${username}">Follow</button>`
                }<a href="#messages/${username}" class="btn btn-secondary">Message</a>`
            }
          </div>
        </div>
      </div>
      <div class="profile-tabs glass-card" style="display:flex;margin-bottom:1.5rem">
        <button class="profile-tab active" data-tab="posts">Posts</button>
        <button class="profile-tab" data-tab="photos">Photos</button>
        <button class="profile-tab" data-tab="saved">Saved</button>
      </div>
      <div id="profile-posts">
        ${postsData.posts?.length
          ? postsData.posts.map((p) => renderPostCard(p)).join('')
          : '<div class="empty-state"><p>No posts yet</p></div>'
        }
      </div>
    `;

    return user;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message || 'User not found'}</p><a href="#feed" class="btn btn-primary mt-2">Go Home</a></div>`;
    return null;
  }
};

export const bindProfileEvents = (username) => {
  document.getElementById('avatar-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.upload('/users/profile-image', formData);
      showToast('Profile picture updated!', 'success');
      loadProfile(username);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('cover-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.upload('/users/cover-image', formData);
      showToast('Cover image updated!', 'success');
      loadProfile(username);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};

export const renderFollowList = async (username, type) => {
  const container = document.getElementById('page-content');
  container.innerHTML = '<div class="page-container"><div class="skeleton skeleton-card"></div></div>';

  try {
    const data = await api.get(`/follow/${username}/${type}`);
    const users = data[type] || [];

    container.innerHTML = `
      <div class="page-container fade-in">
        <div class="page-header">
          <a href="#profile/${username}" class="text-secondary">← Back to profile</a>
          <h1>${type === 'followers' ? 'Followers' : 'Following'}</h1>
        </div>
        <div class="card">
          ${users.length
            ? users.map((u) => `
              <div class="user-suggestion" style="padding:1rem">
                <a href="#profile/${u.username}"><img class="avatar" src="${getMediaUrl(u.profileImage) || ''}" alt=""></a>
                <div class="user-suggestion-info">
                  <a href="#profile/${u.username}" class="user-suggestion-name">${escapeHtml(u.name)}</a>
                  <div class="user-suggestion-username">@${escapeHtml(u.username)}</div>
                </div>
              </div>
            `).join('')
            : '<div class="empty-state"><p>No users found</p></div>'
          }
        </div>
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
};
