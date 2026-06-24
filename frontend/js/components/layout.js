import { getUser } from '../auth.js';
import { getMediaUrl, api } from '../api.js';
import { themeIcon } from '../theme.js';
import { escapeHtml } from '../utils.js';

const icons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  reels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  bookmarks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  create: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

const navItems = [
  { path: 'feed', label: 'Home', icon: icons.home },
  { path: 'explore', label: 'Explore', icon: icons.explore },
  { path: 'reels', label: 'Reels', icon: icons.reels },
  { path: 'messages', label: 'Messages', icon: icons.messages, badge: 'msg-badge' },
  { path: 'notifications', label: 'Notifications', icon: icons.notifications, badge: 'notif-badge' },
  { path: 'bookmarks', label: 'Bookmarks', icon: icons.bookmarks },
  { path: 'profile', label: 'Profile', icon: icons.profile, dynamic: true },
  { path: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  { path: 'settings', label: 'Settings', icon: icons.settings },
];

const bottomNavItems = [
  { path: 'feed', icon: icons.home, label: 'Home' },
  { path: 'explore', icon: icons.explore, label: 'Explore' },
  { path: 'reels', icon: icons.reels, label: 'Reels' },
  { path: 'messages', icon: icons.messages, label: 'Messages', badge: 'msg-badge-mobile' },
  { path: 'profile', icon: icons.profile, label: 'Profile', dynamic: true },
];

const verifiedBadge = (user) => user?.isVerified ? '<span class="verified-badge" title="Verified">✓</span>' : '';

export const renderRightSidebar = () => `
  <aside class="right-sidebar" id="right-sidebar">
    <div class="widget" id="widget-suggested">
      <h3 class="widget-title">Who to follow</h3>
      <div id="rs-suggested"><div class="skeleton skeleton-text"></div></div>
    </div>
    <div class="widget" id="widget-hashtags">
      <h3 class="widget-title">Trending</h3>
      <div id="rs-hashtags"><div class="skeleton skeleton-text"></div></div>
    </div>
    <div class="widget" id="widget-requests">
      <h3 class="widget-title">Follow Requests</h3>
      <div id="rs-requests"><p class="text-muted" style="font-size:0.875rem">No pending requests</p></div>
    </div>
    <div class="widget">
      <h3 class="widget-title">Recent Activity</h3>
      <div id="rs-activity"><div class="skeleton skeleton-text"></div></div>
    </div>
  </aside>
`;

export const renderLayout = (content, activeRoute = 'feed', options = {}) => {
  const user = getUser();
  const useGrid = options.useGrid !== false;

  const navHtml = navItems.map((item) => {
    const path = item.dynamic ? `profile/${user?.username}` : item.path;
    const isActive = activeRoute === item.path || (item.dynamic && activeRoute.startsWith('profile'));
    const badge = item.badge ? `<span class="badge-count hidden" id="${item.badge}"></span>` : '';
    return `<a href="#${path}" class="nav-item ${isActive ? 'active' : ''}" data-nav="${item.path}">${item.icon}<span>${item.label}</span>${badge}</a>`;
  }).join('');

  const bottomNavHtml = bottomNavItems.map((item) => {
    const path = item.dynamic ? `profile/${user?.username}` : item.path;
    const isActive = activeRoute === item.path || (item.dynamic && activeRoute.startsWith('profile'));
    const badge = item.badge ? `<span class="badge-count hidden" id="${item.badge}" style="top:0;right:8px"></span>` : '';
    return `<a href="#${path}" class="bottom-nav-item ${isActive ? 'active' : ''}">${item.icon}<span>${item.label}</span>${badge}</a>`;
  }).join('');

  const pageContent = useGrid
    ? `<div class="content-grid page-enter"><div class="content-main">${content}</div>${renderRightSidebar()}</div>`
    : `<div class="page-enter" style="padding:clamp(0.875rem, 4vw, 1.5rem);max-width:1200px;margin:0 auto">${content}</div>`;

  return `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><div class="pulse-logo">Pulse</div></div>
        <button class="btn btn-gradient sidebar-create" id="open-create-post">${icons.create} Create Post</button>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost" id="theme-toggle" style="width:100%;margin-bottom:0.5rem;font-weight:600">${themeIcon()} Dark Mode</button>
          <div class="user-mini-card">
            <div class="avatar-wrap">
              <img class="avatar avatar-sm" src="${getMediaUrl(user?.profileImage) || ''}" alt="" onerror="this.style.opacity='0.3'">
            </div>
            <div class="user-mini-info" style="flex:1;min-width:0">
              <div class="user-mini-name" style="font-weight:700;font-size:0.875rem">${escapeHtml(user?.name || '')}${verifiedBadge(user)}</div>
              <div class="user-mini-username" style="font-size:0.75rem;color:var(--text-muted)">@${escapeHtml(user?.username || '')}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="logout-btn" style="width:100%">Logout</button>
        </div>
      </aside>
      <div class="main-wrapper">
        <header class="topbar">
          <button class="btn btn-ghost mobile-menu-btn" id="mobile-menu-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div class="pulse-logo-sm mobile-logo" style="display:none">Pulse</div>
          <div class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="search" id="global-search" placeholder="Search Pulse..." autocomplete="off">
            <div class="search-suggestions hidden" id="search-suggestions"></div>
          </div>
          <div class="topbar-actions">
            <button class="topbar-btn" id="top-create-post" title="Create Post">${icons.create}</button>
            <a href="#messages" class="topbar-btn" title="Messages">
              ${icons.messages}
              <span class="badge-count hidden" id="msg-badge-top"></span>
            </a>
            <a href="#notifications" class="topbar-btn" title="Notifications">
              ${icons.notifications}
              <span class="badge-count hidden" id="notif-badge-top"></span>
            </a>
            <div class="avatar-dropdown" id="avatar-dropdown">
              <img class="avatar avatar-sm" src="${getMediaUrl(user?.profileImage) || ''}" alt="" id="top-avatar" onerror="this.style.opacity='0.3'">
              <div class="dropdown-menu hidden" id="avatar-menu">
                <a href="#profile/${user?.username}" class="dropdown-item">View Profile</a>
                <a href="#dashboard" class="dropdown-item">Dashboard</a>
                <a href="#settings" class="dropdown-item">Settings</a>
                ${user?.role === 'admin' ? '<a href="#admin" class="dropdown-item">Admin Panel</a>' : ''}
                <button class="dropdown-item danger" id="logout-btn-top">Logout</button>
              </div>
            </div>
          </div>
        </header>
        <div id="page-content">${pageContent}</div>
      </div>
      <nav class="bottom-nav">${bottomNavHtml}</nav>
    </div>
  `;
};

export const loadRightSidebar = async () => {
  try {
    const [suggested, explore, requests, notifs] = await Promise.all([
      api.get('/users/suggested?limit=4').catch(() => ({ users: [] })),
      api.get('/explore').catch(() => ({ trendingHashtags: [] })),
      api.get('/follow/requests').catch(() => ({ requests: [] })),
      api.get('/notifications?limit=5').catch(() => ({ notifications: [] })),
    ]);

    const sugEl = document.getElementById('rs-suggested');
    if (sugEl) {
      sugEl.innerHTML = suggested.users?.length
        ? suggested.users.map((u) => `
          <div class="user-suggestion" style="padding:0.5rem 0">
            <a href="#profile/${u.username}"><img class="avatar avatar-sm" src="${getMediaUrl(u.profileImage) || ''}" alt=""></a>
            <div class="user-suggestion-info" style="flex:1">
              <a href="#profile/${u.username}" style="font-weight:600;font-size:0.875rem">${escapeHtml(u.name)}${verifiedBadge(u)}</a>
              <div style="font-size:0.75rem;color:var(--text-muted)">@${escapeHtml(u.username)}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-action="follow" data-username="${u.username}">Follow</button>
          </div>
        `).join('')
        : '<p class="text-muted" style="font-size:0.875rem">No suggestions</p>';
    }

    const hashEl = document.getElementById('rs-hashtags');
    if (hashEl) {
      hashEl.innerHTML = explore.trendingHashtags?.length
        ? explore.trendingHashtags.slice(0, 6).map((h) =>
            `<a href="#search?q=%23${h.tag}" class="hashtag-pill">#${escapeHtml(h.tag)} <span style="opacity:0.7;font-weight:400">${h.count}</span></a>`
          ).join('')
        : '<p class="text-muted" style="font-size:0.875rem">No trends yet</p>';
    }

    const reqEl = document.getElementById('rs-requests');
    if (reqEl && requests.requests?.length) {
      reqEl.innerHTML = requests.requests.map((r) => `
        <div class="user-suggestion" style="padding:0.5rem 0">
          <img class="avatar avatar-sm" src="${getMediaUrl(r.from?.profileImage) || ''}" alt="">
          <div style="flex:1;font-size:0.875rem;font-weight:600">${escapeHtml(r.from?.name)}</div>
          <button class="btn btn-primary btn-sm" data-action="accept-request" data-userid="${r.from._id}">Accept</button>
        </div>
      `).join('');
    }

    const actEl = document.getElementById('rs-activity');
    if (actEl) {
      actEl.innerHTML = notifs.notifications?.length
        ? notifs.notifications.slice(0, 4).map((n) => `
          <div style="font-size:0.8125rem;padding:0.5rem 0;border-bottom:1px solid var(--border)">
            <strong>${escapeHtml(n.senderId?.name || 'Someone')}</strong> ${escapeHtml(n.message || n.type)}
          </div>
        `).join('')
        : '<p class="text-muted" style="font-size:0.875rem">No recent activity</p>';
    }
  } catch { /* ignore */ }
};

export const bindLayoutEvents = (callbacks = {}) => {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('open');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  });

  const logout = callbacks.onLogout;
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('logout-btn-top')?.addEventListener('click', logout);
  document.getElementById('theme-toggle')?.addEventListener('click', callbacks.onThemeToggle);

  document.getElementById('open-create-post')?.addEventListener('click', callbacks.onCreatePost);
  document.getElementById('top-create-post')?.addEventListener('click', callbacks.onCreatePost);

  const avatarDrop = document.getElementById('avatar-dropdown');
  document.getElementById('top-avatar')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('avatar-menu')?.classList.toggle('hidden');
  });
  document.addEventListener('click', () => document.getElementById('avatar-menu')?.classList.add('hidden'));

  if (callbacks.onSearch) {
    const searchInput = document.getElementById('global-search');
    const suggestions = document.getElementById('search-suggestions');
    searchInput?.addEventListener('input', callbacks.onSearch);
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.hash = `search?q=${encodeURIComponent(searchInput.value.trim())}`;
        suggestions?.classList.add('hidden');
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) suggestions?.classList.add('hidden');
    });
  }

  loadRightSidebar();
};

export const updateBadges = (notifCount, msgCount) => {
  ['notif-badge', 'notif-badge-top'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = notifCount > 99 ? '99+' : notifCount;
      el.classList.toggle('hidden', !notifCount);
    }
  });
  ['msg-badge', 'msg-badge-top', 'msg-badge-mobile'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msgCount > 99 ? '99+' : msgCount;
      el.classList.toggle('hidden', !msgCount);
    }
  });
};

export const updateNotifBadge = (count) => updateBadges(count, null);
