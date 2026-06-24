import { api, getMediaUrl } from '../api.js';
import { renderPostCard } from '../components/postCard.js';
import { escapeHtml } from '../utils.js';

export const renderExplorePage = () => `
  <div class="page-container-full">
    <div class="page-header" style="margin-bottom:1.5rem"><h1 style="font-weight:800;font-size:1.75rem">Explore</h1></div>
    <div class="feed-tabs glass-card" style="margin-bottom:1.5rem;display:flex;overflow:hidden">
      <button class="feed-tab active" data-filter="all">All</button>
      <button class="feed-tab" data-filter="users">Users</button>
      <button class="feed-tab" data-filter="posts">Posts</button>
      <button class="feed-tab" data-filter="hashtags">Hashtags</button>
      <button class="feed-tab" data-filter="reels">Reels</button>
    </div>
    <div id="explore-content"><div class="skeleton skeleton-card" style="height:300px"></div></div>
  </div>
`;

export const loadExplore = async () => {
  const container = document.getElementById('explore-content');
  try {
    const data = await api.get('/explore');
    container.innerHTML = `
      <div class="widget glass-card" style="margin-bottom:1.5rem">
        <h3 class="widget-title">Trending Hashtags</h3>
        <div>${data.trendingHashtags?.map((h) => `<a href="#search?q=%23${h.tag}" class="hashtag-pill">#${escapeHtml(h.tag)} <span style="opacity:0.6">${h.count}</span></a>`).join('') || '<p class="text-muted">No trends</p>'}</div>
      </div>
      <h3 style="font-weight:700;margin-bottom:1rem">Trending Posts</h3>
      <div class="explore-grid" style="margin-bottom:2rem">
        ${data.trendingPosts?.map((p) => {
          const img = p.images?.[0]?.url;
          return `<a href="#post/${p._id}" class="explore-tile glass-card">${img ? `<img src="${getMediaUrl(img)}" alt="">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:1rem;background:var(--gradient-soft);font-size:0.875rem">${escapeHtml(p.caption?.slice(0, 80) || 'Post')}</div>`}<div class="explore-tile-overlay">${p.likesCount || 0} ♥</div></a>`;
        }).join('') || ''}
      </div>
      <h3 style="font-weight:700;margin-bottom:1rem">Popular Reels</h3>
      <div class="explore-grid">
        ${data.trendingReels?.map((r) => `<a href="#reels" class="explore-tile glass-card" style="background:#000"><video src="${getMediaUrl(r.video?.url)}" muted style="width:100%;height:100%;object-fit:cover"></video><div class="explore-tile-overlay">▶ ${r.views || 0}</div></a>`).join('') || '<p class="text-muted">No reels yet</p>'}
      </div>
      <h3 style="font-weight:700;margin:1.5rem 0 1rem">Suggested Creators</h3>
      <div class="widget glass-card">
        ${data.suggestedUsers?.map((u) => `
          <div class="user-suggestion" style="padding:0.75rem 0;display:flex;align-items:center;gap:0.75rem">
            <a href="#profile/${u.username}"><img class="avatar" src="${getMediaUrl(u.profileImage) || ''}" alt=""></a>
            <div style="flex:1"><a href="#profile/${u.username}" style="font-weight:700">${escapeHtml(u.name)}</a><div style="font-size:0.8125rem;color:var(--text-muted)">@${escapeHtml(u.username)} · ${u.followers?.length || 0} followers</div></div>
            <button class="btn btn-gradient btn-sm" data-action="follow" data-username="${u.username}">Follow</button>
          </div>
        `).join('') || ''}
      </div>
    `;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Failed to load explore</p></div>';
  }
};
