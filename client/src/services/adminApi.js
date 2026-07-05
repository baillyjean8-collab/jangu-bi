// ═══════════════════════════════════════════════════════
// JANGU BI — Service API Admin
// Gère tous les appels vers le backend pour le panel admin
// ═══════════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token management ─────────────────────────────────────────
function getToken() {
  return localStorage.getItem('jb_admin_token');
}

function setToken(token) {
  localStorage.setItem('jb_admin_token', token);
}

function clearToken() {
  localStorage.removeItem('jb_admin_token');
  localStorage.removeItem('jb_admin_parish');
}

function getParish() {
  try { return JSON.parse(localStorage.getItem('jb_admin_parish') || 'null'); }
  catch { return null; }
}

// ── Fetch avec auth ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/parish-admin/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const adminAuth = {
  async login(identifiant, motDePasse) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifiant, password: motDePasse }),
    });
    if (data.data?.accessToken) {
      setToken(data.data.accessToken);
      if (data.data?.user?.parish) {
        localStorage.setItem('jb_admin_parish', JSON.stringify(data.data.user.parish));
      }
    }
    return data;
  },

  logout() {
    clearToken();
  },

  isLoggedIn() {
    return !!getToken();
  },

  getParish,
};

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export const adminDashboard = {
  async getStats() {
    const parish = getParish();
    const parishId = parish?._id || '';
    return apiFetch(`/parish-admin/dashboard?parishId=${parishId}`);
  },

  async getActivite() {
    return apiFetch('/parish-admin/activite');
  },
};

// ══════════════════════════════════════════════════════════════
// PUBLICATIONS
// ══════════════════════════════════════════════════════════════
export const adminPosts = {
  async getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/posts?${q}`);
  },

  async create(postData) {
    return apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  async update(id, postData) {
    return apiFetch(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(postData),
    });
  },

  async delete(id) {
    return apiFetch(`/posts/${id}`, { method: 'DELETE' });
  },

  async like(id) {
    return apiFetch(`/posts/${id}/like`, { method: 'POST' });
  },
};

// ══════════════════════════════════════════════════════════════
// DEMANDES
// ══════════════════════════════════════════════════════════════
export const adminDemandes = {
  async getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/parish-admin/demandes?${q}`);
  },

  async valider(id) {
    return apiFetch(`/parish-admin/demandes/${id}/valider`, { method: 'PATCH' });
  },

  async rejeter(id, motif = '') {
    return apiFetch(`/parish-admin/demandes/${id}/rejeter`, {
      method: 'PATCH',
      body: JSON.stringify({ motif }),
    });
  },

  async contacter(userId, message) {
    return apiFetch('/parish-admin/messages', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  },
};

// ══════════════════════════════════════════════════════════════
// DONS
// ══════════════════════════════════════════════════════════════
export const adminDons = {
  async getStats() {
    return apiFetch('/admin/donations?limit=100');
  },

  async getCampagnes() {
    const parish = getParish();
    return apiFetch(`/parish-admin/campagnes?parishId=${parish?._id || ''}`);
  },

  async creerCampagne(data) {
    return apiFetch('/parish-admin/campagnes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getHistorique(parishId) {
    return apiFetch(`/admin/donations?parishId=${parishId}&limit=50`);
  },
};

// ══════════════════════════════════════════════════════════════
// FIDÈLES
// ══════════════════════════════════════════════════════════════
export const adminFideles = {
  async getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/users?${q}`);
  },

  async suspendre(userId, duree) {
    return apiFetch(`/parish-admin/fideles/${userId}/suspendre`, {
      method: 'PATCH',
      body: JSON.stringify({ duree }),
    });
  },

  async signaler(userId, motif) {
    return apiFetch(`/parish-admin/fideles/${userId}/signaler`, {
      method: 'POST',
      body: JSON.stringify({ motif }),
    });
  },

  async message(userId, texte) {
    return apiFetch('/parish-admin/messages', {
      method: 'POST',
      body: JSON.stringify({ userId, texte }),
    });
  },
};

// ══════════════════════════════════════════════════════════════
// PAROISSE
// ══════════════════════════════════════════════════════════════
export const adminParoisse = {
  async get() {
    const parish = getParish();
    return apiFetch(`/parishes/${parish?._id}`);
  },

  async update(data) {
    const parish = getParish();
    return apiFetch(`/parishes/${parish?._id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ══════════════════════════════════════════════════════════════
// LIVE
// ══════════════════════════════════════════════════════════════
export const adminLive = {
  async lancer(titre, options = {}) {
    const parish = getParish();
    return apiFetch('/live', {
      method: 'POST',
      body: JSON.stringify({ parishId: parish?._id, title: titre, ...options }),
    });
  },

  async terminer(liveId) {
    return apiFetch(`/live/${liveId}/end`, { method: 'PATCH' });
  },

  async accepterDemande(liveId, userId) {
    return apiFetch(`/live/${liveId}/accept/${userId}`, { method: 'PATCH' });
  },
};
