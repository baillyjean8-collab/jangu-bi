'use strict';

/**
 * server.js — Application entry point
 *
 * Boot sequence:
 * 1. Load & validate environment variables
 * 2. Connect to MongoDB
 * 3. Create Express app
 * 4. Create HTTP server
 * 5. Initialize Socket.io on HTTP server
 * 6. Start listening
 * 7. Register process-level error handlers (last line of defence)
 */

// ── Step 1: Validate env first — fail before any imports that need secrets ─────
require('./src/config/env');

const http       = require('http');
const createApp  = require('./src/app');
const connectDB  = require('./src/config/database');
const { initRealtime } = require('./src/realtime');
const config     = require('./src/config/env');

// ─── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  // ── Step 2: Connect to MongoDB ────────────────────────────────────────────
  await connectDB();

  // ── Step 3: Create Express app ────────────────────────────────────────────
  const app = createApp();

  // ── Step 4: Create HTTP server (required for Socket.io) ───────────────────
  const httpServer = http.createServer(app);

  // ── Step 5: Initialize Socket.io ──────────────────────────────────────────
  const io = initRealtime(httpServer, config.client.url);

  // Make io available to req handlers if needed (e.g. admin broadcast)
  app.set('io', io);

  // ── Step 6: Start listening ────────────────────────────────────────────────
  const PORT = config.port || 5000;
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 JANGU BI server running`);
    console.log(`   ENV:  ${config.env}`);
    console.log(`   PORT: ${PORT}`);
    console.log(`   DB:   connected`);
    console.log(`   WS:   Socket.io ready\n`);
  });

  return { app, httpServer, io };
}

// ─── Process-level Error Handlers — Last Line of Defence ──────────────────────

/**
 * Unhandled promise rejections — async code that forgot to catch.
 * In Node 15+, this crashes the process by default. We log and exit cleanly.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    // Stack only in development
    ...(config?.isDevelopment && { stack: reason?.stack }),
  });
  // Give the server 1 second to finish in-flight requests, then exit
  setTimeout(() => process.exit(1), 1000);
});

/**
 * Uncaught synchronous exceptions — programmer errors.
 * These are always fatal — we cannot trust application state.
 */
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', {
    name: err.name,
    message: err.message,
    ...(config?.isDevelopment && { stack: err.stack }),
  });
  process.exit(1);
});

// ─── Start ─────────────────────────────────────────────────────────────────────

boot().catch((err) => {
  console.error('[FATAL] Boot sequence failed:', err.message);
  process.exit(1);
});
