'use strict';

/**
 * Security Hardening Middleware
 *
 * Layers beyond what Helmet + rate limiting provide:
 *
 * 1. REQUEST FINGERPRINTING
 *    Assigns a unique requestId to every request for log correlation.
 *    Allows tracing a single request across all log lines without exposing internals.
 *
 * 2. SUSPICIOUS PATTERN DETECTION
 *    Scans request bodies/params for known attack patterns (SQLi, XSS, path traversal).
 *    Logs and optionally blocks. Does NOT replace Joi validation — adds a detection layer.
 *
 * 3. RESPONSE HARDENING
 *    Strips headers that leak server info (X-Powered-By already done by Helmet).
 *    Adds Cache-Control for auth routes to prevent caching credentials.
 *
 * 4. CONTENT TYPE ENFORCEMENT
 *    Rejects requests with wrong Content-Type on mutation endpoints.
 *    Prevents multipart confusion attacks.
 *
 * 5. SECURITY HEADERS AUDIT
 *    Verifies Helmet is working by asserting critical headers are present.
 *    Only runs in development — catches misconfiguration early.
 */

const crypto = require('crypto');
const { AuditLog } = require('../models');

// ─── 1. Request ID ─────────────────────────────────────────────────────────────

function requestId(req, res, next) {
  const id = crypto.randomBytes(8).toString('hex');
  req.requestId = id;
  res.setHeader('X-Request-Id', id); // Returned to client for support correlation
  next();
}

// ─── 2. Suspicious Pattern Detector ───────────────────────────────────────────

// Patterns compiled once at module load — not per-request
const SUSPICIOUS_PATTERNS = [
  // SQL injection
  { name: 'sqli_basic',    re: /(\bselect\b|\bunion\b|\bdrop\b|\binsert\b|\bdelete\b)\s/i },
  { name: 'sqli_comment',  re: /--\s|\/\*|\*\//     },
  // XSS
  { name: 'xss_script',    re: /<script[\s>]/i       },
  { name: 'xss_event',     re: /on\w+\s*=\s*["'`]/i },
  { name: 'xss_href',      re: /javascript\s*:/i     },
  // Path traversal
  { name: 'path_traversal',re: /\.\.[/\\]/           },
  // NoSQL injection (already sanitized by mongoSanitize, but log if seen)
  { name: 'nosql_op',      re: /\$where|\$gt|\$lt|\$ne|\$in/ },
  // Server-side template injection probes
  { name: 'ssti_probe',    re: /\{\{.*\}\}|<%.*%>/  },
];

/**
 * Recursively scan an object for suspicious patterns.
 * Returns the first match found, or null.
 */
function scanObject(obj, depth = 0) {
  if (depth > 4 || obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    for (const { name, re } of SUSPICIOUS_PATTERNS) {
      if (re.test(obj)) return { pattern: name, value: obj.slice(0, 100) };
    }
    return null;
  }
  if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      const hit = scanObject(val, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

function suspiciousPatternDetector(req, res, next) {
  // Only scan mutation endpoints (GET/HEAD are read-only)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const sources = [req.body, req.query, req.params];
  for (const source of sources) {
    const hit = scanObject(source);
    if (hit) {
      // Log without blocking — the validator will reject malformed input anyway
      // Blocking here would create a bypass: attacker crafts a payload that
      // looks clean to us but exploits the downstream parser differently.
      console.warn('[Security] Suspicious pattern detected:', {
        requestId: req.requestId,
        ip:        req.ip,
        method:    req.method,
        path:      req.path,
        pattern:   hit.pattern,
        // Never log the actual value — only the pattern name
      });

      // Log to AuditLog asynchronously (fire-and-forget — don't block request)
      AuditLog.create({
        action:    'auth.login_failed', // closest existing action for now
        status:    'warning',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.slice(0, 500),
        metadata: {
          type:    'suspicious_pattern',
          pattern: hit.pattern,
          method:  req.method,
          path:    req.path,
        },
      }).catch(() => {}); // swallow — audit failure must not break the request
    }
  }

  next();
}

// ─── 3. Response Hardening ────────────────────────────────────────────────────

function responseHardening(req, res, next) {
  // Remove headers that confirm tech stack (defense in depth — Helmet removes most)
  res.removeHeader('X-Powered-By');  // Express default (Helmet should already remove)
  res.removeHeader('Server');        // Node/Express sometimes adds this

  // Prevent auth responses from being cached anywhere
  const isAuthRoute = req.path.startsWith('/api/auth');
  if (isAuthRoute) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // For all API responses: no caching of JSON data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}

// ─── 4. Content-Type Enforcement ──────────────────────────────────────────────

/**
 * Reject mutation requests that aren't application/json.
 * Prevents multipart/form-data or text/plain confusion attacks
 * where a browser CSRF payload uses a non-preflighted content type.
 */
function enforceJsonContentType(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  // Skip webhook routes — they may send form-encoded or raw bodies
  if (req.path.includes('/webhook')) return next();

  // Skip avatar upload — requires multipart/form-data for file upload (multer)
  if (req.path.includes('/avatar')) return next();

  const ct = req.headers['content-type'] || '';
  if (ct && !ct.includes('application/json')) {
    return res.status(415).json({
      success: false,
      message: 'Content-Type must be application/json',
      code:    'UNSUPPORTED_MEDIA_TYPE',
    });
  }

  next();
}

// ─── 5. IP Extraction (behind proxy) ─────────────────────────────────────────

/**
 * Normalizes the client IP from X-Forwarded-For, handling:
 * - Multiple proxy hops: "client, proxy1, proxy2" → take first
 * - IPv6-mapped IPv4: "::ffff:1.2.3.4" → "1.2.3.4"
 * - Missing header: fall through to req.socket.remoteAddress
 *
 * IMPORTANT: trust proxy must be set in Express for req.ip to work correctly.
 * This middleware adds req.clientIp as a normalized alias.
 */
function extractClientIp(req, res, next) {
  // Express's req.ip already handles trust proxy correctly when app.set('trust proxy', 1)
  // This normalizes IPv6-mapped IPv4 addresses for cleaner logging
  let ip = req.ip || req.socket?.remoteAddress || 'unknown';

  // Normalize ::ffff:1.2.3.4 → 1.2.3.4
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  req.clientIp = ip;
  next();
}

// ─── 6. Request Size Guard ────────────────────────────────────────────────────

/**
 * Secondary defense: reject requests whose Content-Length header
 * exceeds our body parser limit BEFORE Express tries to parse the body.
 * The body parser's limit is the real guard; this is a fail-fast layer.
 */
function requestSizeGuard(maxBytes = 51_200) { // 50 KB
  return (req, res, next) => {
    const len = parseInt(req.headers['content-length'] || '0', 10);
    if (len > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large',
        code:    'PAYLOAD_TOO_LARGE',
      });
    }
    next();
  };
}

// ─── 7. Development Security Audit ───────────────────────────────────────────

/**
 * In development: verify critical security headers are present after Helmet.
 * Run once per server start, not per-request.
 */
function auditSecurityHeaders(app) {
  if (process.env.NODE_ENV !== 'development') return;

  const REQUIRED_HEADERS = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'strict-transport-security',
    'content-security-policy',
  ];

  // Inject a one-time check middleware
  let checked = false;
  app.use((req, res, next) => {
    if (checked) return next();
    checked = true;

    const original = res.end.bind(res);
    res.end = function (...args) {
      const missing = REQUIRED_HEADERS.filter(h => !res.getHeader(h));
      if (missing.length > 0) {
        console.warn('[Security] Missing headers:', missing.join(', '));
      } else {
        console.log('[Security] ✅ All critical headers present');
      }
      return original(...args);
    };
    next();
  });
}

module.exports = {
  requestId,
  suspiciousPatternDetector,
  responseHardening,
  enforceJsonContentType,
  extractClientIp,
  requestSizeGuard,
  auditSecurityHeaders,
};
