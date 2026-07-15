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
const { liveService, liveRepo } = require('../domains/live');
const guestRegistry = require('./guestRegistry');
const { User } = require('../models');
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
  SEND_CHAT:       'chat:send',
  SEND_GIFT:       'gift:send',
  CHAT_MESSAGE:    'chat:message',
  LIVE_GIFT:       'live:gift',
  CHAT_MESSAGE_ADMIN:  'chat:message:admin',
  LIVE_REACTION_ADMIN: 'live:reaction:admin',
  LIVE_GIFT_ADMIN:     'live:gift:admin',

  // Invitation d'un fidele a monter en direct (co-diffuseur)
  ROSTER_UPDATE:    'live:roster',
  INVITE_SEND:      'live:invite:send',
  INVITE_RECEIVED:  'live:invite:received',
  INVITE_ACCEPT:    'live:invite:accept',
  GUEST_JOINED:     'live:guest:joined',
  GUEST_CONTROL_SEND:     'live:guest:control:send',
  GUEST_CONTROL_RECEIVED: 'live:guest:control:received',
  GUEST_REMOVED:          'live:guest:removed',
  GUEST_CAMERA_RESPONSE_SEND:     'live:guest:camera:response:send',
  GUEST_CAMERA_RESPONSE_RECEIVED: 'live:guest:camera:response:received',
  INVITE_FULL: 'live:invite:full',
  SEND_SHARE:  'share:send',
  SHARE_COUNT: 'live:shareCount',
});

const MAX_GUESTS_SIMULTANES = 4;

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

const CHAT_RATE_LIMIT = { MAX: 20, WINDOW_MS: 60_000 };
const chatLimiter = new SocketRateLimiter(CHAT_RATE_LIMIT.MAX, CHAT_RATE_LIMIT.WINDOW_MS).startCleanup();

const GIFT_RATE_LIMIT = { MAX: 15, WINDOW_MS: 60_000 };
const giftLimiter = new SocketRateLimiter(GIFT_RATE_LIMIT.MAX, GIFT_RATE_LIMIT.WINDOW_MS).startCleanup();

// ── Auth Middleware ────────────────────────────────────────────────────────────

/**
 * Verify JWT on socket handshake.
 * Token passed as: socket.handshake.auth.token (Bearer token from client memory).
 * Anonymous viewers are allowed with reduced capabilities (no reactions).
 */
async function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    socket.user = null;
    socket.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    let firstName = null;
    let lastName = null;
    try {
      const userDoc = await User.findById(decoded.sub).select('firstName lastName').lean();
      if (userDoc) {
        firstName = userDoc.firstName;
        lastName = userDoc.lastName;
      }
    } catch (lookupErr) {
      // Nom indisponible : le chat retombera sur un nom generique
    }
    socket.user = {
      userId:      decoded.sub,
      role:        decoded.role,
      isVerified:  decoded.isVerified,
      parishId:    decoded.parishId,
      firstName,
      lastName,
    };
    socket.isAuthenticated = true;
    next();
  } catch (err) {
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

const roster = new Map();

function nomAffichage(user) {
  const prenom = (user && user.firstName) || 'Fidele';
  const initiale = (user && user.lastName) ? (user.lastName[0].toUpperCase() + '.') : '';
  return (prenom + ' ' + initiale).trim();
}

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

      // Si ce socket est l'administrateur qui a lance ce direct, il rejoint
      // aussi une salle privee reservee : c'est la seule a recevoir les
      // evenements avec l'identite reelle des fideles (chat, reactions, cadeaux).
      let sessionActuelle = null;
      try {
        sessionActuelle = await liveRepo.findById(liveId);
        if (sessionActuelle && socket.user && String(sessionActuelle.startedBy) === String(socket.user.userId)) {
          await socket.join('admin:' + liveId);
        }
      } catch (lookupErr) { /* pas grave si echec, l'admin restera anonyme */ }

      // Atomic viewer count increment
      if (socket.isAuthenticated) {
        if (!roster.has(room)) roster.set(room, new Map());
        roster.get(room).set(socket.id, { userId: socket.user.userId, nom: nomAffichage(socket.user) });
        io.to('admin:' + liveId).emit(EVENTS.ROSTER_UPDATE, {
          liveId,
          roster: Array.from(roster.get(room).values()).filter(function(p) {
            return !sessionActuelle || String(p.userId) !== String(sessionActuelle.startedBy);
          }),
        });
      }

      const updatedSession = await liveService.viewerJoined(liveId);

      if (updatedSession) {
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
        display: reaction.display,
      });

      if (socket.user) {
        const prenomReel = socket.user.firstName || 'Fidele';
        const initialeReelle = socket.user.lastName ? (socket.user.lastName[0].toUpperCase() + '.') : '';
        io.to('admin:' + liveId).emit(EVENTS.LIVE_REACTION_ADMIN, {
          liveId,
          type: reaction.type,
          nom: (prenomReel + ' ' + initialeReelle).trim(),
        });
      }
    } catch (err) {
      socket.emit(EVENTS.ERROR, { code: 'REACTION_FAILED', message: 'Reaction not sent' });
      console.error('[Socket] reaction error:', err.message);
    }
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  // --- Partage du direct ---
  socket.on(EVENTS.SEND_SHARE, ({ parishId, liveId }) => {
    if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
    if (!liveId || !/^[a-f0-9]{24}$/i.test(String(liveId))) return;
    liveService.incrementShare(liveId).then(function(count) {
      const room = parishRoom(parishId);
      io.to(room).emit(EVENTS.SHARE_COUNT, { liveId, count });
    }).catch(function(err) { console.error('[Socket] share error:', err.message); });
  });

  // --- Chat (texte libre, requiert une authentification) ---
  socket.on(EVENTS.SEND_CHAT, ({ parishId, liveId, texte }) => {
    try {
      if (!socket.isAuthenticated) {
        return socket.emit(EVENTS.ERROR, { code: 'AUTH_REQUIRED', message: 'Connectez-vous pour commenter' });
      }
      if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
      if (!liveId || !/^[a-f0-9]{24}$/i.test(String(liveId))) return;
      if (!joinedSessions.has(parishId)) return;

      const propre = (texte || '').toString().trim().slice(0, 300);
      if (!propre) return;

      if (!chatLimiter.isAllowed(socket.id)) {
        return socket.emit(EVENTS.ERROR, { code: 'RATE_LIMITED', message: 'Trop de messages, patientez un peu.' });
      }

      const prenom = socket.user.firstName || 'Fidele';
      const initialeNom = socket.user.lastName ? (socket.user.lastName[0].toUpperCase() + '.') : '';
      const nomReel = (prenom + ' ' + initialeNom).trim();
      const idMessage = Date.now() + '-' + Math.random().toString(36).slice(2, 8);

      // Les autres fideles voient un envoyeur anonyme, par discretion
      const room = parishRoom(parishId);
      io.to(room).emit(EVENTS.CHAT_MESSAGE, {
        liveId,
        id: idMessage,
        nom: 'Un fidele',
        texte: propre,
      });

      // Seul l'admin (diffuseur) voit l'identite reelle de l'envoyeur
      io.to('admin:' + liveId).emit(EVENTS.CHAT_MESSAGE_ADMIN, {
        liveId,
        id: idMessage,
        nom: nomReel,
        texte: propre,
      });
    } catch (err) {
      console.error('[Socket] chat error:', err.message);
    }
  });

  // --- Cadeau (geste spirituel gratuit, requiert une authentification) ---
  socket.on(EVENTS.SEND_GIFT, ({ parishId, liveId, emoji, nom }) => {
    try {
      if (!socket.isAuthenticated) return;
      if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
      if (!liveId || !/^[a-f0-9]{24}$/i.test(String(liveId))) return;
      if (!joinedSessions.has(parishId)) return;

      if (!giftLimiter.isAllowed(socket.id)) {
        return socket.emit(EVENTS.ERROR, { code: 'RATE_LIMITED', message: 'Trop de cadeaux envoyes, patientez.' });
      }

      const room = parishRoom(parishId);
      const nomCadeau = (nom || 'Cadeau').toString().slice(0, 40);
      const emojiSur = (emoji || '').toString().slice(0, 8);

      io.to(room).emit(EVENTS.LIVE_GIFT, {
        liveId,
        emoji: emojiSur,
        nom: nomCadeau,
      });

      if (socket.user) {
        const prenomReel = socket.user.firstName || 'Fidele';
        const initialeReelle = socket.user.lastName ? (socket.user.lastName[0].toUpperCase() + '.') : '';
        io.to('admin:' + liveId).emit(EVENTS.LIVE_GIFT_ADMIN, {
          liveId,
          emoji: emojiSur,
          cadeau: nomCadeau,
          expediteur: (prenomReel + ' ' + initialeReelle).trim(),
        });
      }
    } catch (err) {
      console.error('[Socket] gift error:', err.message);
    }
  });

  // --- Invitation a monter en direct ---
  socket.on(EVENTS.INVITE_SEND, ({ parishId, liveId, targetUserId }) => {
    if (!socket.isAuthenticated) return;
    if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
    const room = parishRoom(parishId);
    const map = roster.get(room);
    if (!map) return;
    for (const [sockId, info] of map.entries()) {
      if (String(info.userId) === String(targetUserId)) {
        io.to(sockId).emit(EVENTS.INVITE_RECEIVED, { liveId, parishId });
        break;
      }
    }
  });

  socket.on(EVENTS.INVITE_ACCEPT, ({ parishId, liveId }) => {
    if (!socket.isAuthenticated) return;
    if (!liveId) return;
    if (guestRegistry.count(String(liveId)) >= MAX_GUESTS_SIMULTANES) {
      socket.emit(EVENTS.INVITE_FULL, { liveId });
      return;
    }
    guestRegistry.approve(String(liveId), socket.user.userId);
    const room = parishRoom(parishId);
    io.to(room).emit(EVENTS.GUEST_JOINED, {
      liveId,
      userId: socket.user.userId,
      nom: nomAffichage(socket.user),
    });
  });

  // --- Controle a distance de l'invite par l'admin (couper micro/camera, faire descendre) ---
  socket.on(EVENTS.GUEST_CONTROL_SEND, ({ parishId, liveId, targetUserId, action }) => {
    if (!socket.isAuthenticated) return;
    if (!parishId || !/^[a-f0-9]{24}$/i.test(String(parishId))) return;
    if (!socket.rooms.has('admin:' + liveId)) return; // seul l'admin du direct peut envoyer cet ordre
    if (['mute', 'unmute', 'camera-off', 'camera-request', 'kick'].indexOf(action) === -1) return;

    const room = parishRoom(parishId);
    const map = roster.get(room);
    if (!map) return;

    for (const [sockId, info] of map.entries()) {
      if (String(info.userId) === String(targetUserId)) {
        io.to(sockId).emit(EVENTS.GUEST_CONTROL_RECEIVED, { liveId, action });
        if (action === 'kick') {
          guestRegistry.revoke(String(liveId), targetUserId);
          io.to(room).emit(EVENTS.GUEST_REMOVED, { liveId, userId: targetUserId });
        }
        break;
      }
    }
  });

  // --- Reponse du fidele a une demande de reactivation de sa camera ---
  socket.on(EVENTS.GUEST_CAMERA_RESPONSE_SEND, ({ liveId, accepted }) => {
    if (!socket.isAuthenticated) return;
    if (!liveId) return;
    io.to('admin:' + liveId).emit(EVENTS.GUEST_CAMERA_RESPONSE_RECEIVED, {
      liveId,
      userId: socket.user.userId,
      accepted: !!accepted,
    });
  });

  socket.on('disconnect', async () => {
    // Leave all joined sessions and decrement viewer counts
    for (const [parishId] of joinedSessions.entries()) {
      await handleLeave(io, socket, parishId, joinedSessions);
      const room = parishRoom(parishId);
      if (roster.has(room)) {
        roster.get(room).delete(socket.id);
      }
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
