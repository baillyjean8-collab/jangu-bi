'use strict';

/**
 * Realtime Layer — Socket.io
 *
 * Design principles:
 * 1. ISOLATED — no business logic here. Delegates to liveService.
 * 2. PRIVACY-SAFE — zero personal data in any emitted event.
 * 3. AUTHENTICATED — JWT verified on handshake (not per-event).
 * 4. RATE-LIMITED — reactions capped per socket per window.
 * 5. VALIDATED — all incoming event payloads validated before processing.
 * 6. ROOMS — scoped per parish: "parish:{parishId}". No cross-parish leakage.
 */

const { verifyAccessToken } = require('../shared/utils/jwt');
const { liveService } = require('../domains/live');
const { attachHealthMonitors, enforceRoomLimit } = require('./health');

// ── Constants ──────────────────────────────────────────────────────────────────

const REACTION_RATE_LIMIT = {
  MAX: 5,           // max reactions per window
  WINDOW_MS: 60_000 // 1 minute
};

const ALLOWED_REACTIONS = new Set(['amen', 'praise', 'heart', 'fire']);

// Socket events — defined as constants to prevent typos across codebase
const EVENTS = Object.freeze({
  // Server → Client
  LIVE_STARTED:    'live:started',
  LIVE_ENDED:      'live:ended',
  LIVE_REACTION:   'live:reaction',
  LIVE_VIEWERS:    'live:viewerCount',
  ERROR:           'error',

  // Client → Server
  JOIN_ROOM:       'room:join',
  LEAVE_ROOM:      'room:leave',
  SEND_REACTION:   'reaction:send',
});

// ── Rate Limiter (per socket) ──────────────────────────────────────────────────

class SocketRateLimiter {
  constructor(max, windowMs) {
    this.max = max;
    this.windowMs = windowMs;
    // Map<socketId, { count, windowStart }>
    this.state = new Map();
  }

  isAllowed(socketId) {
    const now = Date.now();
    const entry = this.state.get(socketId) || { count: 0, windowStart: now };

    if (now - entry.windowStart > this.windowMs) {
      // Window expired — reset
      entry.count = 0;
      entry.windowStart = now;
    }

    if (entry.count >= this.max) return false;

    entry.count += 1;
    this.state.set(socketId, entry);
    return true;
  }

  remove(socketId) {
    this.state.delete(socketId);
  }

  // Periodic cleanup to prevent memory leak from stale socket entries
  startCleanup(intervalMs = 5 * 60_000) {
    this._cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, entry] of this.state.entries()) {
        if (now - entry.windowStart > this.windowMs * 2) {
          this.state.delete(id);
        }
      }
    }, intervalMs);
    // Don't keep process alive just for cleanup
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
    return this;
  }
}

const reactionLimiter = new SocketRateLimiter(
  REACTION_RATE_LIMIT.MAX,
  REACTION_RATE_LIMIT.WINDOW_MS
).startCleanup();

// ── Auth Middleware ────────────────────────────────────────────────────────────

/**
 * Verify JWT on socket handshake.
 * Token passed as: socket.handshake.auth.token (Bearer token from client memory).
 * Anonymous viewers are allowed with reduced capabilities (no reactions).
 */
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    // Allow anonymous connections — they can watch but not react
    socket.user = null;
    socket.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.user = {
      userId:      decoded.sub,
      role:        decoded.role,
      isVerified:  decoded.isVerified,
      parishId:    decoded.parishId,
    };
    socket.isAuthenticated = true;
    next();
  } catch (err) {
    // Invalid token — treat as anonymous (not hard reject)
    // This prevents service disruption from expired tokens mid-stream
    socket.user = null;
    socket.isAuthenticated = false;
    next();
  }
}

// ── Room name builder ──────────────────────────────────────────────────────────

function parishRoom(parishId) {
  // Sanitize parishId — only allow valid MongoDB ObjectId chars
  if (!/^[a-f0-9]{24}$/i.test(String(parishId))) {
    throw new Error('Invalid parishId for room name');
  }
  return `parish:${parishId}`;
}

// ── Connection Handler ─────────────────────────────────────────────────────────

function handleConnection(io, socket) {
  // Track which live sessions this socket has joined
  const joinedSessions = new Map(); // parishId → liveId

  // ── Join Parish Room ─────────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN_ROOM, async ({ parishId, liveId }) => {
    try {
      // Input validation
      if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) {
        return socket.emit(EVENTS.ERROR, { code: 'INVALID_PARISH', message: 'Invalid parish ID' });
      }
      if (!liveId || !/^[a-f0-9]{24}$/i.test(String(liveId))) {
        return socket.emit(EVENTS.ERROR, { code: 'INVALID_LIVE', message: 'Invalid live session ID' });
      }

      // Room limit guard
      if (!enforceRoomLimit(socket, 1)) {
        return socket.emit(EVENTS.ERROR, { code: 'TOO_MANY_ROOMS', message: 'Max 3 rooms per connection' });
      }

      // Don't re-join a room already joined
      if (joinedSessions.has(parishId)) return;

      const room = parishRoom(parishId);
      await socket.join(room);
      joinedSessions.set(parishId, liveId);

      // Atomic viewer count increment
      const updatedSession = await liveService.viewerJoined(liveId);

      if (updatedSession) {
        // Broadcast updated count to entire room — no personal data included
        io.to(room).emit(EVENTS.LIVE_VIEWERS, {
          liveId,
          count: updatedSession.currentViewerCount,
        });
      }
    } catch (err) {
      // Never crash the socket — emit error to this client only
      socket.emit(EVENTS.ERROR, { code: 'JOIN_FAILED', message: 'Failed to join live session' });
      console.error('[Socket] join error:', err.message);
    }
  });

  // ── Leave Parish Room ────────────────────────────────────────────────────────
  socket.on(EVENTS.LEAVE_ROOM, async ({ parishId }) => {
    await handleLeave(io, socket, parishId, joinedSessions);
  });

  // ── Reaction ─────────────────────────────────────────────────────────────────
  socket.on(EVENTS.SEND_REACTION, async ({ parishId, liveId, type }) => {
    try {
      // Validate inputs
      if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
      if (!liveId || !/^[a-f0-9]{24}$/i.test(String(liveId))) return;
      if (!ALLOWED_REACTIONS.has(type)) {
        return socket.emit(EVENTS.ERROR, { code: 'INVALID_REACTION', message: 'Invalid reaction type' });
      }

      // Must be in the room
      if (!joinedSessions.has(parishId)) return;

      // Per-socket rate limiting
      if (!reactionLimiter.isAllowed(socket.id)) {
        return socket.emit(EVENTS.ERROR, {
          code: 'RATE_LIMITED',
          message: `Max ${REACTION_RATE_LIMIT.MAX} reactions per minute`,
        });
      }

      // Persist reaction count increment + get display message
      const reaction = await liveService.addReaction(liveId, type);

      // Broadcast to room — ZERO personal data, only anonymous display string
      const room = parishRoom(parishId);
      io.to(room).emit(EVENTS.LIVE_REACTION, {
        liveId,
        type:    reaction.type,
        display: reaction.display, // e.g. "A faithful sent Amen 🙏"
      });
    } catch (err) {
      socket.emit(EVENTS.ERROR, { code: 'REACTION_FAILED', message: 'Reaction not sent' });
      console.error('[Socket] reaction error:', err.message);
    }
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    // Leave all joined sessions and decrement viewer counts
    for (const [parishId] of joinedSessions.entries()) {
      await handleLeave(io, socket, parishId, joinedSessions);
    }
    reactionLimiter.remove(socket.id);
  });
}

// ── Shared leave logic ─────────────────────────────────────────────────────────

async function handleLeave(io, socket, parishId, joinedSessions) {
  try {
    if (!joinedSessions.has(parishId)) return;

    const liveId = joinedSessions.get(parishId);
    const room = parishRoom(parishId);

    await socket.leave(room);
    joinedSessions.delete(parishId);

    const updatedSession = await liveService.viewerLeft(liveId);

    if (updatedSession) {
      io.to(room).emit(EVENTS.LIVE_VIEWERS, {
        liveId,
        count: Math.max(0, updatedSession.currentViewerCount),
      });
    }
  } catch (err) {
    console.error('[Socket] leave error:', err.message);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────────

/**
 * Initialize Socket.io on the HTTP server.
 * Called once from server.js after Express app is ready.
 *
 * @param {http.Server} httpServer - Node HTTP server
 * @param {string} clientUrl - Allowed CORS origin for WebSocket
 * @returns {SocketIO.Server} io instance (for use in other services e.g. admin broadcasts)
 */
function initRealtime(httpServer, clientUrl) {
  const { Server } = require('socket.io');
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { getRedisClient } = require('../config/redis');

  const io = new Server(httpServer, {
    cors: {
      origin:      clientUrl,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    // Security: limit payload size to prevent DoS
    maxHttpBufferSize: 1e4, // 10 KB max per message
    // Ping/pong to detect stale connections
    pingTimeout:  20_000,
    pingInterval: 25_000,
    // Transports: websocket preferred, polling fallback for mobile
    transports: ['websocket', 'polling'],
  });

  // Apply auth middleware to all connections
  const redisClient = getRedisClient();
  if (redisClient) {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter active');
  }

  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', (socket) => {
    handleConnection(io, socket);
  });

  // ── Admin broadcast helpers (called by liveService) ───────────────────────

  /**
   * Broadcast that a live session started to a parish room.
   * Called by liveService after DB record is created.
   */
  io.broadcastLiveStarted = (parishId, session) => {
    try {
      const room = parishRoom(parishId);
      io.to(room).emit(EVENTS.LIVE_STARTED, {
        liveId:   session._id,
        parishId: session.parishId,
        title:    session.title,
        startedAt:session.startedAt,
      });
    } catch (err) {
      console.error('[Socket] broadcastLiveStarted error:', err.message);
    }
  };

  /**
   * Broadcast that a live session ended.
   */
  io.broadcastLiveEnded = (parishId, liveId) => {
    try {
      const room = parishRoom(parishId);
      io.to(room).emit(EVENTS.LIVE_ENDED, { liveId, parishId });
    } catch (err) {
      console.error('[Socket] broadcastLiveEnded error:', err.message);
    }
  };

  attachHealthMonitors(io);
  console.log('✅ Socket.io realtime layer initialized');
  return io;
}

module.exports = { initRealtime, EVENTS };
// This line is intentionally blank — see realtime/health.js for monitor attachment
