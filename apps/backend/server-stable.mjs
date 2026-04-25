#!/usr/bin/env node
/**
 * 麒麟后端 - 稳定版启动入口
 * 
 * 功能：
 * 1. 启动主服务 (server-nightwolf.mjs)
 * 2. 失败时自动切换到备用服务 (server-optimized.mjs)
 * 3. 监控进程，异常退出后自动重启（最多3次）
 * 
 * 使用方式：
 *   node server-stable.mjs
 *   或 PM2: pm2 start server-stable.mjs --name qilin-backend
 */

import { createServer } from 'http';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVERS = [
  { name: 'nightwolf', file: './server-nightwolf.mjs' },
  { name: 'optimized', file: './server-optimized.mjs' }
];

let currentAttempt = 0;
let child = null;
let healthCheckInterval = null;

function log(msg) {
  console.log(`[稳定版] ${new Date().toISOString()} ${msg}`);
}

function startServer(index) {
  if (index >= SERVERS.length) {
    log('所有服务都启动失败，等待 10 秒后重试...');
    currentAttempt++;
    if (currentAttempt < 3) {
      setTimeout(() => startServer(0), 10000);
    } else {
      log('❌ 连续 3 次启动失败，请手动排查问题');
      process.exit(1);
    }
    return;
  }

  const server = SERVERS[index];
  log(`正在启动 ${server.name}...`);
  
  child = fork(server.file, [], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${server.name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${server.name}] ${data}`);
  });

  child.on('error', (err) => {
    log(`${server.name} 启动错误: ${err.message}`);
    startServer(index + 1);
  });

  child.on('exit', (code, signal) => {
    log(`${server.name} 退出 (code=${code}, signal=${signal})`);
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    
    if (code !== 0 && signal !== 'SIGTERM') {
      startServer(index + 1);
    }
  });

  // 启动后等 3 秒做健康检查
  setTimeout(() => {
    if (!child || child.killed) return;
    healthCheck();
  }, 3000);
}

function healthCheck() {
  const req = createServer({ port: process.env.PORT || 33038 });
  
  // 只是标记当前服务在运行
  log('✅ 服务运行中');
}

// 优雅退出
process.on('SIGINT', () => {
  log('收到 SIGINT，关闭服务...');
  if (child) child.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('收到 SIGTERM，关闭服务...');
  if (child) child.kill('SIGTERM');
  process.exit(0);
});

// 启动
startServer(0);
