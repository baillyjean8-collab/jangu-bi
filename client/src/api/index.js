import api from './client';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:        (data)                => api.post('/auth/register', data),
  login:           (data)                => api.post('/auth/login', data),
  verifyOtp:       (data)                => api.post('/auth/verify-otp', data),
  resendOtp:       (data)                => api.post('/auth/resend-otp', data),
  refresh:         ()                    => api.post('/auth/refresh'),
  logout:          ()                    => api.post('/auth/logout'),
  logoutAll:       ()                    => api.post('/auth/logout-all'),
  forgotPassword:  (data)                => api.post('/auth/forgot-password', data),
  resetPassword:   (data)                => api.post('/auth/reset-password', data),
  me:              ()                    => api.get('/auth/me'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile:      ()                    => api.get('/users/me'),
  updateProfile:   (data)                => api.patch('/users/me', data),
  changePassword:  (data)                => api.post('/users/me/password', data),
  joinParish:      (parishId)            => api.post('/users/me/join-parish', { parishId }),
  getDonations:    ()                    => api.get('/users/me/donations'),
  uploadAvatar:    (file)                => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Parishes ──────────────────────────────────────────────────────────────────
export const parishesApi = {
  list:            (params)              => api.get('/parishes', { params }),
  getById:         (id)                  => api.get(`/parishes/${id}`),
  create:          (data)                => api.post('/parishes', data),
  update:          (id, data)            => api.patch(`/parishes/${id}`, data),
};

// ── Live ──────────────────────────────────────────────────────────────────────
export const liveApi = {
  getAllActive:     ()                    => api.get('/live/active'),
  getActive:       (parishId)            => api.get(`/live/parish/${parishId}/active`),
  getHistory:      (params)              => api.get('/live/history', { params }),
  startSession:    (data)                => api.post('/live/start', data),
  endSession:      (liveId)              => api.post(`/live/${liveId}/end`),
};

// ── Donations ─────────────────────────────────────────────────────────────────
export const donationsApi = {
  initiate:        (data)                => api.post('/donations', data),
  getById:         (id)                  => api.get(`/donations/${id}`),
  listMine:        (params)              => api.get('/donations/mine', { params }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard:       ()                    => api.get('/admin/dashboard'),
  users:           (params)              => api.get('/admin/users', { params }),
  updateUserRole:  (id, role)            => api.patch(`/admin/users/${id}/role`, { role }),
  deactivateUser:  (id)                  => api.patch(`/admin/users/${id}/deactivate`),
  parishes:        (params)              => api.get('/admin/parishes', { params }),
  verifyParish:    (id)                  => api.patch(`/admin/parishes/${id}/verify`),
  donations:       (params)              => api.get('/admin/donations', { params }),
  auditLogs:       (params)              => api.get('/admin/audit-logs', { params }),
};
// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  list:            (params)              => api.get('/posts', { params }),
  create:          (data)                => api.post('/posts', data),
  like:            (id)                  => api.post(`/posts/${id}/like`),
  comment:         (id, text)            => api.post(`/posts/${id}/comment`, { text }),
  delete:          (id)                  => api.delete(`/posts/${id}`),
};

// ── Stories ───────────────────────────────────────────────────────────────────
export const storiesApi = {
  list:            (params)              => api.get('/stories', { params }),
  create:          (data)                => api.post('/stories', data),
  like:            (id)                  => api.post(`/stories/${id}/like`),
  view:            (id)                  => api.post(`/stories/${id}/view`),
  delete:          (id)                  => api.delete(`/stories/${id}`),
};
// ── Follow / Notifications ────────────────────────────────────────────────────
export const followApi = {
  follow:   (parishId) => api.post(`/users/me/follow/${parishId}`),
  unfollow: (parishId) => api.post(`/users/me/unfollow/${parishId}`),
  notify:   (parishId) => api.post(`/users/me/notify/${parishId}`),
};