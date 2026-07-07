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
  comment: function(id, text) {
    return apiFetch('/posts/' + id + '/comments', {
      method: 'POST', body: JSON.stringify({ text })
    });
  },
};

export const parishesApi = {
  getAll: function(params) {
    const q = new URLSearchParams(params || {}).toString();
    return apiFetch('/parishes' + (q ? '?' + q : ''));
  },
  getOne: function(id) { return apiFetch('/parishes/' + id); },
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
  getAll: function() { return apiFetch('/stories'); },
};

export const liveApi = {
  getActifs: function() { return apiFetch('/live?status=active&limit=10'); },
};
