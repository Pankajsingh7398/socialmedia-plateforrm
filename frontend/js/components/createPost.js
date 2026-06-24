import { api, getMediaUrl } from '../api.js';
import { getUser } from '../auth.js';
import { showToast } from '../utils.js';

const EMOJIS = ['😀','😂','❤️','🔥','👍','🎉','😍','🙌','💯','✨','😎','🤔','😢','👏','🚀','💪','🌟','💖','😊','🥳'];

export const openCreatePostModal = (onSuccess) => {
  const user = getUser();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal glass-card" style="max-width:560px">
      <div class="modal-header">
        <h3 style="font-weight:700">Create Post</h3>
        <button class="btn btn-ghost" id="close-create-modal">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
          <img class="avatar" src="${getMediaUrl(user?.profileImage) || ''}" alt="" style="width:44px;height:44px" onerror="this.style.background='var(--bg-tertiary)'">
          <div style="flex:1">
            <div style="font-weight:700">${user?.name}</div>
            <select id="post-audience" class="form-select" style="margin-top:0.25rem;padding:0.375rem 0.75rem;font-size:0.8125rem;width:auto">
              <option value="public">🌍 Public</option>
              <option value="followers">👥 Followers Only</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>
        <textarea id="modal-caption" class="form-textarea" placeholder="What's on your mind?" rows="4" style="border:none;background:transparent;font-size:1.125rem;resize:none;min-height:120px"></textarea>
        <input type="text" id="post-location" class="form-input" placeholder="📍 Add location" style="margin-top:0.5rem">
        <div class="image-preview-grid hidden" id="modal-preview-grid"></div>
        <div id="poll-builder" class="hidden" style="margin-top:1rem;padding:1rem;background:var(--bg-tertiary);border-radius:12px">
          <input type="text" id="poll-question" class="form-input" placeholder="Poll question" style="margin-bottom:0.5rem">
          <input type="text" class="form-input poll-option" placeholder="Option 1" style="margin-bottom:0.5rem">
          <input type="text" class="form-input poll-option" placeholder="Option 2">
        </div>
        <div class="emoji-picker hidden" id="emoji-picker">${EMOJIS.map((e) => `<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`).join('')}</div>
      </div>
      <div class="modal-footer" style="justify-content:space-between">
        <div style="display:flex;gap:0.5rem">
          <label class="btn btn-ghost btn-sm" style="cursor:pointer" title="Photos/Videos">📷<input type="file" id="modal-images" accept="image/*,video/*" multiple hidden></label>
          <button class="btn btn-ghost btn-sm" id="toggle-emoji" title="Emoji">😊</button>
          <button class="btn btn-ghost btn-sm" id="toggle-poll" title="Poll">📊</button>
          <button class="btn btn-ghost btn-sm" id="save-draft" title="Save Draft">📝</button>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-secondary btn-sm" id="schedule-post" title="Schedule">🕐 Schedule</button>
          <button class="btn btn-gradient" id="submit-post">Post</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let selectedFiles = [];
  const previewGrid = overlay.querySelector('#modal-preview-grid');
  const caption = overlay.querySelector('#modal-caption');

  const renderPreviews = () => {
    if (!selectedFiles.length) { previewGrid.classList.add('hidden'); previewGrid.innerHTML = ''; return; }
    previewGrid.classList.remove('hidden');
    previewGrid.innerHTML = selectedFiles.map((file, i) => `
      <div class="image-preview"><img src="${URL.createObjectURL(file)}"><button class="remove-btn" data-index="${i}">×</button></div>
    `).join('');
  };

  overlay.querySelector('#modal-images')?.addEventListener('change', (e) => {
    selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
    renderPreviews();
    e.target.value = '';
  });
  previewGrid?.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      selectedFiles.splice(parseInt(e.target.dataset.index), 1);
      renderPreviews();
    }
  });

  overlay.querySelector('#toggle-emoji')?.addEventListener('click', () => {
    overlay.querySelector('#emoji-picker')?.classList.toggle('hidden');
  });
  overlay.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.addEventListener('click', () => { caption.value += btn.dataset.emoji; });
  });
  overlay.querySelector('#toggle-poll')?.addEventListener('click', () => {
    overlay.querySelector('#poll-builder')?.classList.toggle('hidden');
  });

  const submit = async (isDraft = false, scheduledAt = null) => {
    const formData = new FormData();
    const text = caption.value.trim();
    if (!text && !selectedFiles.length && !overlay.querySelector('#poll-question')?.value) {
      showToast('Add some content', 'error');
      return;
    }
    if (text) formData.append('caption', text);
    formData.append('audience', overlay.querySelector('#post-audience').value);
    formData.append('location', overlay.querySelector('#post-location').value);
    formData.append('isDraft', isDraft);
    if (scheduledAt) formData.append('scheduledAt', scheduledAt);

    const pollQ = overlay.querySelector('#poll-question')?.value;
    if (pollQ) {
      const options = [...overlay.querySelectorAll('.poll-option')].map((o) => o.value).filter(Boolean);
      if (options.length >= 2) formData.append('poll', JSON.stringify({ question: pollQ, options }));
    }

    selectedFiles.forEach((f) => formData.append('images', f));

    try {
      await api.upload('/posts', formData);
      showToast(isDraft ? 'Draft saved!' : 'Post created!', 'success');
      overlay.remove();
      onSuccess?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  overlay.querySelector('#submit-post')?.addEventListener('click', () => submit());
  overlay.querySelector('#save-draft')?.addEventListener('click', () => submit(true));
  overlay.querySelector('#schedule-post')?.addEventListener('click', () => {
    const when = prompt('Schedule date/time (YYYY-MM-DD HH:MM):');
    if (when) submit(false, new Date(when).toISOString());
  });
  overlay.querySelector('#close-create-modal')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
};
