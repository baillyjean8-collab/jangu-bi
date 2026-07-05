/**
 * useSocket.js — Production-grade Socket.io hook
 *
 * Handles the full connection lifecycle:
 * 1. Connects with current access token (from memory)
 * 2. On token expiry (401 equivalent via 'error' event), refreshes token and reconnects
 * 3. Exponential backoff for reconnection attempts
 * 4. Cleans up all listeners and state on unmount
 * 5. Exposes connection state for UI feedback
 *
 * Usage:
 *   const { socket, status, joinRoom, leaveRoom } = useSocket();
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { tokenStore } from '../api/client';
import { authApi } from '../api';

// Connection states for UI
export const SOCKET_STATUS = Object.freeze({
  CONNECTING:    'connecting',
  CONNECTED:     'connected',
  DISCONNECTED:  'disconnected',
  RECONNECTING:  'reconnecting',
  FAILED:        'failed',        // gave up after max retries
});

// Backoff config
const BACKOFF = {
  INITIAL_MS: 1_000,
  MAX_MS:     30_000,
  MULTIPLIER: 2,
  JITTER:     0.2,   // ±20% random jitter to prevent thundering herd
  MAX_RETRIES: 8,
};

function calcBackoff(attempt) {
  const base   = Math.min(BACKOFF.INITIAL_MS * Math.pow(BACKOFF.MULTIPLIER, attempt), BACKOFF.MAX_MS);
  const jitter = base * BACKOFF.JITTER * (Math.random() * 2 - 1);
  return Math.round(base + jitter);
}

// ─── Singleton socket reference ────────────────────────────────────────────────
// We use a module-level singleton so multiple components share one connection.
// The hook manages lifecycle: first mount creates it, last unmount destroys it.

let _socketInstance = null;
let _mountCount = 0;

function getOrCreateSocket() {
  if (_socketInstance) return _socketInstance;

  _socketInstance = io({
    autoConnect:    false,
    withCredentials:true,
    transports:    ['websocket', 'polling'],
    // Disable socket.io's built-in reconnect — we handle it manually
    // for better control (token refresh, backoff, UI state)
    reconnection:  false,
  });

  return _socketInstance;
}

function destroySocket() {
  if (_socketInstance) {
    _socketInstance.removeAllListeners();
    _socketInstance.disconnect();
    _socketInstance = null;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useSocket() {
  const [status, setStatus]   = useState(SOCKET_STATUS.DISCONNECTED);
  const socketRef             = useRef(null);
  const retryCountRef         = useRef(0);
  const retryTimerRef         = useRef(null);
  const mountedRef            = useRef(true);

  // ── Connect with current token ───────────────────────────────────────────
  const connect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (socket.connected) return;

    // Always inject the latest token before connecting
    socket.auth = { token: tokenStore.get() };
    setStatus(SOCKET_STATUS.CONNECTING);
    socket.connect();
  }, []);

  // ── Schedule reconnection with backoff ────────────────────────────────────
  const scheduleReconnect = useCallback(async (isTokenError = false) => {
    if (!mountedRef.current) return;
    if (retryCountRef.current >= BACKOFF.MAX_RETRIES) {
      setStatus(SOCKET_STATUS.FAILED);
      return;
    }

    setStatus(SOCKET_STATUS.RECONNECTING);

    // If token error, refresh before reconnecting
    if (isTokenError) {
      try {
        const { data } = await authApi.refresh();
        tokenStore.set(data.data.accessToken);
      } catch {
        // Refresh failed — user session expired, redirect to login
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return;
      }
    }

    const delay = calcBackoff(retryCountRef.current);
    retryCountRef.current += 1;

    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  // ── Setup socket + listeners ─────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    _mountCount += 1;

    const socket = getOrCreateSocket();
    socketRef.current = socket;

    // ── Event handlers ────────────────────────────────────────────────────

    function onConnect() {
      if (!mountedRef.current) return;
      retryCountRef.current = 0;
      setStatus(SOCKET_STATUS.CONNECTED);
    }

    function onDisconnect(reason) {
      if (!mountedRef.current) return;
      setStatus(SOCKET_STATUS.DISCONNECTED);

      // Don't reconnect if we initiated the disconnect
      if (reason === 'io client disconnect') return;

      // Transport errors — reconnect immediately (first attempt)
      if (reason === 'transport error' || reason === 'transport close') {
        scheduleReconnect(false);
        return;
      }

      // Server-initiated disconnect — reconnect with backoff
      scheduleReconnect(false);
    }

    function onConnectError(err) {
      if (!mountedRef.current) return;
      setStatus(SOCKET_STATUS.DISCONNECTED);

      // Server full — wait longer before retry
      if (err?.data?.code === 'SERVER_FULL') {
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, (err.data.retryAfterSeconds || 30) * 1000);
        return;
      }

      scheduleReconnect(false);
    }

    function onError(err) {
      // Token expired mid-session
      if (err?.code === 'TOKEN_EXPIRED' || err?.code === 'INVALID_TOKEN') {
        scheduleReconnect(true); // triggers token refresh
      }
    }

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error',         onError);

    // Connect on mount
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);

      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error',         onError);

      _mountCount -= 1;
      if (_mountCount <= 0) {
        destroySocket();
        _mountCount = 0;
      }
    };
  }, [connect, scheduleReconnect]);

  // ── Room management ──────────────────────────────────────────────────────

  const joinRoom = useCallback((parishId, liveId) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('room:join', { parishId, liveId });
  }, []);

  const leaveRoom = useCallback((parishId) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('room:leave', { parishId });
  }, []);

  const sendReaction = useCallback((parishId, liveId, type) => {
    const socket = socketRef.current;
    if (!socket?.connected) return false;
    socket.emit('reaction:send', { parishId, liveId, type });
    return true;
  }, []);

  // ── Subscribe to events ──────────────────────────────────────────────────

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    status,
    isConnected: status === SOCKET_STATUS.CONNECTED,
    isReconnecting: status === SOCKET_STATUS.RECONNECTING,
    joinRoom,
    leaveRoom,
    sendReaction,
    on,
  };
}
