#!/usr/bin/env node

/**
 * SaaS多租户路径规范验证脚本
 * 确保所有路径符合新规范: /t/{tenantSlug}/s/{storeSlug}/scan/{tableId}
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 规范定义
const SPEC = {
  // 扫码点餐新规范路径模式
  SCAN_NEW_FORMAT_PATTERN: /^\/t\/[^\/]+\/s\/[^\/]+\/scan\/[^\/]+$/,
  
  // 扫码点餐旧规范路径模式 (兼容性)
  SCAN_LEGACY_FORMAT_PATTERN: /^\/scan\/[^\/]+(\/[^\/]+)?$/,
  
  // 其他租户公共路由模式 (允许)
  OTHER_TENANT_PATTERNS: [
    /^\/t\/[^\/]+\/home$/,
    /^\/t\/[^\/]+\/menu$/,
    /^\/t\/[^\/]+\/order\/[^\/]+$/,
    /^\/t\/[^\/]+\/order-status\/[^\/]+$/
  ],
  
  // 禁止的硬编码路径
  FORBIDDEN_PATHS: [
    '/scan/test-store/A01',      // 应该使用常量
    '/scan/demo-shop/B02',       // 应该使用常量
    '/t/qilin-test/s/test-store/scan/A01',  // 应该使用常量
    '/t/phoenix-demo/s/demo-shop/scan/B02' // 应该使用常量
  ],
  
  // 必须使用的新规范常量
  REQUIRED_CONSTANTS: [
    'SCAN_ROUTES',
    'getTestScanUrl',
    'getDemoScanUrl',
    'buildScanUrl'
  ],
  
  // 允许的旧规范常量 (兼容性)
  ALLOWED_LEGACY_CONSTANTS: [
    'getLegacyTestScanUrl',
    'getLegacyDemoScanUrl',
    'buildLegacyScanUrl'
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
  
  // 检查是否使用了新规范常量
  const usesNewConstants = SPEC.REQUIRED_CONSTANTS.some(constant => 
    content.includes(constant)
  );
  
  if (!usesNewConstants && filePath !== 'src/config/scan-routes.ts') {
    results.issues.push({
      file: filePath,
      type: 'WARNING',
      message: '未使用新规范路由常量'
    });
    results.warnings++;
  }
  
  // 检查路由模式
  lines.forEach((line, index) => {
    // 查找类似 "/t/xxx/s/xxx/scan/xxx" 的路径 (扫码点餐新规范)
    const scanNewMatches = line.match(/["'](\/t\/[^"']+\/s\/[^"']+\/scan\/[^"']+)["']/g);
    if (scanNewMatches) {
      scanNewMatches.forEach(match => {
        const route = match.replace(/["']/g, '');
        if (!SPEC.SCAN_NEW_FORMAT_PATTERN.test(route)) {
          results.issues.push({
            file: filePath,
            line: index + 1,
            type: 'WARNING',
            message: `非标准扫码点餐新规范路径格式: ${route}`
          });
          results.warnings++;
        }
      });
    }
    
    // 查找类似 "/scan/xxx/xxx" 的路径 (扫码点餐旧规范)
    const scanLegacyMatches = line.match(/["'](\/scan\/[^"']+)["']/g);
    if (scanLegacyMatches) {
      scanLegacyMatches.forEach(match => {
        const route = match.replace(/["']/g, '');
        if (!SPEC.SCAN_LEGACY_FORMAT_PATTERN.test(route)) {
          results.issues.push({
            file: filePath,
            line: index + 1,
            type: 'WARNING',
            message: `非标准扫码点餐旧规范路径格式: ${route}`
          });
          results.warnings++;
        }
      });
    }
    
    // 查找其他租户公共路由 (允许)
    const otherTenantMatches = line.match(/["'](\/t\/[^"']+\/(?:home|menu|order|order-status)[^"']*)["']/g);
    if (otherTenantMatches) {
      otherTenantMatches.forEach(match => {
        const route = match.replace(/["']/g, '');
        const isValidOther = SPEC.OTHER_TENANT_PATTERNS.some(pattern => pattern.test(route));
        if (!isValidOther) {
          results.issues.push({
            file: filePath,
            line: index + 1,
            type: 'INFO',
            message: `其他租户公共路由: ${route} (允许)`
          });
        }
      });
    }
  });
  
  results.passed++;
}

/**
 * 验证路由常量配置
 */
function validateRouteConstants() {
  console.log('🔍 验证路由常量配置...');
  
  try {
    // 动态导入路由常量
    const scanRoutesPath = path.join(process.cwd(), 'src/config/scan-routes.ts');
    const content = fs.readFileSync(scanRoutesPath, 'utf8');
    
    // 检查新规范配置
    const hasNewFormat = content.includes('SCAN_ORDER: \'/t/:tenantSlug/s/:storeSlug/scan/:tableId\'');
    const hasTenantStore = content.includes('TENANT_STORE: \'/t/:tenantSlug/s/:storeSlug\'');
    const hasTenantOnly = content.includes('TENANT_ONLY: \'/t/:tenantSlug\'');
    
    if (!hasNewFormat || !hasTenantStore || !hasTenantOnly) {
      results.issues.push({
        file: 'src/config/scan-routes.ts',
        type: 'ERROR',
        message: '新规范路由常量配置不完整'
      });
      results.failed++;
    }
    
    // 检查测试数据
    const hasTestTenant = content.includes('TENANT: {');
    const hasTestStore = content.includes('STORE: {');
    const hasTestTable = content.includes('TABLE: {');
    
    if (!hasTestTenant || !hasTestStore || !hasTestTable) {
      results.issues.push({
        file: 'src/config/scan-routes.ts',
        type: 'WARNING',
        message: '测试数据配置不完整'
      });
      results.warnings++;
    }
    
    console.log('✅ 路由常量配置验证完成');
  } catch (error) {
    results.issues.push({
      file: 'src/config/scan-routes.ts',
      type: 'ERROR',
      message: `路由常量文件读取失败: ${error.message}`
    });
    results.failed++;
  }
}

/**
 * 运行验证
 */
function runValidation() {
  console.log('🔍 开始验证SaaS多租户路径规范...\n');
  
  // 验证路由常量配置
  validateRouteConstants();
  
  // 检查所有文件
  FILES_TO_CHECK.forEach(checkFile);
  
  // 输出结果
  console.log('\n📊 验证结果:');
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
  console.log('1. 新规范路径格式: /t/{tenantSlug}/s/{storeSlug}/scan/{tableId}');
  console.log('2. 必须使用 src/config/scan-routes.ts 中的常量');
  console.log('3. 禁止硬编码测试路径');
  console.log('4. 旧规范保持兼容性，但新代码应使用新规范');
  
  console.log('\n🎯 新规范示例:');
  console.log('  /t/qilin-test/s/test-store/scan/A01');
  console.log('  /t/phoenix-demo/s/demo-shop/scan/B02');
  
  console.log('\n🔄 旧规范示例 (兼容性):');
  console.log('  /scan/test-store/A01');
  console.log('  /scan/demo-shop/B02');
  
  if (results.failed > 0) {
    console.log('\n🚨 验证失败！请修复上述问题。');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n📝 验证通过，但有警告需要关注。');
  } else {
    console.log('\n🎉 所有检查通过！SaaS多租户路径符合规范。');
  }
}

// 运行验证
runValidation();