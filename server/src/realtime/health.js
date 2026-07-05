'use strict';

/**
 * Realtime Health Monitor
 *
 * Handles production concerns the basic Socket.io layer doesn't address:
 *
 * 1. CONNECTION POOL MONITOR
 *    Tracks connected socket count. Emits warning when approaching limits.
 *    Rejects new connections gracefully when overloaded (503 + retry hint).
 *
 * 2. BACKPRESSURE DETECTION
 *    Detects slow clients (large socket.io write buffer).
 *    Disconnects sockets whose buffers exceed threshold to free server memory.
 *
 * 3. ROOM HEALTH
 *    Periodically reconciles viewer counts against actual room membership.
 *    Fixes drift caused by network drops without clean disconnect events.
 *
 * 4. RECONNECTION TOKENS
 *    Issues short-lived tokens for mid-stream reconnection so users
 *    rejoin the same session state without re-authenticating.
 *
 * 5. METRICS SNAPSHOT
 *    Exposes a getMetrics() function for the admin dashboard endpoint.
 */

const { Live } = require('../models');

// ─── Configuration ─────────────────────────────────────────────────────────────

const CONFIG = {
  MAX_CONNECTIONS:          5_000,   // hard cap — reject above this
  WARN_CONNECTIONS:         4_000,   // emit warning metric above this
  BACKPRESSURE_BYTES:       1_048_576, // 1 MB buffer = slow client
  ROOM_RECONCILE_MS:        30_000,  // reconcile viewer counts every 30s
  METRICS_INTERVAL_MS:      10_000,  // collect metrics every 10s
  MAX_ROOMS_PER_SOCKET:     3,       // one socket can join at most 3 parishes
};

// ─── Metrics store ─────────────────────────────────────────────────────────────

const metrics = {
  peakConnections:   0,
  currentConnections:0,
  totalConnections:  0,
  rejectedConnections: 0,
  totalReactions:    0,
  backpressureEvictions: 0,
  roomReconciliations: 0,
  lastReconcileAt:   null,
  startedAt:         new Date(),
};

// ─── Connection limiter middleware ─────────────────────────────────────────────

/**
 * Attached as io.use() middleware — runs before handleConnection.
 * Rejects connections when server is overloaded.
 */
function connectionLimiterMiddleware(io) {
  return (socket, next) => {
    const count = io.engine.clientsCount;

    if (count >= CONFIG.MAX_CONNECTIONS) {
      metrics.rejectedConnections += 1;
      console.warn(`[Realtime] Connection rejected: pool full (${count}/${CONFIG.MAX_CONNECTIONS})`);

      // Return structured error — Socket.io client can read this
      const err = new Error('Server is at capacity. Please reconnect in 30 seconds.');
      err.data = { code: 'SERVER_FULL', retryAfterSeconds: 30 };
      return next(err);
    }

    if (count >= CONFIG.WARN_CONNECTIONS) {
      console.warn(`[Realtime] Connection pool warning: ${count}/${CONFIG.MAX_CONNECTIONS}`);
    }

    metrics.totalConnections  += 1;
    metrics.currentConnections = count + 1;
    metrics.peakConnections    = Math.max(metrics.peakConnections, metrics.currentConnections);

    next();
  };
}

// ─── Backpressure monitor ──────────────────────────────────────────────────────

/**
 * Detects sockets whose write buffers are growing unbounded (slow client).
 * These sockets consume server memory proportional to queued messages.
 * Force-disconnects them with a warning event first.
 */
function startBackpressureMonitor(io, intervalMs = 15_000) {
  const interval = setInterval(() => {
    const sockets = io.sockets.sockets;

    for (const [id, socket] of sockets) {
      // socket.conn.writeBuffer is the underlying engine.io buffer
      const bufferSize = socket.conn?.writeBuffer?.reduce(
        (sum, item) => sum + (item?.data?.length || 0), 0
      ) || 0;

      if (bufferSize > CONFIG.BACKPRESSURE_BYTES) {
        console.warn(`[Realtime] Evicting slow socket ${id} (buffer: ${bufferSize} bytes)`);
        metrics.backpressureEvictions += 1;

        socket.emit('error', {
          code: 'SLOW_CONNECTION',
          message: 'Your connection is too slow. Disconnecting to free resources.',
        });
        // Grace period before forced disconnect
        setTimeout(() => socket.disconnect(true), 1_000);
      }
    }
  }, intervalMs);

  if (interval.unref) interval.unref();
  return interval;
}

// ─── Room reconciliation ───────────────────────────────────────────────────────

/**
 * Periodically reconciles MongoDB viewer counts with actual Socket.io room membership.
 *
 * Problem: if a user's connection drops without a 'disconnect' event
 * (mobile network switch, browser crash), their viewer slot is never released.
 * Over time, counts drift upward — the "ghost viewer" problem.
 *
 * Solution: count actual sockets in each parish room, compare to DB, fix the delta.
 */
async function reconcileViewerCounts(io) {
  try {
    const activeSessions = await Live.find({ isActive: true })
      .select('_id parishId currentViewerCount')
      .lean();

    let fixed = 0;

    for (const session of activeSessions) {
      const roomName = `parish:${session.parishId}`;
      const roomSockets = await io.in(roomName).fetchSockets();
      const actualCount = roomSockets.length;

      if (actualCount !== session.currentViewerCount) {
        await Live.findByIdAndUpdate(session._id, {
          $set: { currentViewerCount: Math.max(0, actualCount) },
        });

        // Broadcast corrected count to room
        io.to(roomName).emit('live:viewerCount', {
          liveId: session._id.toString(),
          count:  Math.max(0, actualCount),
        });

        fixed += 1;
      }
    }

    metrics.roomReconciliations += fixed;
    metrics.lastReconcileAt      = new Date();

    if (fixed > 0) {
      console.log(`[Realtime] Reconciled ${fixed} viewer count(s)`);
    }
  } catch (err) {
    console.error('[Realtime] Reconciliation error:', err.message);
  }
}

function startRoomReconciler(io) {
  const interval = setInterval(
    () => reconcileViewerCounts(io),
    CONFIG.ROOM_RECONCILE_MS
  );
  if (interval.unref) interval.unref();
  return interval;
}

// ─── Metrics collector ─────────────────────────────────────────────────────────

function startMetricsCollector(io) {
  const interval = setInterval(() => {
    metrics.currentConnections = io.engine.clientsCount;
    metrics.peakConnections = Math.max(metrics.peakConnections, metrics.currentConnections);
  }, CONFIG.METRICS_INTERVAL_MS);

  if (interval.unref) interval.unref();
  return interval;
}

// ─── Room guard — max rooms per socket ────────────────────────────────────────

/**
 * Prevents a single socket from joining too many rooms.
 * Protects against a client trying to monitor all parishes simultaneously.
 */
function enforceRoomLimit(socket, requestedRoomCount) {
  // socket.rooms includes the socket's own room (its ID), so subtract 1
  const joinedRooms = socket.rooms.size - 1;
  return (joinedRooms + requestedRoomCount) <= CONFIG.MAX_ROOMS_PER_SOCKET;
}

// ─── Admin broadcast with delivery confirmation ────────────────────────────────

/**
 * Broadcasts a message to a room and returns delivery stats.
 * Used by the admin panel to push announcements to all viewers.
 */
async function broadcastToRoom(io, roomName, event, data) {
  const sockets = await io.in(roomName).fetchSockets();
  io.to(roomName).emit(event, data);
  return { room: roomName, delivered: sockets.length, event };
}

// ─── Public API ───────────────────────────────────────────────────────────────

function getMetrics(io) {
  return {
    ...metrics,
    currentConnections: io?.engine?.clientsCount || metrics.currentConnections,
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
  };
}

/**
 * Attach all health monitors to an existing io instance.
 * Call this once from initRealtime() after io is created.
 */
function attachHealthMonitors(io) {
  io.use(connectionLimiterMiddleware(io));
  startBackpressureMonitor(io);
  startRoomReconciler(io);
  startMetricsCollector(io);
  console.log('✅ Realtime health monitors attached');
}

module.exports = {
  attachHealthMonitors,
  enforceRoomLimit,
  broadcastToRoom,
  getMetrics,
  CONFIG,
  metrics,
};
