#!/usr/bin/env node
/**
 * 生成测试JWT Token
 */

import jwt from 'jsonwebtoken';

// 使用环境变量中的JWT Secret
const JWT_SECRET = "qilin-development-jwt-secret-minimum-32-characters-here";

// 创建测试用户数据
const testUser = {
  id: 1,
  username: 'test-admin',
  email: 'test@example.com',
  role: 'admin',
  tenantId: 1
};

// 生成Token
const token = jwt.sign(
  {
    userId: testUser.id,
    username: testUser.username,
    email: testUser.email,
    role: testUser.role,
    tenantId: testUser.tenantId
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('🔐 生成的测试JWT Token:');
console.log(token);
console.log('\n📋 Token信息:');
console.log(`用户ID: ${testUser.id}`);
console.log(`用户名: ${testUser.username}`);
console.log(`角色: ${testUser.role}`);
console.log(`租户ID: ${testUser.tenantId}`);
console.log(`有效期: 7天`);

console.log('\n🚀 使用示例:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:33038/api/tenant/list`);

// 验证Token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token验证成功:');
  console.log(decoded);
} catch (error) {
  console.log('\n❌ Token验证失败:', error.message);
}