module.exports = {
  apps: [
    {
      name: 'jangu-bi-api',
      script: 'server.js',

      // ── Cluster mode ──────────────────────────────────────────────────────
      // 'max' uses all available CPU cores. On this machine (4 cores) that
      // means 4 worker processes, each handling requests independently.
      // Override with a fixed number (e.g. 2) if you want to leave CPU
      // headroom for other processes on the same machine.
      instances: 'max',
      exec_mode: 'cluster',

      // ── Environment ───────────────────────────────────────────────────────
      // PM2 loads .env itself only if you use `pm2 start --env production`
      // with matching env_production block, OR if dotenv is required inside
      // server.js (which it already is, via `-r dotenv/config` in npm scripts).
      // We replicate that here so `pm2 start ecosystem.config.js` works the
      // same way without needing the npm script wrapper.
      node_args: '-r dotenv/config',

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // ── Stability ──────────────────────────────────────────────────────────
      // Restart on crash, but stop trying if it crashes too fast too often
      // (likely a real bug, not a transient failure — avoid infinite restart loop).
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Restart if a single worker's memory grows unbounded (leak protection).
      max_memory_restart: '500M',

      // ── Logs ───────────────────────────────────────────────────────────────
      // Merge logs from all cluster workers into single files instead of
      // creating per-instance log files (easier to read, ship to a log
      // aggregator later if needed).
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',

      // ── Graceful reload ──────────────────────────────────────────────────
      // On `pm2 reload`, PM2 starts new workers and only kills old ones once
      // new ones are ready — zero-downtime deploys. Give in-flight requests
      // time to finish before a worker is force-killed.
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
};
