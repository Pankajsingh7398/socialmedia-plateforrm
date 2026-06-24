import { api, getMediaUrl } from '../api.js';
import { getUser } from '../auth.js';
import { renderPostCard, renderPostSkeleton, bindCarousels } from '../components/postCard.js';
import { renderStoriesBar, loadStories, bindStoryEvents } from '../components/stories.js';
import { openCreatePostModal } from '../components/createPost.js';
import { showToast } from '../utils.js';

let currentTab = 'home';
let currentPage = 1;
let loading = false;
let hasMore = true;

export const renderFeedPage = () => `
  ${renderStoriesBar()}
  <div class="feed-tabs glass-card" style="display:flex;margin-bottom:1.25rem;overflow:hidden">
    <button class="feed-tab active" data-tab="home" style="flex:1;padding:0.875rem;border:none;background:none;font-weight:600;cursor:pointer">For You</button>
    <button class="feed-tab" data-tab="trending" style="flex:1;padding:0.875rem;border:none;background:none;font-weight:600;cursor:pointer">Trending</button>
    <button class="feed-tab" data-tab="latest" style="flex:1;padding:0.875rem;border:none;background:none;font-weight:600;cursor:pointer">Latest</button>
  </div>
  <div class="glass-card" style="padding:1rem 1.25rem;margin-bottom:1.25rem;display:flex;gap:0.75rem;align-items:center;cursor:pointer" id="feed-create-trigger">
    <img class="avatar" id="feed-avatar" src="" alt="" style="width:44px;height:44px" onerror="this.style.background='var(--bg-tertiary)'">
    <span style="color:var(--text-muted);font-weight:500;flex:1">What's on your mind?</span>
    <span style="font-size:1.25rem">📷</span>
  </div>
  <div id="feed-posts">${renderPostSkeleton()}</div>
  <div class="load-more hidden" id="load-more" style="text-align:center;padding:1.5rem">
    <button class="btn btn-secondary" id="load-more-btn">Load More</button>
  </div>
`;

const getEndpoint = (tab, page) => {
  const limit = 10;
  if (tab === 'home') return `/posts/feed?page=${page}&limit=${limit}`;
  if (tab === 'trending') return `/posts/trending?page=${page}&limit=${limit}`;
  return `/posts/latest?page=${page}&limit=${limit}`;
};

export const loadFeed = async (tab = currentTab, page = 1, append = false) => {
  if (loading) return;
  loading = true;
  const container = document.getElementById('feed-posts');
  if (!container) return;
  if (!append) container.innerHTML = renderPostSkeleton();

  try {
    const data = await api.get(getEndpoint(tab, page));
    const posts = data.posts || [];
    const html = posts.map((p) => renderPostCard(p)).join('');

    if (append) container.insertAdjacentHTML('beforeend', html);
    else container.innerHTML = html || '<div class="empty-state glass-card"><p>No posts yet. Follow creators or create your first post!</p></div>';

    bindCarousels();
    hasMore = data.pagination ? page < data.pagination.pages : posts.length >= 10;
    currentPage = page;
    currentTab = tab;
    document.getElementById('load-more')?.classList.toggle('hidden', !hasMore);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    loading = false;
  }
};

export const bindFeedEvents = () => {
  const user = getUser();
  const avatar = document.getElementById('feed-avatar');
  if (avatar && user?.profileImage) avatar.src = getMediaUrl(user.profileImage);

  document.querySelectorAll('.feed-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.feed-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      loadFeed(tab.dataset.tab, 1);
    });
  });

  document.getElementById('feed-create-trigger')?.addEventListener('click', () => {
    openCreatePostModal(() => loadFeed(currentTab, 1));
  });

  document.getElementById('load-more-btn')?.addEventListener('click', () => loadFeed(currentTab, currentPage + 1, true));

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (window.location.hash !== '#feed' && !window.location.hash.startsWith('#feed')) return;
      if (!hasMore || loading) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 400) loadFeed(currentTab, currentPage + 1, true);
    }, 100);
  });

  loadStories();
  bindStoryEvents();
  loadFeed();
};
