import { api } from '../api.js';
import { getUser, setUser } from '../auth.js';
import { escapeHtml, formatDate, showToast, confirmDialog } from '../utils.js';

export const renderDashboardPage = () => `
  <div class="page-container-wide">
    <div class="page-header"><h1>Dashboard</h1></div>
    <div id="dashboard-content">
      <div class="skeleton skeleton-card" style="height:200px"></div>
    </div>
  </div>
`;

export const loadDashboard = async () => {
  const container = document.getElementById('dashboard-content');

  try {
    const data = await api.get('/dashboard');
    const { stats, recentPosts, recentActivity } = data;

    container.innerHTML = `
      <div class="dashboard-stats fade-in">
        <div class="stat-card"><div class="stat-value">${stats.postCount}</div><div class="stat-label">Posts</div></div>
        <div class="stat-card"><div class="stat-value">${stats.followersCount}</div><div class="stat-label">Followers</div></div>
        <div class="stat-card"><div class="stat-value">${stats.followingCount}</div><div class="stat-label">Following</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalLikesReceived}</div><div class="stat-label">Likes Received</div></div>
        <div class="stat-card"><div class="stat-value">${stats.totalCommentsReceived}</div><div class="stat-label">Comments</div></div>
        <div class="stat-card"><div class="stat-value">${stats.profileViews || 0}</div><div class="stat-label">Profile Views</div></div>
      </div>
      <div class="grid-2">
        <div class="widget">
          <h3 class="widget-title">Recent Posts</h3>
          ${recentPosts?.length
            ? recentPosts.map((p) => `
              <div style="padding:0.75rem 0;border-bottom:1px solid var(--border)">
                <a href="#post/${p.id}">${escapeHtml(p.caption || 'No caption')}</a>
                <div class="text-muted" style="font-size:0.8125rem;margin-top:0.25rem">
                  ${p.likesCount} likes · ${p.commentsCount} comments · ${formatDate(p.createdAt)}
                </div>
              </div>
            `).join('')
            : '<p class="text-muted">No posts yet</p>'
          }
        </div>
        <div class="widget">
          <h3 class="widget-title">Recent Activity</h3>
          ${recentActivity?.length
            ? recentActivity.map((a) => `
              <div style="padding:0.75rem 0;border-bottom:1px solid var(--border);font-size:0.875rem">
                <strong>${escapeHtml(a.senderId?.name || 'Someone')}</strong> ${escapeHtml(a.message || a.type)}
                <div class="text-muted" style="font-size:0.75rem">${formatDate(a.createdAt)}</div>
              </div>
            `).join('')
            : '<p class="text-muted">No recent activity</p>'
          }
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load dashboard</p></div>';
  }
};

export const renderSettingsPage = () => {
  const user = getUser();
  return `
    <div class="page-container">
      <div class="page-header"><h1>Settings</h1></div>

      <div class="settings-section">
        <h3>Edit Profile</h3>
        <form id="profile-form">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" name="name" value="${escapeHtml(user?.name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea" name="bio" maxlength="160">${escapeHtml(user?.bio || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input class="form-input" name="location" value="${escapeHtml(user?.location || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Website</label>
            <input class="form-input" name="website" value="${escapeHtml(user?.website || '')}">
          </div>
          <button type="submit" class="btn btn-primary">Save Profile</button>
        </form>
      </div>

      <div class="settings-section">
        <h3>Change Password</h3>
        <form id="password-form">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input class="form-input" type="password" name="currentPassword" required>
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input class="form-input" type="password" name="newPassword" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary">Change Password</button>
        </form>
      </div>

      <div class="settings-section">
        <h3>Privacy</h3>
        <div class="form-group">
          <label class="form-label">Profile Visibility</label>
          <select class="form-select" id="profile-visibility">
            <option value="public" ${user?.privacy?.profileVisibility === 'public' ? 'selected' : ''}>Public</option>
            <option value="private" ${user?.privacy?.profileVisibility === 'private' ? 'selected' : ''}>Private</option>
          </select>
        </div>
        <div class="toggle-switch">
          <span>Show email on profile</span>
          <label class="switch">
            <input type="checkbox" id="show-email" ${user?.privacy?.showEmail ? 'checked' : ''}>
            <span class="switch-slider"></span>
          </label>
        </div>
        <button class="btn btn-primary mt-2" id="save-privacy">Save Privacy Settings</button>
      </div>

      <div class="settings-section">
        <h3>Notification Preferences</h3>
        <div class="toggle-switch">
          <span>Likes</span>
          <label class="switch"><input type="checkbox" id="notif-likes" ${user?.notificationPreferences?.likes !== false ? 'checked' : ''}><span class="switch-slider"></span></label>
        </div>
        <div class="toggle-switch">
          <span>Comments</span>
          <label class="switch"><input type="checkbox" id="notif-comments" ${user?.notificationPreferences?.comments !== false ? 'checked' : ''}><span class="switch-slider"></span></label>
        </div>
        <div class="toggle-switch">
          <span>Follows</span>
          <label class="switch"><input type="checkbox" id="notif-follows" ${user?.notificationPreferences?.follows !== false ? 'checked' : ''}><span class="switch-slider"></span></label>
        </div>
        <div class="toggle-switch">
          <span>Replies</span>
          <label class="switch"><input type="checkbox" id="notif-replies" ${user?.notificationPreferences?.replies !== false ? 'checked' : ''}><span class="switch-slider"></span></label>
        </div>
        <button class="btn btn-primary mt-2" id="save-notifications">Save Notification Settings</button>
      </div>

      <div class="settings-section">
        <h3>Danger Zone</h3>
        <p class="text-secondary mb-2">Permanently delete your account and all data.</p>
        <button class="btn btn-danger" id="delete-account">Delete Account</button>
      </div>
    </div>
  `;
};

export const bindSettingsEvents = (onLogout) => {
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const data = await api.put('/users/profile', {
        name: form.name.value,
        bio: form.bio.value,
        location: form.location.value,
        website: form.website.value,
      });
      setUser(data.user);
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api.put('/users/change-password', {
        currentPassword: form.currentPassword.value,
        newPassword: form.newPassword.value,
      });
      showToast('Password changed!', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-privacy')?.addEventListener('click', async () => {
    try {
      await api.put('/users/settings', {
        privacy: {
          profileVisibility: document.getElementById('profile-visibility').value,
          showEmail: document.getElementById('show-email').checked,
        },
      });
      showToast('Privacy settings saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-notifications')?.addEventListener('click', async () => {
    try {
      await api.put('/users/settings', {
        notificationPreferences: {
          likes: document.getElementById('notif-likes').checked,
          comments: document.getElementById('notif-comments').checked,
          follows: document.getElementById('notif-follows').checked,
          replies: document.getElementById('notif-replies').checked,
        },
      });
      showToast('Notification preferences saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('delete-account')?.addEventListener('click', async () => {
    const confirmed = await confirmDialog('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;
    try {
      await api.delete('/users/account');
      showToast('Account deleted', 'success');
      onLogout();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};
