import { useState, useEffect } from 'react';
import { adminDashboard, adminAuth } from '../services/adminApi';

export function useAdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [activite, setActivite] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsRes, activiteRes] = await Promise.all([
          adminDashboard.getStats().catch(() => null),
          adminDashboard.getActivite().catch(() => null),
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (activiteRes?.data) setActivite(activiteRes.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (adminAuth.isLoggedIn()) load();
    else setLoading(false);
  }, []);

  return { stats, activite, loading, error };
}

export function useAdminAuth() {
  const [loggedIn, setLoggedIn] = useState(adminAuth.isLoggedIn());
  const [parish, setParish]     = useState(adminAuth.getParish());

  function login(token, parishData) {
    setLoggedIn(true);
    setParish(parishData);
  }

  function logout() {
    adminAuth.logout();
    setLoggedIn(false);
    setParish(null);
  }

  return { loggedIn, parish, login, logout };
}
