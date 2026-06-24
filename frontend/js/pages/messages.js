import { api, getMediaUrl } from '../api.js';
import { getUser } from '../auth.js';
import { escapeHtml, formatDate, showToast } from '../utils.js';
import { initSocket } from '../socket.js';

let activeConversationId = null;

export const renderMessagesPage = () => `
  <div class="messages-layout glass-card">
    <div class="chat-list" id="chat-list">
      <div style="padding:1rem;border-bottom:1px solid var(--border)">
        <input type="search" id="chat-search" class="form-input" placeholder="Search conversations..." style="border-radius:999px">
      </div>
      <div id="conversations-list"><div class="skeleton skeleton-text" style="margin:1rem"></div></div>
    </div>
    <div class="chat-window" id="chat-window">
      <div class="empty-state" style="height:100%;display:flex;align-items:center;justify-content:center">
        <p>Select a conversation to start messaging</p>
      </div>
    </div>
  </div>
`;

export const loadConversations = async () => {
  const list = document.getElementById('conversations-list');
  try {
    const data = await api.get('/messages/conversations');
    list.innerHTML = data.conversations?.length
      ? data.conversations.map((c) => `
        <div class="chat-item ${activeConversationId === c._id ? 'active' : ''}" data-conv-id="${c._id}" data-username="${c.otherUser?.username}">
          <div class="avatar-wrap">
            <img class="avatar avatar-sm" src="${getMediaUrl(c.otherUser?.profileImage) || ''}" alt="">
            ${c.otherUser?.isOnline ? '<span class="online-dot"></span>' : ''}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:0.9375rem">${escapeHtml(c.otherUser?.name || '')}</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.lastMessage || '')}</div>
          </div>
          ${c.unreadCount ? `<span class="badge-count" style="position:static">${c.unreadCount}</span>` : ''}
        </div>
      `).join('')
      : '<div class="empty-state" style="padding:2rem"><p>No messages yet</p></div>';

    list.querySelectorAll('.chat-item').forEach((el) => {
      el.addEventListener('click', () => openChat(el.dataset.convId, el.dataset.username));
    });
  } catch {
    list.innerHTML = '<p class="text-muted" style="padding:1rem">Failed to load</p>';
  }
};

const openChat = async (convId, username) => {
  activeConversationId = convId;
  const chatWindow = document.getElementById('chat-window');
  chatWindow.innerHTML = '<div class="skeleton" style="margin:1rem;height:200px"></div>';

  // On mobile, show chat window by adding class to layout
  const layout = document.querySelector('.messages-layout');
  layout?.classList.add('chat-open');

  try {
    const data = await api.get(`/messages/${convId}/messages`);
    const user = getUser();

    chatWindow.innerHTML = `
      <div style="padding:0.875rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:0.75rem;font-weight:700">
        <button id="chat-back-btn" class="btn btn-ghost btn-sm" style="display:none;padding:0.25rem" aria-label="Back">←</button>
        <a href="#profile/${username}" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${escapeHtml(username)}</a>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${data.messages?.map((m) => {
          const isSent = m.senderId._id === user._id;
          const read = m.readBy?.length > 1;
          return `<div class="chat-bubble ${isSent ? 'sent' : 'received'}">
            ${m.media?.url ? `<img src="${getMediaUrl(m.media.url)}" style="max-width:200px;border-radius:8px;margin-bottom:0.5rem">` : ''}
            ${escapeHtml(m.text)}
            <div style="font-size:0.65rem;opacity:0.7;margin-top:0.25rem;text-align:right">${formatDate(m.createdAt)}${isSent && read ? ' · Seen' : ''}</div>
          </div>`;
        }).join('') || '<p class="text-muted text-center">No messages yet. Say hi!</p>'}
      </div>
      <form class="chat-input-bar" id="chat-form">
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📷<input type="file" id="chat-media" accept="image/*" hidden></label>
        <input type="text" id="chat-input" class="form-input" placeholder="Type a message..." style="border-radius:999px;flex:1" autocomplete="off">
        <button type="submit" class="btn btn-gradient btn-sm">Send</button>
      </form>
    `;

    const messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Show back button on mobile
    const backBtn = document.getElementById('chat-back-btn');
    if (backBtn) {
      if (window.innerWidth <= 768) backBtn.style.display = 'inline-flex';
      backBtn.addEventListener('click', () => {
        layout?.classList.remove('chat-open');
      });
      window.addEventListener('resize', () => {
        backBtn.style.display = window.innerWidth <= 768 ? 'inline-flex' : 'none';
      }, { once: true });
    }

    const socket = initSocket();
    socket?.emit('join_conversation', { conversationId: convId });

    let typingTimer;
    document.getElementById('chat-input')?.addEventListener('input', () => {
      clearTimeout(typingTimer);
      socket?.emit('typing', { conversationId: convId });
    });

    document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      try {
        await api.post(`/messages/${convId}/messages`, { text });
        messagesEl.insertAdjacentHTML('beforeend', `<div class="chat-bubble sent">${escapeHtml(text)}</div>`);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('chat-media')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('media', file);
      formData.append('text', '📷 Photo');
      try {
        await api.upload(`/messages/${convId}/messages`, formData);
        loadConversations();
        openChat(convId, username);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    loadConversations();
  } catch (err) {
    chatWindow.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
};

export const bindMessageEvents = () => {
  document.getElementById('chat-search')?.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) { loadConversations(); return; }
    const data = await api.get(`/messages/conversations/search?q=${encodeURIComponent(q)}`);
    const list = document.getElementById('conversations-list');
    list.innerHTML = data.users?.map((u) => `
      <div class="chat-item" data-start-chat="${u.username}">
        <img class="avatar avatar-sm" src="${getMediaUrl(u.profileImage) || ''}" alt="">
        <div><div style="font-weight:700">${escapeHtml(u.name)}</div><div style="font-size:0.8125rem;color:var(--text-muted)">@${escapeHtml(u.username)}</div></div>
      </div>
    `).join('') || '<p class="text-muted" style="padding:1rem">No users found</p>';

    list.querySelectorAll('[data-start-chat]').forEach((el) => {
      el.addEventListener('click', async () => {
        const res = await api.get(`/messages/with/${el.dataset.startChat}`);
        openChat(res.conversation._id, el.dataset.startChat);
      });
    });
  });
};

export { openChat };
