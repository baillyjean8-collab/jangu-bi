import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi } from '../services/api';
import { tokenStore } from '../api/client';

// ── State ─────────────────────────────────────────────────────────────────────
const initialState = {
  user:          null,
  isLoading:     true,   // true while checking existing session on mount
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Session restore on mount ───────────────────────────────────────────────
  // If the httpOnly refresh token cookie exists, silently get a new access token.
  // This restores the session after a page reload without requiring login.
  useEffect(() => {
    async function restoreSession() {

try {

const data = await authApi.refresh();

tokenStore.set(data.data.accessToken);

// Fetch full user profile

const profileRes = await authApi.me();

dispatch({ type: 'SET_USER', payload: profileRes.data.user });

} catch {
        // No valid refresh token → user is logged out (expected on first visit)
        dispatch({ type: 'CLEAR_USER' });
      }
    }
    restoreSession();
  }, []);

  // ── Listen for forced logout from Axios interceptor ───────────────────────
  useEffect(() => {
    function handleForcedLogout() {
      dispatch({ type: 'CLEAR_USER' });
    }
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
const login = useCallback(async (credentials) => {

const data = await authApi.login(credentials);

tokenStore.set(data.data.accessToken);

dispatch({ type: 'SET_USER', payload: data.data.user });
    // Remplit aussi le stockage historique (jb_admin_token) utilise par les
    // anciennes pages de gestion admin (Fideles, Dons, Demandes, Moderation,
    // Branches, Live, Ma Paroisse), quelle que soit la page de connexion
    // utilisee -- evite qu'elles restent bloquees sur "Chargement..." faute
    // de token trouve.
    const role = data.data.user && data.data.user.role;
    if (role === 'parish_admin' || role === 'super_admin') {
      localStorage.setItem('jb_admin_token', data.data.accessToken);
      localStorage.setItem('jb_admin_user', JSON.stringify(data.data.user));
    }
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'SET_USER', payload: { ...state.user, ...updates } });
  }, [state.user]);

  const setUserFromVerify = useCallback((user, accessToken) => {
    tokenStore.set(accessToken);
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{
      user:            state.user,
      isLoading:       state.isLoading,
      isAuthenticated: state.isAuthenticated,
      login,
      logout,
      updateUser,
      setUserFromVerify,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
