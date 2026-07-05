# JANGU BI — PHASE 2: DATABASE DESIGN REFERENCE

## Schema Overview

| Model | Collection | Records Type | Deletable? | Sensitive Fields |
|-------|-----------|-------------|------------|-----------------|
| User | users | Persistent | Soft-delete | password, refreshTokenHash |
| OTP | otps | TTL (10 min) | Auto (TTL) | hashedOtp |
| Parish | parishes | Persistent | Soft-delete | — |
| Donation | donations | Immutable | Never | providerMetadata |
| Live | lives | Persistent | Admin only | streamKey |
| AuditLog | auditlogs | Immutable | Never | — |
| RefreshToken | refreshtokens | TTL (7 days) | On revoke | tokenHash |

---

## Entity Relationship Map

```
User ─────────────────────────────────────────────────────┐
 │                                                         │
 │ parishId (member of)       adminId (manages)           │
 ▼                                 ▼                      │
Parish ──────────────────────────────                     │
 │                                                         │
 │ parishId                   parishId                    │
 ▼                                 ▼                      │
Live                           Donation ◀────────── userId┘
                                   │
                               AuditLog (targetId → Donation)

OTP: userId → User (1-to-1 per purpose)
RefreshToken: userId → User (1-to-many, one per device)
AuditLog: userId → User, targetId → any model
```

---

## Index Strategy

### User Indexes
```javascript
{ email: 1 }              // unique — login lookup
{ phone: 1 }              // registration duplicate check
{ parishId: 1 }           // list parish members
{ role: 1 }               // admin filtering
{ createdAt: -1 }         // admin user list (newest first)
```

### OTP Indexes
```javascript
{ expiresAt: 1 }          // TTL — auto-delete expired OTPs
{ userId: 1, purpose: 1 } // lookup active OTP for user
```

### Donation Indexes
```javascript
{ idempotencyKey: 1 }              // unique — prevent duplicates
{ userId: 1, createdAt: -1 }       // user donation history
{ parishId: 1, createdAt: -1 }     // parish donation reports
{ status: 1 }                      // filter by status
{ provider: 1, providerTransactionId: 1 }  // webhook reconciliation
{ providerTransactionId: 1 }       // sparse — webhook lookup
```

### AuditLog Indexes
```javascript
{ action: 1 }                      // filter by action type
{ userId: 1, timestamp: -1 }       // user activity timeline
{ targetId: 1, targetModel: 1 }    // entity audit trail
{ timestamp: -1 }                  // chronological log view
{ action: 1, status: 1, timestamp: -1 }  // admin dashboard
```

---

## Status Transition Rules

### Donation Status Machine
```
INITIATED ──▶ PENDING ──▶ SUCCESS ──▶ REFUNDED
     │              │
     └──▶ CANCELLED └──▶ FAILED
```
- Transitions enforced by `transitionStatus()` instance method
- Invalid transitions throw an error (never silently ignored)
- Every transition is recorded in `statusHistory` (append-only)

---

## Security Design Decisions

| Decision | Rationale |
|----------|-----------|
| `password` field has `select: false` | Never accidentally returned in API responses |
| `hashedOtp` field has `select: false` | OTP hash never exposed, must be explicitly selected |
| `streamKey` field has `select: false` | RTMP stream key is a secret, never in API responses |
| `providerMetadata` has `select: false` | May contain sensitive payment tokens |
| AuditLog blocks `updateOne` | Enforces immutability at schema level |
| RefreshToken stores hash only | Raw token never persisted, cannot be extracted from DB |
| OTP has `attempts` counter | Prevents brute-force of OTP with max 3 tries |
| Donation has `idempotencyKey` | Prevents duplicate charges from network retries |
| TTL indexes on OTP + RefreshToken | Automated cleanup — no stale sensitive data |
| `toJSON` transforms on User/Donation | Defensive — sensitive fields stripped even if accidentally selected |

---

## Data Volume Estimates (MVP → 1000 parishes)

| Collection | Estimated Documents | Avg Doc Size | Total |
|-----------|--------------------|-----------:|------:|
| users | 50,000 | 800 B | ~40 MB |
| parishes | 1,000 | 600 B | ~600 KB |
| donations | 200,000 | 1.2 KB | ~240 MB |
| auditlogs | 500,000 | 500 B | ~250 MB |
| lives | 10,000 | 400 B | ~4 MB |
| otps | ~500 active | 300 B | negligible |
| refreshtokens | ~10,000 active | 400 B | ~4 MB |

**Total estimated at MVP scale: ~540 MB — well within MongoDB Atlas free tier**

---

## Environment Variables Required

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jangubi?retryWrites=true&w=majority
```

### MongoDB Atlas Setup Checklist
- [ ] Enable TLS/SSL (default on Atlas)
- [ ] IP Allowlist: only server IPs
- [ ] Create dedicated DB user (not root)
- [ ] Enable audit logging on Atlas
- [ ] Set up automated backups (daily)
- [ ] Configure alerts for slow queries > 100ms
