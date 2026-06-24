import { api, getMediaUrl } from '../api.js';
import { escapeHtml, formatDate, showToast } from '../utils.js';

export const renderNotificationsPage = () => `
  <div class="page-container">
    <div class="page-header flex justify-between items-center">
      <h1>Notifications</h1>
      <button class="btn btn-secondary btn-sm" id="mark-all-read">Mark all read</button>
    </div>
    <div class="card" id="notifications-list">
      <div class="skeleton skeleton-text" style="margin:1rem"></div>
    </div>
  </div>
`;

const getNotifMessage = (notif) => {
  const sender = notif.senderId?.name || 'Someone';
  const messages = {
    follow: `${sender} started following you`,
    like_post: `${sender} liked your post`,
    like_comment: `${sender} liked your comment`,
    comment: `${sender} commented on your post`,
    reply: `${sender} replied to your comment`,
  };
  return messages[notif.type] || notif.message || 'New notification';
};

const getNotifLink = (notif) => {
  if (notif.type === 'follow') return `#profile/${notif.senderId?.username}`;
  if (notif.type === 'like_post' || notif.type === 'comment') return `#post/${notif.referenceId}`;
  return '#notifications';
};

export const loadNotifications = async () => {
  const container = document.getElementById('notifications-list');

  try {
    const data = await api.get('/notifications?page=1&limit=50');
    const notifications = data.notifications || [];

    container.innerHTML = notifications.length
      ? notifications.map((n) => `
        <a href="${getNotifLink(n)}" class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}">
          <img class="avatar avatar-sm" src="${getMediaUrl(n.senderId?.profileImage) || ''}" alt="">
          <div class="notification-content">
            <div class="notification-text">${escapeHtml(getNotifMessage(n))}</div>
            <div class="notification-time">${formatDate(n.createdAt)}</div>
          </div>
        </a>
      `).join('')
      : '<div class="empty-state"><p>No notifications yet</p></div>';
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load notifications</p></div>';
  }
};

export const bindNotificationEvents = () => {
  document.getElementById('mark-all-read')?.addEventListener('click', async () => {
    try {
      await api.put('/notifications/read-all');
      showToast('All notifications marked as read', 'success');
      loadNotifications();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('notifications-list')?.addEventListener('click', async (e) => {
    const item = e.target.closest('.notification-item');
    if (!item || item.classList.contains('unread') === false) return;

    try {
      await api.put(`/notifications/${item.dataset.id}/read`);
      item.classList.remove('unread');
    } catch {
      // ignore
    }
  });
};
