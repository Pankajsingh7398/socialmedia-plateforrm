import { api } from '../api.js';
import { renderPostCard } from '../components/postCard.js';

export const renderBookmarksPage = () => `
  <div class="page-container">
    <div class="page-header"><h1 style="font-weight:800">Bookmarks</h1></div>
    <div id="bookmarks-content"><div class="skeleton skeleton-card"></div></div>
  </div>
`;

export const loadBookmarks = async () => {
  const container = document.getElementById('bookmarks-content');
  try {
    const data = await api.get('/bookmarks');
    const html = [
      ...(data.posts || []).map((p) => renderPostCard(p)),
      ...(data.reels || []).map((r) => `<div class="glass-card" style="padding:1rem;margin-bottom:1rem"><a href="#reels">🎬 Reel: ${r.caption?.slice(0, 60) || 'Saved reel'}</a></div>`),
    ].join('');

    container.innerHTML = html || '<div class="empty-state glass-card"><p>No saved items yet</p></div>';
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Failed to load bookmarks</p></div>';
  }
};
