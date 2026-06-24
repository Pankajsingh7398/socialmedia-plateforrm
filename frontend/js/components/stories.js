import { api, getMediaUrl } from '../api.js';
import { getUser } from '../auth.js';
import { escapeHtml } from '../utils.js';

let storyGroups = [];

export const renderStoriesBar = () => `
  <div class="stories-bar glass-card" id="stories-bar" style="padding:0.75rem 1rem;margin-bottom:1.25rem">
    <div class="story-item" id="add-story-btn">
      <div class="story-add">+</div>
      <span style="font-size:0.75rem;font-weight:600;color:var(--text-secondary)">Your Story</span>
    </div>
    <div id="stories-list" style="display:contents"></div>
  </div>
  <input type="file" id="story-file-input" accept="image/*,video/*" hidden>
`;

export const loadStories = async () => {
  const list = document.getElementById('stories-list');
  if (!list) return;

  try {
    const data = await api.get('/stories/feed');
    storyGroups = data.storyGroups || [];

    list.innerHTML = storyGroups.map((group, gi) => `
      <div class="story-item" data-story-group="${gi}">
        <div class="story-ring ${group.hasUnviewed ? '' : 'viewed'}">
          <img src="${getMediaUrl(group.user.profileImage) || ''}" alt="${escapeHtml(group.user.name)}">
        </div>
        <span style="font-size:0.7rem;font-weight:600;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(group.user.username)}</span>
      </div>
    `).join('');

    list.querySelectorAll('[data-story-group]').forEach((el) => {
      el.addEventListener('click', () => openStoryViewer(parseInt(el.dataset.storyGroup)));
    });
  } catch {
    list.innerHTML = '';
  }
};

const openStoryViewer = (groupIndex) => {
  const group = storyGroups[groupIndex];
  if (!group) return;

  let storyIndex = 0;
  const overlay = document.createElement('div');
  overlay.className = 'story-viewer';

  const render = async () => {
    const story = group.stories[storyIndex];
    if (!story) { overlay.remove(); return; }

    try { await api.get(`/stories/${story._id}`); } catch { /* ignore */ }

    const isVideo = story.media?.type === 'video';
    const mediaHtml = isVideo
      ? `<video src="${getMediaUrl(story.media.url)}" autoplay style="max-width:100%;max-height:100vh;object-fit:contain"></video>`
      : story.media?.url
        ? `<img src="${getMediaUrl(story.media.url)}" style="max-width:100%;max-height:100vh;object-fit:contain">`
        : `<div style="color:#fff;font-size:1.5rem;padding:2rem;text-align:center">${escapeHtml(story.text)}</div>`;

    overlay.innerHTML = `
      <div class="story-progress-bar">
        ${group.stories.map((_, i) => `<div class="story-progress-segment"><div class="story-progress-fill ${i < storyIndex ? 'done' : i === storyIndex ? 'active' : ''}"></div></div>`).join('')}
      </div>
      <div style="position:absolute;top:24px;left:16px;display:flex;align-items:center;gap:0.75rem;color:#fff;z-index:10">
        <img src="${getMediaUrl(group.user.profileImage) || ''}" class="avatar avatar-sm" style="border:2px solid #fff">
        <span style="font-weight:700">${escapeHtml(group.user.name)}</span>
        <span style="opacity:0.7;font-size:0.875rem">${new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <button style="position:absolute;top:16px;right:16px;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;z-index:10" id="close-story">×</button>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%">${mediaHtml}</div>
      ${story.text && story.media?.url ? `<p style="position:absolute;bottom:80px;left:0;right:0;text-align:center;color:#fff;padding:1rem">${escapeHtml(story.text)}</p>` : ''}
      <div style="position:absolute;bottom:24px;left:0;right:0;display:flex;justify-content:center;gap:1rem;z-index:10">
        ${['❤️', '😂', '😮', '👏'].map((e) => `<button class="reaction-btn" data-emoji="${e}" style="font-size:1.5rem">${e}</button>`).join('')}
      </div>
      <div style="position:absolute;top:0;bottom:0;left:0;width:30%;cursor:pointer" id="story-prev"></div>
      <div style="position:absolute;top:0;bottom:0;right:0;width:30%;cursor:pointer" id="story-next"></div>
    `;

    overlay.querySelector('#close-story')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#story-prev')?.addEventListener('click', () => { if (storyIndex > 0) { storyIndex--; render(); } });
    overlay.querySelector('#story-next')?.addEventListener('click', () => { storyIndex++; render(); });
    overlay.querySelectorAll('[data-emoji]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await api.post(`/stories/${story._id}/react`, { emoji: btn.dataset.emoji });
      });
    });

    setTimeout(() => { storyIndex++; render(); }, 5000);
  };

  document.body.appendChild(overlay);
  render();
};

export const bindStoryEvents = () => {
  document.getElementById('add-story-btn')?.addEventListener('click', () => {
    document.getElementById('story-file-input')?.click();
  });

  document.getElementById('story-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);
    try {
      await api.upload('/stories', formData);
      loadStories();
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  });
};
