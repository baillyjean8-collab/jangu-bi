/**
 * api/client.js — Axios instance with security-first token management.
 *
 * Security decisions:
 * - Access token NEVER stored in localStorage/sessionStorage (XSS risk)
 * - Access token lives in module memory (this file) — cleared on page reload
 * - Refresh token lives in httpOnly cookie — inaccessible to JS
 * - On 401: auto-refresh once, then redirect to login on second failure
 * - Request queue: concurrent 401s are debounced to a single refresh call
 */

import axios from 'axios';

// ── In-memory token store ─────────────────────────────────────────────────────
// Deliberately module-scoped — not window, not localStorage.
let _accessToken = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,  // Send httpOnly refresh token cookie on every request
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false;
let refreshQueue = []; // Queued requests waiting for token refresh

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh loop for the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request — wait for ongoing refresh to complete
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token is in httpOnly cookie — sent automatically
      const { data } = await api.post('/auth/refresh');
      const newToken = data.data.accessToken;
      tokenStore.set(newToken);
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
