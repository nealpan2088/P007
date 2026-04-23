// PM2配置文件 - 麒麟项目（规范化版本）
// 使用环境变量，禁止硬编码

module.exports = {
  apps: [
    // 后端服务器
    {
      name: 'qilin-backend',
      script: './apps/backend/src/index.js',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.API_PORT || 33037,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qilin_dev',
        JWT_SECRET: process.env.JWT_SECRET || 'qilin-jwt-secret-key-2026-change-in-production',
        API_PREFIX: process.env.API_PREFIX || '/api',
        SYSTEM_MODE: process.env.SYSTEM_MODE || 'multi',
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=512'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.API_PORT || 33037,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qilin_prod',
        JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
        API_PREFIX: process.env.API_PREFIX || '/api',
        SYSTEM_MODE: process.env.SYSTEM_MODE || 'multi',
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=1024'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 健康检查 - 使用环境变量
      healthcheck: {
        url: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api/health` : 'http://localhost:33037/api/health',
        interval: 30000,
        timeout: 5000,
        retries: 3
      },
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
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
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.FRONTEND_PORT || 5177,
        VITE_API_BASE_URL: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'http://localhost:33037/api',
        VITE_APP_NAME: process.env.APP_NAME || '麒麟云点餐',
        VITE_APP_VERSION: process.env.APP_VERSION || '0.2.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.FRONTEND_PORT || 5177,
        VITE_API_BASE_URL: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'https://api.qilin.com/api',
        VITE_APP_NAME: process.env.APP_NAME || '麒麟云点餐',
        VITE_APP_VERSION: process.env.APP_VERSION || '0.2.1'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 健康检查 - 使用环境变量
      healthcheck: {
        url: process.env.FRONTEND_URL || 'http://localhost:5177',
        interval: 30000,
        timeout: 5000,
        retries: 3
      },
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: process.env.DEPLOY_USER || 'admin',
      host: process.env.DEPLOY_HOST || 'localhost',
      ref: process.env.DEPLOY_REF || 'origin/main',
      repo: process.env.DEPLOY_REPO || 'git@github.com:nealpan2088/P007.git',
      path: process.env.DEPLOY_PATH || '/home/admin/projects/P007',
      'post-deploy': process.env.DEPLOY_POST_DEPLOY || 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};