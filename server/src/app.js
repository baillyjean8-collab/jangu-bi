'use strict';

/**
 * app.js — Express application factory
 *
 * Security middleware stack (in deliberate order):
 * 1. Trust proxy        — correct IP detection behind Nginx/load balancer
 * 2. Helmet             — 14 HTTP security headers in one call
 * 3. CORS               — whitelist origin only
 * 4. Raw body capture   — for webhook signature verification (must be before json())
 * 5. JSON body parser   — with size limit
 * 6. Cookie parser      — for httpOnly refresh token
 * 7. Mongo sanitize     — strip NoSQL injection operators from body/query
 * 8. HPP               — prevent HTTP parameter pollution
 * 9. API rate limiter   — global rate limit
 * 10. Routes
 * 11. 404 handler
 * 12. Global error handler
 */

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize= require('express-mongo-sanitize');
const hpp          = require('hpp');
const path         = require('path');

const {
  requestId,
  suspiciousPatternDetector,
  responseHardening,
  enforceJsonContentType,
  extractClientIp,
  requestSizeGuard,
} = require('./middlewares/security');

const config = require('./config/env');

// Domain routers
const authRoutes     = require('./domains/auth/auth.routes');
const { router: userRoutes }     = require('./domains/users');
const { router: parishRoutes }   = require('./domains/parishes');
const { router: liveRoutes }     = require('./domains/live');
const { router: donationRoutes } = require('./domains/donations');
const adminRoutes    = require('./domains/admin/admin.routes');
const { router: postRoutes }   = require('./domains/posts');
const { router: storyRoutes }  = require('./domains/stories');
const { router: chatRoutes }   = require('./domains/chat');
const { router: announcementRoutes } = require('./domains/announcements');
const bibleRoutes = require('./domains/bible/bible.routes');
// Middleware
const { apiRateLimiter }              = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// ─── App Factory ───────────────────────────────────────────────────────────────

function createApp() {
  const app = express();

  // ── 0. Request ID + IP normalization (first — sets req.requestId for all logs)
  app.use(requestId);
  app.use(extractClientIp);

  // ── 0b. Response hardening (set before routes — headers applied on all responses)
  app.use(responseHardening);

  // ── 1. Trust proxy ────────────────────────────────────────────────────────
  // Required for correct req.ip behind Nginx / Render / AWS ALB.
  // '1' = trust first proxy hop only (Nginx). Adjust for your infra.
  app.set('trust proxy', 1);

  // ── 2. Helmet — HTTP security headers ────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"], // Allow inline styles for API docs if needed
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc:    ["'self'"],
        objectSrc:  ["'none'"],
        frameSrc:   ["'none'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Needed if embedding in iframes (live player)
    hsts: config.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  }));

  // ── 3. CORS ───────────────────────────────────────────────────────────────
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and whitelisted client
      const allowed = [config.client.url, 'http://localhost:5174', 'http://localhost:5173'];
if (!origin || allowed.includes(origin)) {
  return callback(null, true);
}
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,  // Required for httpOnly cookie (refresh token)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86_400, // Cache preflight for 24 hours
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Handle preflight for all routes

  // ── 4. Raw body capture — MUST come before express.json() ─────────────────
  // Webhook routes need the raw buffer to verify HMAC signatures.
  // We capture rawBody on ALL requests, but only use it for /webhook routes.
 // ── 4 & 5. JSON body parser ───────────────────────────────────────────────
  app.use(express.json({ limit: '8mb' })); // releve pour autoriser les photos en base64 (voir composeur de publications)
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  // ── 6. Cookie parser ──────────────────────────────────────────────────────
  // Secret signs cookies — helps detect tampering (though refresh token is also JWT-signed)
  app.use(cookieParser(config.jwt.accessSecret));

  // ── 6b. Content-Type enforcement (before body is read)
  app.use(enforceJsonContentType);

  // ── 6c. Request size guard (secondary defense before body parse)
  // Skip avatar uploads — multer's own 3MB limit governs that route instead.
  app.use((req, res, next) => {
    if (req.path.includes('/avatar') || req.path.includes('/posts') || req.path.includes('/stories') || req.path.includes('/parishes') || req.path.includes('/users')) return next(); // ces routes acceptent des photos en base64, plus volumineuses
    return requestSizeGuard(51_200)(req, res, next);
  });

  // ── 7. MongoDB query injection sanitizer ─────────────────────────────────
  // Strips $ and . from req.body, req.query, req.params to prevent NoSQL injection
  // e.g. { "email": { "$gt": "" } } → { "email": {} } (harmless)
  app.use(mongoSanitize({
    replaceWith: '_',  // Replace $ with _ instead of removing (better for logging)
    onSanitize: ({ req, key }) => {
      console.warn(`[Security] NoSQL injection attempt on field "${key}" from ${req.ip}`);
    },
  }));

  // ── 8. HTTP Parameter Pollution prevention ────────────────────────────────
  // Prevents ?status=SUCCESS&status=FAILED[] attacks where arrays bypass validation
  app.use(hpp({
    whitelist: ['status', 'provider'], // These fields intentionally allow multiple values
  }));

  // ── 8b. Suspicious pattern detector (log attack probes)
  app.use(suspiciousPatternDetector);

  // ── 9. Global API rate limiter ────────────────────────────────────────────
  app.use('/api', apiRateLimiter);

  // ── Health check (no auth, no rate limit) ────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.env,
      // Never expose version, DB status, or internal metrics here in production
    });
  });

  // ── Static file serving for user-uploaded content (avatars) ──────────────
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '7d',
    dotfiles: 'deny',
    index: false,
  }));

  // ── 10. API Routes ────────────────────────────────────────────────────────
  app.use('/api/auth',      authRoutes);
  app.use('/api/users',     userRoutes);
  app.use('/api/parishes',  parishRoutes);
  app.use('/api/live',      liveRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/admin',     adminRoutes);
  app.use('/api/notifications', require('./domains/notifications'));
  app.use('/api/messages', require('./domains/messages'));
  app.use('/api/parish-admin', require('./domains/parish-admin'));
  app.use('/api/posts',     postRoutes);
app.use('/api/stories',   storyRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/bible', bibleRoutes);

  // ── 11. 404 handler ───────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── 12. Global error handler — must be last ───────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
