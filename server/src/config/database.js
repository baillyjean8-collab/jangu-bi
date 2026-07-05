/**
 * Database Configuration — Security-hardened
 *
 * Fixes applied:
 * VULN-031: mongoose.set('debug') now ONLY logs query shape (collection + method),
 *   never query filter values which may contain user data or sensitive fields.
 *   Debug is explicitly disabled when NODE_ENV is not 'development'.
 *
 * VULN-032: SIGINT/SIGTERM handlers registered ONCE at module load (outside connectDB),
 *   preventing handler stacking when connectDB is called multiple times.
 *
 * VULN-033: Read preference configuration added. Secondary reads for
 *   analytics/reporting workloads, primary for financial/auth writes.
 */

'use strict';

const mongoose = require('mongoose');

// ─── Configuration ────────────────────────────────────────────────────────────

const DB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  compressors: ['zstd', 'zlib'],
  // VULN-033 FIX: default read preference for general queries
  // Financial and auth operations override this at query level with readPreference: 'primary'
  readPreference: 'primaryPreferred',
  // Majority write concern for all writes — ensures durability across replica set
  w: 'majority',
  // Journal writes acknowledged for financial safety
  j: true,
};

// ─── VULN-032 FIX: Graceful shutdown — registered ONCE at module load ─────────

let shutdownRegistered = false;

function registerShutdownHandlers() {
  if (shutdownRegistered) return;
  shutdownRegistered = true;

  async function shutdown(signal) {
    console.log(`\n📦 Received ${signal}. Closing MongoDB connection...`);
    try {
      await mongoose.connection.close(false); // false = don't force close
      console.log('📦 MongoDB connection closed gracefully');
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err.message);
    } finally {
      process.exit(0);
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Register shutdown handlers immediately at module load (not inside connectDB)
registerShutdownHandlers();

// ─── VULN-031 FIX: Safe debug logging ─────────────────────────────────────────

/**
 * NEVER log query filter values — they may contain:
 *   - User emails, phone numbers (PII)
 *   - Hashed passwords or OTPs
 *   - Payment metadata
 * Log only collection name and operation type for query shape analysis.
 */
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method) => {
    // Intentionally omitting query and doc parameters — never log filter values
    console.log(`🔍 Mongoose: ${collectionName}.${method}()`);
  });
} else {
  // Explicitly disable debug in all non-development environments
  mongoose.set('debug', false);
}

// Disable buffering in production — fail fast if connection is lost
if (process.env.NODE_ENV === 'production') {
  mongoose.set('bufferCommands', false);
}

// ─── Connection State ─────────────────────────────────────────────────────────

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;

// ─── Connect ──────────────────────────────────────────────────────────────────

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('CRITICAL: MONGODB_URI environment variable is not set');
  }

  // Basic URI validation — prevent logging the full URI (may contain credentials)
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI has invalid format');
  }

  try {
    connectionAttempts += 1;
    const conn = await mongoose.connect(uri, DB_OPTIONS);
    isConnected = true;
    connectionAttempts = 0;

    // Log host only — never log the full URI (contains credentials)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🔒 Write concern: majority, journaled`);

    // ── Connection event handlers ─────────────────────────────────────────
    mongoose.connection.on('error', (err) => {
      // Log error type only — not full message which may contain URI/credentials
      console.error(`❌ MongoDB error: ${err.name || 'UnknownError'}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

  } catch (err) {
    isConnected = false;
    // Log error type + code, NOT message (may contain URI with credentials)
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}): ${err.name}`);

    if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
      console.error('❌ Max connection attempts reached. Shutting down.');
      process.exit(1);
    }

    // Exponential backoff before retry
    const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
    console.log(`⏳ Retrying in ${delay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectDB(); // Recursive retry
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = connectDB;

/**
 * Read preference guide for service layer:
 *
 * Financial queries (donations, webhooks, idempotency checks):
 *   .read('primary') — always read from primary for consistency
 *
 * Analytics / admin dashboard:
 *   .read('secondaryPreferred') — can use secondary replica
 *
 * Live viewer counts (eventual consistency acceptable):
 *   .read('nearest') — lowest latency
 *
 * Example usage in repository:
 *   Donation.findById(id).read('primary')
 *   AuditLog.find(filter).read('secondaryPreferred')
 */
