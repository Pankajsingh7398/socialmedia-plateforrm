export const showToast = (message, type = 'info', duration = 4000) => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const parseHashtags = (text) => {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /#(\w+)/g,
    '<a href="#search?q=%23$1" class="hashtag">#$1</a>'
  );
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const createElement = (tag, className, html) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
};

export const openLightbox = (src) => {
  const overlay = createElement('div', 'lightbox');
  overlay.innerHTML = `<img src="${src}" alt="Full size">`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
};

export const confirmDialog = (message) => {
  return new Promise((resolve) => {
    const overlay = createElement('div', 'modal-overlay');
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm</h3>
          <button class="btn btn-ghost" data-action="close">&times;</button>
        </div>
        <div class="modal-body"><p>${escapeHtml(message)}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-danger" data-action="confirm">Confirm</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'confirm') {
        overlay.remove();
        resolve(true);
      } else if (action === 'cancel' || action === 'close' || e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });

    document.body.appendChild(overlay);
  });
};
