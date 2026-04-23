#!/usr/bin/env node
/**
 * 测试JWT验证端点
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

// 测试不同的JWT Secret
const secrets = [
  'qilin-development-jwt-secret-minimum-32-characters-here',
  '"qilin-development-jwt-secret-minimum-32-characters-here"',
  'different-secret',
  'qilin-development-jwt-secret',
  'development-jwt-secret'
];

const tokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdC1hZG1pbiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsInRlbmFudElkIjoxLCJpYXQiOjE3NzY5MjYzMjcsImV4cCI6MTc3NzUzMTEyN30.gqH1zc0Qhb-cXP6hAa90mVTRQJa-FYOCYtur7qFiyzU',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdC1hZG1pbiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsInRlbmFudElkIjoxLCJpYXQiOjE3NzY5MjYyMzIsImV4cCI6MTc3NzUzMTAzMn0.1qq0rbf6OEbFlmh_UmCYIWJZ-SVS1Bh299D_d-Y2-SA'
];

console.log('🔍 测试JWT验证...\n');

for (const token of tokens) {
  console.log(`测试Token: ${token.substring(0, 50)}...`);
  
  let verified = false;
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      console.log(`  ✅ 使用secret "${secret.substring(0, 20)}..." 验证成功`);
      console.log(`     解码内容:`, decoded);
      verified = true;
      break;
    } catch (error) {
      // 忽略验证失败
    }
  }
  
  if (!verified) {
    console.log(`  ❌ 所有secret都验证失败`);
  }
  console.log('');
}

// 测试服务器配置
console.log('🔧 检查服务器配置...');
try {
  const config = require('./apps/backend/src/config/index.js').default;
  console.log('服务器JWT Secret:', config.auth.jwtSecret ? '已设置' : '未设置');
  console.log('Secret长度:', config.auth.jwtSecret?.length);
  console.log('Secret前20字符:', config.auth.jwtSecret?.substring(0, 20));
} catch (error) {
  console.log('无法读取配置:', error.message);
}