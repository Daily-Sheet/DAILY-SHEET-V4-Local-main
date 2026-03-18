// Daily Sheet — PM2 Process Manager Config (VPS / Self-Hosted)
//
// Usage:
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save                   # persist across reboots
//   pm2 startup                # install startup hook
//   pm2 reload daily-sheet     # zero-downtime restart
//   pm2 logs daily-sheet       # tail logs

module.exports = {
  apps: [
    {
      name: "daily-sheet",
      script: "dist/index.cjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      // Restart on crash; do not restart on intentional stop
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      // Log files (PM2 default: ~/.pm2/logs/)
      error_file: "~/.pm2/logs/daily-sheet-error.log",
      out_file: "~/.pm2/logs/daily-sheet-out.log",
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
