import { api, getMediaUrl } from '../api.js';
import { renderPostCard } from '../components/postCard.js';
import { escapeHtml, debounce, showToast } from '../utils.js';

export const renderSearchPage = (query = '') => `
  <div class="page-container-wide">
    <div class="page-header">
      <h1>Search</h1>
    </div>
    <div class="search-bar" style="max-width:100%;margin-bottom:1.5rem">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="search" id="search-input" value="${escapeHtml(query)}" placeholder="Search users, posts, hashtags..." autofocus>
    </div>
    <div id="search-results">
      ${query ? '<div class="skeleton skeleton-card"></div>' : '<div class="empty-state"><p>Search for users, posts, or #hashtags</p></div>'}
    </div>
  </div>
`;

export const performSearch = async (query) => {
  const container = document.getElementById('search-results');
  if (!query.trim()) {
    container.innerHTML = '<div class="empty-state"><p>Search for users, posts, or #hashtags</p></div>';
    return;
  }

  container.innerHTML = '<div class="skeleton skeleton-card"></div>';

  try {
    const data = await api.get(`/search?q=${encodeURIComponent(query)}&type=all`);
    let html = '';

    if (data.users?.length) {
      html += `<div class="search-results-section"><h3>Users</h3><div class="card">`;
      html += data.users.map((u) => `
        <div class="user-suggestion" style="padding:1rem">
          <a href="#profile/${u.username}"><img class="avatar" src="${getMediaUrl(u.profileImage) || ''}" alt=""></a>
          <div class="user-suggestion-info">
            <a href="#profile/${u.username}" class="user-suggestion-name">${escapeHtml(u.name)}</a>
            <div class="user-suggestion-username">@${escapeHtml(u.username)}</div>
            ${u.bio ? `<div class="text-secondary" style="font-size:0.8125rem">${escapeHtml(u.bio)}</div>` : ''}
          </div>
        </div>
      `).join('');
      html += '</div></div>';
    }

    if (data.posts?.length) {
      html += `<div class="search-results-section"><h3>Posts</h3>`;
      html += data.posts.map((p) => renderPostCard(p)).join('');
      html += '</div>';
    }

    if (data.hashtags?.length) {
      data.hashtags.forEach((h) => {
        html += `<div class="search-results-section"><h3>#${escapeHtml(h.tag)} (${h.count} posts)</h3>`;
        if (h.recentPosts?.length) {
          html += h.recentPosts.map((p) => renderPostCard(p)).join('');
        }
        html += '</div>';
      });
    }

    container.innerHTML = html || '<div class="empty-state"><p>No results found</p></div>';
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = '<div class="empty-state"><p>Search failed</p></div>';
  }
};

export const bindSearchEvents = (query) => {
  const input = document.getElementById('search-input');
  if (query) performSearch(query);

  const debouncedSearch = debounce(() => {
    const q = input.value.trim();
    window.location.hash = q ? `search?q=${encodeURIComponent(q)}` : 'search';
    performSearch(q);
  }, 400);

  input?.addEventListener('input', debouncedSearch);
};

export const fetchSuggestions = async (query) => {
  if (!query || query.length < 1) return [];
  try {
    const data = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return data.suggestions || [];
  } catch {
    return [];
  }
};

export const renderSuggestions = (suggestions, container) => {
  if (!suggestions.length) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = suggestions.map((s) => {
    if (s.type === 'user') {
      return `<div class="search-suggestion" data-href="#profile/${s.username}">
        <img class="avatar avatar-sm" src="${getMediaUrl(s.profileImage) || ''}" alt="">
        <div><strong>${escapeHtml(s.name)}</strong><div class="text-muted">@${escapeHtml(s.username)}</div></div>
      </div>`;
    }
    return `<div class="search-suggestion" data-href="#search?q=%23${s.tag}">
      <span style="font-size:1.25rem">#</span>
      <div><strong>#${escapeHtml(s.tag)}</strong><div class="text-muted">${s.count} posts</div></div>
    </div>`;
  }).join('');

  container.querySelectorAll('.search-suggestion').forEach((el) => {
    el.addEventListener('click', () => {
      window.location.hash = el.dataset.href.replace('#', '');
    });
  });
};
