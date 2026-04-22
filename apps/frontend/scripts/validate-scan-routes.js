#!/usr/bin/env node

/**
 * 扫码点餐路由规范验证脚本
 * 确保所有扫码点餐相关代码符合规范
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 规范定义
const SPEC = {
  // 路由格式规范
  ROUTE_PATTERN: /^\/scan\/[^\/]+(\/[^\/]+)?$/,
  
  // API端点规范
  API_PATTERNS: [
    /^\/api\/public\/stores\/[^\/]+$/,
    /^\/api\/public\/stores\/[^\/]+\/menu$/,
    /^\/api\/public\/stores\/[^\/]+\/tables\/[^\/]+$/,
    /^\/api\/public\/orders$/,
    /^\/api\/public\/orders\/[^\/]+\/status$/
  ],
  
  // 禁止的硬编码路径
  FORBIDDEN_PATHS: [
    '/scan/test-store/A01',  // 应该使用常量
    '/scan/demo-shop/B02'    // 应该使用常量
  ]
};

// 要检查的文件
const FILES_TO_CHECK = [
  'src/App.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/scan-order/index.tsx',
  'src/pages/scan-order/utils/api.utils.ts',
  'src/config/routes.ts'
];

// 检查结果
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

/**
 * 检查文件是否符合规范
 */
function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.issues.push({
      file: filePath,
      type: 'ERROR',
      message: '文件不存在'
    });
    results.failed++;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  // 检查硬编码路径
  SPEC.FORBIDDEN_PATHS.forEach(forbiddenPath => {
    lines.forEach((line, index) => {
      if (line.includes(forbiddenPath) && !line.includes('//')) {
        results.issues.push({
          file: filePath,
          line: index + 1,
          type: 'ERROR',
          message: `发现硬编码路径: ${forbiddenPath}`
        });
        results.failed++;
      }
    });
  });
  
  // 检查路由模式
  lines.forEach((line, index) => {
    // 查找类似 "/scan/xxx/xxx" 的路径
    const routeMatches = line.match(/["'](\/scan\/[^"']+)["']/g);
    if (routeMatches) {
      routeMatches.forEach(match => {
        const route = match.replace(/["']/g, '');
        if (!SPEC.ROUTE_PATTERN.test(route)) {
          results.issues.push({
            file: filePath,
            line: index + 1,
            type: 'WARNING',
            message: `非标准路由格式: ${route}`
          });
          results.warnings++;
        }
      });
    }
    
    // 检查API端点
    const apiMatches = line.match(/["'](\/api\/public\/[^"']+)["']/g);
    if (apiMatches) {
      apiMatches.forEach(match => {
        const apiPath = match.replace(/["']/g, '');
        const isValid = SPEC.API_PATTERNS.some(pattern => pattern.test(apiPath));
        if (!isValid) {
          results.issues.push({
            file: filePath,
            line: index + 1,
            type: 'WARNING',
            message: `非标准API端点: ${apiPath}`
          });
          results.warnings++;
        }
      });
    }
  });
  
  // 检查是否使用了路由常量
  const usesConstants = content.includes('SCAN_ROUTES') || content.includes('scan-routes');
  if (!usesConstants && filePath !== 'src/config/scan-routes.ts') {
    results.issues.push({
      file: filePath,
      type: 'WARNING',
      message: '未使用扫码点餐路由常量'
    });
    results.warnings++;
  }
  
  results.passed++;
}

/**
 * 运行验证
 */
function runValidation() {
  console.log('🔍 开始验证扫码点餐路由规范...\n');
  
  FILES_TO_CHECK.forEach(checkFile);
  
  // 输出结果
  console.log('📊 验证结果:');
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`⚠️  警告: ${results.warnings}`);
  
  if (results.issues.length > 0) {
    console.log('\n📋 发现的问题:');
    results.issues.forEach((issue, index) => {
      const prefix = issue.type === 'ERROR' ? '❌' : '⚠️';
      console.log(`${prefix} ${issue.file}:${issue.line || ''} - ${issue.message}`);
    });
  }
  
  console.log('\n📝 规范要求:');
  console.log('1. 路由格式: /scan/:storeId/:tableId');
  console.log('2. 必须使用 src/config/scan-routes.ts 中的常量');
  console.log('3. 禁止硬编码测试路径');
  console.log('4. API端点必须符合规范');
  
  if (results.failed > 0) {
    console.log('\n🚨 验证失败！请修复上述问题。');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n📝 验证通过，但有警告需要关注。');
  } else {
    console.log('\n🎉 所有检查通过！扫码点餐路由符合规范。');
  }
}

// 运行验证
runValidation();