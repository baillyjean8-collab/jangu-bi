# JANGU BI 🕊️
### Digital Religious Platform — Secure MVP

> Connecting parishes and believers across Africa through live streaming, digital donations, and spiritual community.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  React + Vite + TailwindCSS (Mobile-first PWA)          │
│  • Token in memory (never localStorage)                 │
│  • httpOnly cookie for refresh token                    │
│  • Role-gated routes (user / parish_admin / super_admin)│
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + WSS
┌──────────────────────▼──────────────────────────────────┐
│  Nginx (TLS termination, rate limiting, security headers)│
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Express API (Node.js 20)                               │
│  ├── Auth Domain      (JWT + OTP + refresh rotation)    │
│  ├── Users Domain     (profiles, parish membership)     │
│  ├── Parishes Domain  (CRUD, verification)              │
│  ├── Live Domain      (session management)              │
│  ├── Donations Domain (fintech lifecycle + webhooks)    │
│  └── Admin Domain     (dashboard, audit, exports)       │
│                                                         │
│  Socket.io (isolated layer, room-scoped, rate-limited)  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  MongoDB Atlas (w=majority, j=true, TLS enforced)        │
│  7 collections: User OTP Parish Donation Live            │
│                 AuditLog RefreshToken                    │
└─────────────────────────────────────────────────────────┘
```

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Transport | TLS 1.2/1.3 only, HSTS preload, OCSP stapling |
| Auth | JWT (15min) + Refresh (7d, httpOnly cookie, rotated) |
| OTP | HMAC-SHA256 (not bcrypt — see VULN-008 fix), 6-digit, TTL 10min |
| Password | bcrypt cost=12, complexity enforced, account lockout |
| API | Helmet (14 headers), CORS whitelist, mongo-sanitize, HPP |
| Rate Limiting | 4-tier: auth/OTP/donations/general — per IP and per userId |
| RBAC | 3 roles, enforced at middleware level on every route |
| Webhooks | HMAC-SHA256 per provider (CinetPay/Wave/Orange Money) |
| Data | `select:false` on sensitive fields, `toJSON`+`toObject` transforms |
| Audit | Immutable AuditLog, all financial + admin actions logged |
| Realtime | Room-scoped, anonymous reactions, per-socket rate limiting |
| Tokens | Refresh token rotation + theft detection (family revocation) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Git

### Development

```bash
# Clone
git clone https://github.com/your-org/jangu-bi.git
cd jangu-bi

# Backend
cd server
cp .env.example .env          # Fill in your secrets
npm install
npm run dev                   # http://localhost:5000

# Frontend (new terminal)
cd ../client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

### Generate required secrets

```bash
# JWT secrets (run twice for ACCESS and REFRESH — must be different)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OTP HMAC secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Required `.env` values

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | 64-char random hex — access token signing |
| `JWT_REFRESH_SECRET` | 64-char random hex — **different** from access |
| `OTP_HMAC_SECRET` | 64-char random hex — OTP hashing key |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register + trigger OTP |
| POST | `/api/auth/verify-otp` | — | Verify email OTP |
| POST | `/api/auth/login` | — | Login → tokens |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/api/auth/logout` | Bearer | Revoke refresh token |
| POST | `/api/auth/forgot-password` | — | Send reset OTP |
| POST | `/api/auth/reset-password` | — | Reset + revoke all tokens |
| GET | `/api/parishes` | — | List verified parishes |
| POST | `/api/parishes` | Admin | Create parish |
| GET | `/api/live/active` | Bearer | All active streams |
| POST | `/api/live/start` | ParishAdmin | Start live session |
| POST | `/api/donations` | Bearer | Initiate donation |
| POST | `/api/donations/webhook/:provider` | — | Provider webhook |
| GET | `/api/admin/dashboard` | SuperAdmin | Stats overview |
| GET | `/api/admin/audit-logs` | SuperAdmin | Immutable audit trail |

---

## Payment Providers

| Provider | Status | Webhook Verification |
|----------|--------|---------------------|
| Wave | ✅ Ready | HMAC-SHA256 (`X-Wave-Signature`) |
| CinetPay | ✅ Ready | SHA-256 sorted params + API key |
| Orange Money | ✅ Ready | HMAC-SHA256 timestamp composite |
| MTN MoMo | 🔧 Stub | HMAC-SHA256 (OAuth2 flow pending) |

---

## Socket.io Events

```
Client → Server          Server → Client
─────────────────────    ─────────────────────
room:join                live:started
room:leave               live:ended
reaction:send            live:reaction      ← "A faithful sent Amen 🙏"
                         live:viewerCount
                         error
```

---

## Deployment

```bash
# Single-command deploy (read the script first!)
chmod +x deployment/deploy.sh
./deployment/deploy.sh

# Zero-downtime reload after code update
pm2 reload ecosystem.config.cjs

# View logs
pm2 logs jangu-bi-api
```

See `deployment/` for:
- `nginx.conf` — production Nginx with TLS, rate limiting, WebSocket
- `ecosystem.config.cjs` — PM2 process manager
- `deploy.sh` — step-by-step Ubuntu 22.04 server setup
- `.github/workflows/ci-cd.yml` — GitHub Actions pipeline

---

## Project Structure

```
jangu-bi/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── api/               # Axios + auto-refresh interceptor
│       ├── context/           # AuthContext (token in memory)
│       ├── guards/            # ProtectedRoute, RoleGuard
│       ├── hooks/             # useSocket (reconnection + backoff)
│       └── pages/             # auth / home / live / donate / admin
│
├── server/                    # Express API
│   └── src/
│       ├── config/            # env validation, DB connection
│       ├── domains/           # auth / users / parishes / live / donations / admin
│       ├── middlewares/       # authenticate, authorize, rateLimiter, security
│       ├── models/            # 7 Mongoose schemas (hardened)
│       ├── realtime/          # Socket.io + health monitors
│       └── shared/
│           ├── errors/        # Typed error classes
│           ├── payment/       # Gateway adapters (Wave, CinetPay, Orange)
│           └── utils/         # JWT, OTP, audit logger, response formatter
│
└── deployment/                # Nginx, PM2, deploy scripts, CI/CD
```

---

## Investor Summary

**JANGU BI** addresses a real gap in Africa's religious tech market:

- **300M+** Christian believers in Sub-Saharan Africa
- **$2B+** annual church donations — overwhelmingly cash, with no digital trail
- **Mobile money penetration** at 70%+ in West Africa (Wave, Orange Money, MTN MoMo)
- **Live streaming** demand surged post-COVID and never retreated

**Technical moat:**
- Financial-grade security from day one (investor-auditable audit logs)
- Multi-provider payment abstraction (swap providers without code changes)
- Mobile-first, French-language first (underserved francophone market)
- Clean architecture designed for team scaling

**MVP metrics targets:**
- 50 parishes, 5,000 believers, 3 months post-launch
- Average donation: 2,500 XOF (~$4 USD) × 2,000 monthly donors = 5M XOF/month gross
- Revenue model: 2.5% platform fee on processed donations

---

*Built with security-first architecture. Every financial action is auditable. Every token is rotatable. Every secret is configurable.*
