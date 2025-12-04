/**
 * PM2 ECOSYSTEM CONFIG - PRODUCTION
 * Deploy: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'omnora-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000
    },
    {
      name: 'omnora-cron',
      script: './backend/cron/dailyTasks.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/cron-error.log',
      out_file: './logs/cron-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'api.omnora.com',
      key: '~/.ssh/id_rsa',
      ref: 'origin/main',
      repo: 'git@github.com:omnora/ecommerce.git',
      path: '/var/www/omnora',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production"'
    }
  }
};
