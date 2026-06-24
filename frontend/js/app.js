import {
  isAuthenticated, loadStoredUser, fetchCurrentUser, logout, getUser,
} from './auth.js';
import { api } from './api.js';
import { initTheme, toggleTheme } from './theme.js';
import { showToast, debounce, openLightbox, confirmDialog } from './utils.js';
import { renderLayout, bindLayoutEvents, updateBadges } from './components/layout.js';
import { renderComment, showReactionPicker, bindCarousels } from './components/postCard.js';
import { openCreatePostModal } from './components/createPost.js';
import { initSocket } from './socket.js';
import {
  renderLogin, renderRegister, renderForgotPassword, renderResetPassword,
  renderVerifyEmail, bindAuthEvents, handleVerifyEmail,
} from './pages/auth.js';
import { renderFeedPage, bindFeedEvents } from './pages/feed.js';
import { renderProfilePage, loadProfile, bindProfileEvents, renderFollowList } from './pages/profile.js';
import { renderPostPage, loadPost, bindCommentEvents, addReply } from './pages/post.js';
import { renderSearchPage, bindSearchEvents, fetchSuggestions, renderSuggestions } from './pages/search.js';
import { renderNotificationsPage, loadNotifications, bindNotificationEvents } from './pages/notifications.js';
import { renderDashboardPage, loadDashboard, renderSettingsPage, bindSettingsEvents } from './pages/settings.js';
import { renderExplorePage, loadExplore } from './pages/explore.js';
import { renderReelsPage, loadReels, bindReelEvents } from './pages/reels.js';
import { renderMessagesPage, loadConversations, bindMessageEvents, openChat } from './pages/messages.js';
import { renderBookmarksPage, loadBookmarks } from './pages/bookmarks.js';
import { renderAdminPage, loadAdmin } from './pages/admin.js';

const app = document.getElementById('app');
const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email'];

const parseRoute = () => {
  const hash = window.location.hash.slice(1) || 'feed';
  const [path, ...rest] = hash.split('/').filter(Boolean);
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

  if (path === 'search') return { path, query: params.get('q') || '' };
  if (path === 'verify-email') return { path, token: params.get('token') };
  if (path === 'reset-password') return { path, token: params.get('token') };
  if (path === 'profile' && rest.length >= 2 && ['followers', 'following'].includes(rest[1])) {
    return { path: 'follow-list', username: rest[0], type: rest[1] };
  }
  if (path === 'profile' && rest[0]) return { path: 'profile', username: rest[0] };
  if (path === 'post' && rest[0]) return { path: 'post', postId: rest[0] };
  if (path === 'messages' && rest[0]) return { path: 'messages', username: rest[0] };
  return { path };
};

const renderError = (code, message) => `
  <div class="error-page fade-in" style="padding:3rem;text-align:center">
    <h1 style="font-size:4rem;font-weight:800;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${code}</h1>
    <p style="color:var(--text-secondary);margin:1rem 0">${message}</p>
    <a href="#feed" class="btn btn-gradient">Go Home</a>
  </div>
`;

let postActionsBound = false;

const bindPostActions = () => {
  if (postActionsBound) return;
  postActionsBound = true;

  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) {
      if (e.target.closest('.post-menu-btn')) {
        e.stopPropagation();
        const menuId = `menu-${e.target.closest('.post-menu-btn').dataset.postId}`;
        document.querySelectorAll('.dropdown-menu').forEach((m) => { if (m.id !== menuId) m.classList.add('hidden'); });
        document.getElementById(menuId)?.classList.toggle('hidden');
      }
      return;
    }

    const { action, id, username, reaction, index, type, userid } = target.dataset;

    try {
      switch (action) {
        case 'react-post':
          showReactionPicker(target, id);
          break;
        case 'set-reaction':
          await api.post(`/posts/${id}/like`, { reaction });
          showToast('Reaction added!', 'success');
          navigate();
          break;
        case 'like-comment': {
          const data = await api.post(`/comments/${id}/like`);
          target.textContent = `${data.liked ? 'Unlike' : 'Like'}${data.likesCount ? ` (${data.likesCount})` : ''}`;
          break;
        }
        case 'follow':
        case 'unfollow':
          if (action === 'follow') {
            const res = await api.post(`/follow/${username}/follow`);
            showToast(res.pending ? 'Request sent' : `Following @${username}`, 'success');
            target.textContent = res.pending ? 'Requested' : 'Unfollow';
            if (!res.pending) { target.dataset.action = 'unfollow'; target.classList.replace('btn-primary', 'btn-secondary'); target.classList.replace('btn-gradient', 'btn-secondary'); }
          } else {
            await api.delete(`/follow/${username}/follow`);
            target.textContent = 'Follow';
            target.dataset.action = 'follow';
          }
          break;
        case 'accept-request':
          await api.post(`/follow/requests/${userid}/accept`);
          showToast('Request accepted', 'success');
          target.closest('.user-suggestion')?.remove();
          break;
        case 'bookmark': {
          const body = type === 'post' ? { postId: id } : { reelId: id };
          const data = await api.post('/bookmarks/toggle', body);
          target.style.color = data.saved ? 'var(--accent)' : '';
          showToast(data.saved ? 'Saved!' : 'Removed from saved', 'info');
          break;
        }
        case 'delete-post':
          if (await confirmDialog('Delete this post?')) {
            await api.delete(`/posts/${id}`);
            document.querySelector(`[data-post-id="${id}"]`)?.remove();
            showToast('Post deleted', 'success');
          }
          break;
        case 'pin-post':
          await api.post(`/posts/${id}/pin`);
          showToast('Post pinned', 'success');
          break;
        case 'copy-link':
          navigator.clipboard.writeText(`${location.origin}${location.pathname}#post/${id}`);
          showToast('Link copied!', 'success');
          break;
        case 'share-post':
          await api.post(`/posts/${id}/share`);
          navigator.clipboard.writeText(`${location.origin}${location.pathname}#post/${id}`);
          showToast('Shared!', 'success');
          break;
        case 'report-post': {
          const reason = prompt('Why are you reporting this?');
          if (reason) { await api.post('/reports', { targetType: 'post', targetId: id, reason }); showToast('Report submitted', 'info'); }
          break;
        }
        case 'resolve-report':
          await api.put(`/admin/reports/${id}/resolve`);
          target.closest('div')?.remove();
          break;
        case 'vote-poll':
          await api.post(`/posts/${id}/vote`, { optionIndex: parseInt(index) });
          navigate();
          break;
        case 'like-reel':
          await api.post(`/reels/${id}/like`);
          showToast('Liked!', 'success');
          break;
        case 'save-reel':
          await api.post(`/reels/${id}/save`);
          showToast('Saved!', 'success');
          break;
        case 'delete-comment':
          if (await confirmDialog('Delete comment?')) {
            await api.delete(`/comments/${id}`);
            document.querySelector(`[data-comment-id="${id}"]`)?.remove();
          }
          break;
        case 'edit-post': {
          const cap = prompt('Edit caption:');
          if (cap !== null) await api.put(`/posts/${id}`, { caption: cap });
          navigate();
          break;
        }
        case 'reply-comment': {
          const text = prompt('Reply:');
          if (text?.trim()) { await addReply(target.dataset.post, id, text.trim()); navigate(); }
          break;
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown-menu').forEach((m) => m.classList.add('hidden'));
    if (e.target.dataset.lightbox) openLightbox(e.target.dataset.lightbox);
  });
};

const refreshBadges = async () => {
  if (!isAuthenticated()) return;
  try {
    const [notif, msg] = await Promise.all([
      api.get('/notifications/unread-count'),
      api.get('/messages/unread-count'),
    ]);
    updateBadges(notif.unreadCount, msg.unreadCount);
  } catch { /* ignore */ }
};

const navigate = async () => {
  const route = parseRoute();

  if (!isAuthenticated() && !publicRoutes.includes(route.path)) {
    window.location.hash = 'login';
    return;
  }
  if (isAuthenticated() && ['login', 'register'].includes(route.path)) {
    window.location.hash = 'feed';
    return;
  }

  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');

  if (!isAuthenticated()) {
    app.innerHTML = '';
    const onSuccess = () => { window.location.hash = 'feed'; };
    switch (route.path) {
      case 'register': app.innerHTML = renderRegister(); bindAuthEvents(onSuccess); break;
      case 'forgot-password': app.innerHTML = renderForgotPassword(); bindAuthEvents(() => {}); break;
      case 'reset-password': app.innerHTML = renderResetPassword(route.token); bindAuthEvents(onSuccess); break;
      case 'verify-email': app.innerHTML = renderVerifyEmail(route.token); handleVerifyEmail(route.token); break;
      default: app.innerHTML = renderLogin(); bindAuthEvents(onSuccess);
    }
    return;
  }

  const pageMap = {
    feed: renderFeedPage,
    explore: renderExplorePage,
    reels: renderReelsPage,
    messages: renderMessagesPage,
    bookmarks: renderBookmarksPage,
    notifications: renderNotificationsPage,
    dashboard: renderDashboardPage,
    settings: renderSettingsPage,
    admin: renderAdminPage,
    search: () => renderSearchPage(route.query),
    profile: () => renderProfilePage(route.username),
    post: () => renderPostPage(route.postId),
    'follow-list': () => '<div id="inner-page"></div>',
  };

  const noGrid = ['messages', 'reels', 'admin', 'post', 'profile', 'follow-list'];
  const content = pageMap[route.path] ? pageMap[route.path]() : renderError(404, 'Page not found');
  const activeRoute = route.path === 'search' ? 'explore' : route.path;

  app.innerHTML = renderLayout(content, activeRoute, { useGrid: !noGrid.includes(route.path) });

  bindLayoutEvents({
    onLogout: () => { logout(); window.location.hash = 'login'; },
    onThemeToggle: () => toggleTheme(),
    onCreatePost: () => openCreatePostModal(() => navigate()),
    onSearch: debounce(async (e) => {
      const q = e.target.value.trim();
      const sug = document.getElementById('search-suggestions');
      if (!q) { sug?.classList.add('hidden'); return; }
      renderSuggestions(await fetchSuggestions(q), sug);
    }, 300),
  });

  initSocket();

  const loaders = {
    feed: () => bindFeedEvents(),
    explore: () => loadExplore(),
    reels: () => { loadReels(); bindReelEvents(); },
    messages: () => {
      loadConversations();
      bindMessageEvents();
      if (route.username) {
        api.get(`/messages/with/${route.username}`).then((r) => openChat(r.conversation._id, route.username)).catch(() => {});
      }
    },
    bookmarks: () => loadBookmarks(),
    notifications: () => { loadNotifications(); bindNotificationEvents(); },
    dashboard: () => loadDashboard(),
    settings: () => bindSettingsEvents(() => { logout(); window.location.hash = 'login'; }),
    admin: () => loadAdmin(),
    search: () => bindSearchEvents(route.query),
    profile: () => loadProfile(route.username).then(() => bindProfileEvents(route.username)),
    post: () => loadPost(route.postId).then(() => { bindCommentEvents(route.postId); bindCarousels(); }),
    'follow-list': () => renderFollowList(route.username, route.type),
  };

  loaders[route.path]?.();
  refreshBadges();
};

const init = async () => {
  try {
    initTheme();
    loadStoredUser();
    if (isAuthenticated()) await fetchCurrentUser();
    bindPostActions();
    if (!window.location.hash) window.location.hash = isAuthenticated() ? 'feed' : 'login';
    else navigate();
    setInterval(refreshBadges, 30000);

    let touchStart = 0;
    document.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientY; });
    document.addEventListener('touchend', async (e) => {
      if (window.scrollY === 0 && e.changedTouches[0].clientY - touchStart > 80 && window.location.hash === '#feed') {
        showToast('Refreshing...', 'info');
        navigate();
      }
    });
  } catch (error) {
    console.error(error);
    app.innerHTML = renderError('!', 'Failed to load Pulse. Run <code>npm run dev</code> in the backend folder.');
  } finally {
    document.getElementById('loading-screen')?.remove();
    window.addEventListener('hashchange', navigate);
  }
};

init();
