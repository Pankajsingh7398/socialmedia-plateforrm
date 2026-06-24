import { api, getMediaUrl } from '../api.js';
import { escapeHtml, showToast } from '../utils.js';

export const renderReelsPage = () => `
  <div style="max-width:480px;margin:0 auto">
    <div class="page-header" style="margin-bottom:1rem"><h1 style="font-weight:800">Reels</h1></div>
    <label class="btn btn-gradient" style="width:100%;margin-bottom:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem">
      📹 Upload Reel
      <input type="file" id="reel-upload" accept="video/*" hidden>
    </label>
    <div class="reel-container" id="reels-container"><div class="skeleton" style="height:400px;border-radius:20px"></div></div>
  </div>
`;

export const loadReels = async () => {
  const container = document.getElementById('reels-container');
  try {
    const data = await api.get('/reels');
    const reels = data.reels || [];

    if (!reels.length) {
      container.innerHTML = '<div class="empty-state glass-card" style="padding:3rem"><p>No reels yet. Upload your first reel!</p></div>';
      return;
    }

    container.innerHTML = reels.map((reel) => `
      <div class="reel-item glass-card" data-reel-id="${reel._id}">
        <video src="${getMediaUrl(reel.video?.url)}" loop muted playsinline data-reel-video></video>
        <div class="reel-overlay">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
            <img class="avatar avatar-sm" src="${getMediaUrl(reel.userId?.profileImage) || ''}" alt="" style="border:2px solid #fff">
            <a href="#profile/${reel.userId?.username}" style="color:#fff;font-weight:700">@${escapeHtml(reel.userId?.username)}</a>
          </div>
          <p style="font-size:0.9375rem;margin-bottom:0.5rem">${escapeHtml(reel.caption || '')}</p>
          <div style="font-size:0.8125rem;opacity:0.8">${reel.views || 0} views · ${reel.likesCount || 0} likes</div>
          <div style="position:absolute;right:1rem;bottom:6rem;display:flex;flex-direction:column;gap:1rem">
            <button class="btn btn-ghost" data-action="like-reel" data-id="${reel._id}" style="color:#fff;font-size:1.5rem">❤️</button>
            <button class="btn btn-ghost" data-action="save-reel" data-id="${reel._id}" style="color:#fff;font-size:1.5rem">🔖</button>
            <button class="btn btn-ghost" data-action="share-post" data-id="${reel._id}" style="color:#fff;font-size:1.5rem">↗️</button>
          </div>
        </div>
      </div>
    `).join('');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting) { video.play().catch(() => {}); api.get(`/reels/${entry.target.dataset.reelId}`).catch(() => {}); }
        else video.pause();
      });
    }, { threshold: 0.7 });

    container.querySelectorAll('.reel-item').forEach((el) => observer.observe(el));
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Failed to load reels</p></div>';
  }
};

export const bindReelEvents = () => {
  document.getElementById('reel-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const caption = prompt('Add a caption (optional):') || '';
    const formData = new FormData();
    formData.append('video', file);
    formData.append('caption', caption);
    try {
      await api.upload('/reels', formData);
      showToast('Reel uploaded!', 'success');
      loadReels();
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });
};
