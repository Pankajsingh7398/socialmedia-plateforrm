import { api } from './api.js';

let currentUser = null;

export const getUser = () => currentUser;

export const setUser = (user) => {
  currentUser = user;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const loadStoredUser = () => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch {
      currentUser = null;
    }
  }
  return currentUser;
};

export const isAuthenticated = () => !!api.getToken();

export const login = async (email, password) => {
  const data = await api.post('/auth/login', { email, password });
  api.setToken(data.token);
  setUser(data.user);
  return data;
};

export const register = async (formData) => {
  const data = await api.post('/auth/register', formData);
  api.setToken(data.token);
  setUser(data.user);
  return data;
};

export const logout = () => {
  api.setToken(null);
  setUser(null);
};

export const fetchCurrentUser = async () => {
  try {
    const data = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  } catch {
    logout();
    return null;
  }
};

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const resendVerification = () => api.post('/auth/resend-verification');
