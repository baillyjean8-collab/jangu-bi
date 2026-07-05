// PM2 Ecosystem Configuration
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/
//
// Usage:
//   pm2 start ecosystem.config.cjs          # Start all apps
//   pm2 reload ecosystem.config.cjs         # Zero-downtime reload
//   pm2 logs jangu-bi-api                   # Tail logs
//   pm2 monit                               # Live dashboard
//   pm2 save && pm2 startup                 # Auto-start on server reboot

module.exports = {
  apps: [
    {
      // ── API Server ───────────────────────────────────────────────────────
      name: 'jangu-bi-api',
      script: './server.js',
      cwd: '/var/www/jangubi-server',

      // Cluster mode: one process per CPU core
      // IMPORTANT: Socket.io with clustering requires a Redis adapter
      // (socket.io-redis) to share state across workers.
      // For MVP single-server: use 'fork' mode (instances: 1).
      // For production multi-core: use 'cluster' + Redis adapter.
      exec_mode: 'fork',   // Change to 'cluster' when Redis adapter is added
      instances: 1,        // Change to 'max' for cluster mode

      // ── Environment ──────────────────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // All secrets come from system environment or secrets manager
        // NEVER put secrets in this file — it goes in version control
      },

      // ── Memory & Performance ──────────────────────────────────────────────
      max_memory_restart: '512M',   // Restart if Node leaks above 512 MB
      node_args: [
        '--max-old-space-size=400', // Heap limit below max_memory_restart
      ],

      // ── Restart Policy ────────────────────────────────────────────────────
      restart_delay: 3000,          // Wait 3s before restart (avoid tight loops)
      max_restarts: 10,             // Give up after 10 crashes in min_uptime window
      min_uptime: '10s',            // App must stay up 10s to count as successful start
      exp_backoff_restart_delay: 100, // Exponential backoff between restarts

      // ── Logging ───────────────────────────────────────────────────────────
      // Logs stored in /var/log/pm2/ (configure logrotate to avoid disk fill)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/jangu-bi-error.log',
      out_file:   '/var/log/pm2/jangu-bi-out.log',
      merge_logs: true,

      // ── Watch ─────────────────────────────────────────────────────────────
      // DISABLED in production — use pm2 reload for zero-downtime deploys
      watch: false,

      // ── Graceful Shutdown ─────────────────────────────────────────────────
      // PM2 sends SIGINT on reload — our server.js handles it cleanly
      kill_timeout: 5000,           // Give 5s for graceful shutdown before SIGKILL
      listen_timeout: 10000,        // Fail if app doesn't listen within 10s
    },
  ],
};
