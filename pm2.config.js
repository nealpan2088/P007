// PM2配置文件 - 麒麟项目 v2（稳定版）
// 用于管理前后端服务器的进程

module.exports = {
  apps: [
    // 后端服务器
    {
      name: 'qilin-backend',
      script: 'npm',
      args: 'run start',
      cwd: './apps/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 33038,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/qilin_dev',
        JWT_SECRET: 'qilin-jwt-secret-key-2026-change-in-production',
        API_PREFIX: '/api',
        SYSTEM_MODE: 'multi',
        NODE_OPTIONS: '--max-old-space-size=512'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 33038,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/qilin_prod',
        JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
        API_PREFIX: '/api',
        SYSTEM_MODE: 'multi',
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 重启策略（PM2免费版自动重启，语法错误会自动重试）
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
      kill_timeout: 5000,
      listen_timeout: 5000
    },

    // 前端开发服务器
    {
      name: 'qilin-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './apps/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 5177,
        VITE_API_BASE_URL: 'http://localhost:33038/api',
        VITE_APP_NAME: '麒麟云点餐',
        VITE_APP_VERSION: '0.2.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5177,
        VITE_API_BASE_URL: 'https://api.qilin.com/api',
        VITE_APP_NAME: '麒麟云点餐',
        VITE_APP_VERSION: '0.2.1'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
      kill_timeout: 5000,
      listen_timeout: 10000
    }
  ]
};
