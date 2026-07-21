// ═══════════════════════════════════════════════════
// JANGU BI — Service API Fidèle
// URLs dynamiques selon l'environnement
// ═══════════════════════════════════════════════════
import { tokenStore } from '../api/client';

// En dev: utilise le proxy Vite (/api → localhost:5000/api)
// En prod: utilise VITE_API_URL
const BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch(endpoint, options) {
  const token = tokenStore.get();
  const opts = options || {};
  const res = await fetch(BASE + endpoint, {
    ...opts,
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: 'Bearer ' + token } : {},
      opts.headers || {}
    ),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

export const authApi = {
  register: function(data) {
    return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
  login: function(data) {
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  },
  verifyOtp: function(data) {
    return apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) });
  },
  resendOtp: function(data) {
    return apiFetch('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) });
  },
  refresh: function() {
    return apiFetch('/auth/refresh', { method: 'POST' });
  },
  logout: function() {
    return apiFetch('/auth/logout', { method: 'POST' });
  },
  logoutAll: function() {
    return apiFetch('/auth/logout-all', { method: 'POST' });
  },
  forgotPassword: function(data) {
    return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) });
  },
  resetPassword: function(data) {
    return apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
  },
  me: function() {
    return apiFetch('/auth/me');
  },
};

export const postsApi = {
  getAll: function(params) {
    const q = new URLSearchParams(params || {}).toString();
    return apiFetch('/posts' + (q ? '?' + q : ''));
  },
  getMine: function(params) {
    const q = new URLSearchParams(params || {}).toString();
    return apiFetch('/posts/mine' + (q ? '?' + q : ''));
  },
  create: function(data) {
    return apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) });
  },
  update: function(id, data) {
    return apiFetch('/posts/' + id, { method: 'PATCH', body: JSON.stringify(data) });
  },
  remove: function(id) {
    return apiFetch('/posts/' + id, { method: 'DELETE' });
  },
  like: function(id) { return apiFetch('/posts/' + id + '/like', { method: 'POST' }); },
share: function(id) { return apiFetch('/posts/' + id + '/share', { method: 'POST' }); },
    comment: function(id, text, parentId) {
      // Route reelle cote backend : /posts/:id/comment (singulier), pas /comments
      return apiFetch('/posts/' + id + '/comment', {
        method: 'POST', body: JSON.stringify({ text: text, parentId: parentId || null })
      });
    },
    getOne: function(id) {
      return apiFetch('/posts/' + id);
    },
    reportComment: function(postId, commentId) {
      return apiFetch('/posts/' + postId + '/comment/' + commentId + '/report', { method: 'POST' });
    },
    getReported: function() {
      return apiFetch('/posts/moderation/signales');
    },
    resolveReported: function(postId, commentId, action) {
      return apiFetch('/posts/' + postId + '/comment/' + commentId + '/resolve', {
        method: 'POST', body: JSON.stringify({ action: action })
      });
    },
  };

export const parishesApi = {
  getAll: function(params) {
    const q = new URLSearchParams(params || {}).toString();
    return apiFetch('/parishes' + (q ? '?' + q : ''));
  },
  getOne: function(id) { return apiFetch('/parishes/' + id); },
  update: function(id, data) {
    return apiFetch('/parishes/' + id, { method: 'PATCH', body: JSON.stringify(data) });
  },
  confirm: function(id) {
    return apiFetch('/parishes/' + id + '/confirm', { method: 'POST' });
  },
};

export const donationsApi = {
  getCampagnes: function(parishId) {
    return apiFetch('/donations/campaigns' + (parishId ? '?parishId=' + parishId : ''));
  },
  initier: function(data) {
    return apiFetch('/donations', { method: 'POST', body: JSON.stringify(data) });
  },
};

export const userApi = {
  getMe: function() { return apiFetch('/users/me'); },
  updateMe: function(data) {
    return apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
  },
};

export const notificationsApi = {
  getAll: function() { return apiFetch('/notifications'); },
};

export const storiesApi = {
  getAll: function(params) {
    const q = new URLSearchParams(params || {}).toString();
    return apiFetch('/stories' + (q ? '?' + q : ''));
  },
  create: function(data) {
    return apiFetch('/stories', { method: 'POST', body: JSON.stringify(data) });
  },
  view: function(id) {
    return apiFetch('/stories/' + id + '/view', { method: 'POST' });
  },
  remove: function(id) {
    return apiFetch('/stories/' + id, { method: 'DELETE' });
  },
};

export const liveApi = {
  getActifs: function() { return apiFetch('/live/active'); },
  getOne: function(id) { return apiFetch('/live/' + id); },
  getToken: function(id) { return apiFetch('/live/' + id + '/token', { method: 'POST' }); },
  getActiveForParish: function(parishId) { return apiFetch('/live/parish/' + parishId + '/active'); },
  pause: function(id) { return apiFetch('/live/' + id + '/pause', { method: 'POST' }); },
  resume: function(id) { return apiFetch('/live/' + id + '/resume', { method: 'POST' }); },
  getUpcoming: function() { return apiFetch('/live/upcoming'); },
};

export const invitationApi = {
  create: function() { return apiFetch('/invitations', { method: 'POST', body: JSON.stringify({}) }); },
  check: function(token) { return apiFetch('/invitations/' + token); },
  complete: function(token, data) { return apiFetch('/invitations/' + token + '/complete', { method: 'POST', body: JSON.stringify(data) }); },
};

export const groupApi = {
  getOne: function(id) { return apiFetch('/groups/' + id); },
  getPosts: function(id) { return apiFetch('/groups/' + id + '/posts'); },
  createPost: function(id, data) { return apiFetch('/groups/' + id + '/posts', { method: 'POST', body: JSON.stringify(data) }); },
  updatePost: function(id, postId, data) { return apiFetch('/groups/' + id + '/posts/' + postId, { method: 'PATCH', body: JSON.stringify(data) }); },
  getMessages: function(id) { return apiFetch('/groups/' + id + '/messages'); },
  sendMessage: function(id, data) { return apiFetch('/groups/' + id + '/messages', { method: 'POST', body: JSON.stringify(data) }); },
};

export const messagesApi = {
  getAll: function() { return apiFetch('/messages'); },
  getOne: function(id) { return apiFetch('/messages/' + id); },
  unreadCount: function() { return apiFetch('/messages/unread-count'); },
  start: function(parishId) {
    return apiFetch('/messages/start', { method: 'POST', body: JSON.stringify({ parishId }) });
  },
  send: function(id, text) {
    return apiFetch('/messages/' + id, { method: 'POST', body: JSON.stringify({ text }) });
  },
};

export const announcementsApi = {
  getAll: function(parishId) {
    return apiFetch('/announcements' + (parishId ? '?parishId=' + parishId : ''));
  },
  create: function(data) {
    return apiFetch('/announcements', { method: 'POST', body: JSON.stringify(data) });
  },
  remove: function(id) {
    return apiFetch('/announcements/' + id, { method: 'DELETE' });
  },
};

export const parishEventsApi = {
  getForParish: function(parishId) { return apiFetch('/parish-events/parish/' + parishId); },
  create: function(data) {
    return apiFetch('/parish-events', { method: 'POST', body: JSON.stringify(data) });
  },
  remove: function(id) {
    return apiFetch('/parish-events/' + id, { method: 'DELETE' });
  },
};
