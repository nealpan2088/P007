// 麒麟项目后端 - 开发 PM2 配置（单实例、端口 33039）
module.exports = {
  apps: [{
    name: 'qilin-backend-dev',
    script: 'server-nightwolf.mjs',
    cwd: __dirname,
    exec_mode: 'fork',
    instances: 1,
    watch: ['src', 'server-optimized.mjs', 'server-nightwolf.mjs', 'server-optimized-tail.mjs'],
    ignore_watch: ['node_modules', 'logs', '.git', 'prisma'],
    watch_delay: 1000,
    max_memory_restart: '512M',

    env: {
      NODE_ENV: 'development',
      PORT: 33039,
    },

    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/backend-dev-error.log',
    out_file: './logs/backend-dev-out.log',
    merge_logs: true,

    max_restarts: 5,
    restart_delay: 3000,
    min_uptime: 5000,
  }]
};
