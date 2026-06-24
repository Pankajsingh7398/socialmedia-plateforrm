import { api } from './api.js';

let socket = null;

export const initSocket = () => {
  if (socket) return socket;

  const token = api.getToken();
  if (!token || typeof io === 'undefined') return null;

  const base = api.baseUrl.replace('/api', '');
  socket = io(base, { auth: { token } });

  socket.on('new_message', ({ message, conversationId }) => {
    window.dispatchEvent(new CustomEvent('pulse:message', { detail: { message, conversationId } }));
  });

  socket.on('typing', ({ conversationId }) => {
    window.dispatchEvent(new CustomEvent('pulse:typing', { detail: { conversationId } }));
  });

  return socket;
};

export const getSocket = () => socket;
