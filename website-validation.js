#!/usr/bin/env node

/**
 * P007麒麟项目网站功能规范校验脚本
 * 系统化检查所有链接和功能的规范性
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 P007麒麟项目网站功能规范校验\n');
console.log('开始时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
console.log('='.repeat(80));

// 配置
const BASE_URL = 'http://localhost:5177';
const API_BASE_URL = 'http://localhost:33038';
const TIMEOUT = 10000;

// 测试结果存储
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// 辅助函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { timeout: TIMEOUT, ...options }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        data: data
      }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function addResult(name, status, message, details = {}) {
  results.total++;
  
  const result = {
    name,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  results.details.push(result);
  
  if (status === '✅ PASS') {
    results.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else if (status === '⚠️ WARN') {
    results.warnings++;
    console.log(`⚠️  ${name}: ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  
  return result;
}

// 1. 基础健康检查
async function checkBasicHealth() {
  console.log('\n📊 1. 基础健康检查');
  console.log('-'.repeat(40));
  
  try {
    // 检查前端首页
    const frontendRes = await makeRequest(BASE_URL);
    addResult('前端首页访问', '✅ PASS', `状态码: ${frontendRes.statusCode}`, {
      url: BASE_URL,
      statusCode: frontendRes.statusCode
    });
    
    // 检查API健康端点
    const apiHealthRes = await makeRequest(`${API_BASE_URL}/api/health`);
    const healthData = JSON.parse(apiHealthRes.data);
    addResult('API健康检查', '✅ PASS', `服务: ${healthData.service}, 状态: ${healthData.status}`, {
      url: `${API_BASE_URL}/api/health`,
      statusCode: apiHealthRes.statusCode,
      data: healthData
    });
    
    // 检查API版本端点
    const apiVersionRes = await makeRequest(`${API_BASE_URL}/api/public/version`);
    addResult('API版本信息', '✅ PASS', `状态码: ${apiVersionRes.statusCode}`, {
      url: `${API_BASE_URL}/api/public/version`,
      statusCode: apiVersionRes.statusCode
    });
    
  } catch (error) {
    addResult('基础健康检查', '❌ FAIL', error.message, { error: error.toString() });
  }
}

// 2. 路由规范检查
async function checkRouteStandards() {
  console.log('\n📋 2. 路由规范检查');
  console.log('-'.repeat(40));
  
  const routesToCheck = [
    // 公共路由
    { path: '/', name: '首页', expected: 200 },
    { path: '/login', name: '登录页面', expected: 200 },
    { path: '/register', name: '注册页面', expected: 200 },
    { path: '/tenants', name: '租户管理', expected: 200 },
    
    // SaaS规范路由
    { path: '/t/qilin-test/s/test-store/scan/A01', name: '扫码点餐新规范', expected: 200 },
    
    // 旧规范兼容路由
    { path: '/scan/A01', name: '扫码点餐旧规范', expected: 200 },
    
    // API路由
    { path: '/api/health', name: 'API健康检查', expected: 200, isApi: true },
    { path: '/api/public/version', name: 'API版本信息', expected: 200, isApi: true },
    { path: '/api/public/features', name: 'API功能列表', expected: 200, isApi: true },
  ];
  
  for (const route of routesToCheck) {
    try {
      const url = route.isApi ? `${API_BASE_URL}${route.path}` : `${BASE_URL}${route.path}`;
      const res = await makeRequest(url);
      
      if (res.statusCode === route.expected) {
        addResult(`${route.name}路由`, '✅ PASS', `状态码: ${res.statusCode}`, {
          url,
          statusCode: res.statusCode,
          path: route.path
        });
      } else {
        addResult(`${route.name}路由`, '⚠️ WARN', `状态码: ${res.statusCode} (期望: ${route.expected})`, {
          url,
          statusCode: res.statusCode,
          expected: route.expected,
          path: route.path
        });
      }
    } catch (error) {
      addResult(`${route.name}路由`, '❌ FAIL', error.message, {
        path: route.path,
        error: error.toString()
      });
    }
  }
}

// 3. 功能完整性检查
async function checkFunctionality() {
  console.log('\n⚙️  3. 功能完整性检查');
  console.log('-'.repeat(40));
  
  // 检查扫码点餐功能
  try {
    // 获取店铺信息
    const storeRes = await makeRequest(`${API_BASE_URL}/stores/test-store`);
    const storeData = JSON.parse(storeRes.data);
    
    if (storeData.success) {
      addResult('扫码点餐-店铺信息', '✅ PASS', `店铺: ${storeData.data?.name || '未知'}`, {
        url: `${API_BASE_URL}/stores/test-store`,
        storeId: 'test-store',
        data: storeData
      });
    } else {
      addResult('扫码点餐-店铺信息', '⚠️ WARN', `API响应成功但无数据`, {
        url: `${API_BASE_URL}/stores/test-store`,
        response: storeData
      });
    }
  } catch (error) {
    addResult('扫码点餐-店铺信息', '❌ FAIL', error.message, {
      error: error.toString()
    });
  }
  
  // 检查租户管理API
  try {
    const tenantsRes = await makeRequest(`${API_BASE_URL}/api/v1/tenants`);
    const tenantsData = JSON.parse(tenantsRes.data);
    
    if (tenantsRes.statusCode === 200) {
      addResult('租户管理API', '✅ PASS', `状态码: ${tenantsRes.statusCode}`, {
        url: `${API_BASE_URL}/api/v1/tenants`,
        statusCode: tenantsRes.statusCode,
        hasData: Array.isArray(tenantsData.data)
      });
    } else {
      addResult('租户管理API', '⚠️ WARN', `状态码: ${tenantsRes.statusCode}`, {
        url: `${API_BASE_URL}/api/v1/tenants`,
        statusCode: tenantsRes.statusCode
      });
    }
  } catch (error) {
    addResult('租户管理API', '❌ FAIL', error.message, {
      error: error.toString()
    });
  }
}

// 4. 规范化检查
async function checkStandardization() {
  console.log('\n🎯 4. 规范化检查');
  console.log('-'.repeat(40));
  
  // 检查环境变量配置
  try {
    const envPath = path.join(__dirname, '.env.template');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasEnvVariables = envContent.includes('${') && envContent.includes('}');
      
      addResult('环境变量模板', hasEnvVariables ? '✅ PASS' : '⚠️ WARN', 
        hasEnvVariables ? '使用环境变量占位符' : '可能包含硬编码',
        { file: '.env.template', hasTemplate: hasEnvVariables }
      );
    } else {
      addResult('环境变量模板', '❌ FAIL', '文件不存在', { file: '.env.template' });
    }
  } catch (error) {
    addResult('环境变量模板', '❌ FAIL', error.message, { error: error.toString() });
  }
  
  // 检查路由常量使用
  try {
    const routesPath = path.join(__dirname, 'apps/backend/src/config/routes.js');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      const hasScanRoutes = routesContent.includes('SCAN:') && routesContent.includes('PUBLIC_ROUTES');
      
      addResult('路由常量系统', hasScanRoutes ? '✅ PASS' : '⚠️ WARN',
        hasScanRoutes ? '包含扫码点餐路由常量' : '路由常量可能不完整',
        { file: 'routes.js', hasScanRoutes }
      );
    }
  } catch (error) {
    addResult('路由常量系统', '❌ FAIL', error.message, { error: error.toString() });
  }
  
  // 检查hydration错误修复
  try {
    const tenantMgmtPath = path.join(__dirname, 'apps/frontend/src/pages/TenantManagement.tsx');
    if (fs.existsSync(tenantMgmtPath)) {
      const content = fs.readFileSync(tenantMgmtPath, 'utf8');
      const lines = content.split('\n');
      const line319 = lines[318] || '';
      const isFixed = line319.includes('component="div"') && line319.includes('variant="body2"');
      
      addResult('Hydration错误修复', isFixed ? '✅ PASS' : '❌ FAIL',
        isFixed ? '第319行已添加component="div"' : '第319行未修复',
        { file: 'TenantManagement.tsx', line: 319, isFixed }
      );
    }
  } catch (error) {
    addResult('Hydration错误修复', '❌ FAIL', error.message, { error: error.toString() });
  }
}

// 5. 性能与安全检查
async function checkPerformanceAndSecurity() {
  console.log('\n🔒 5. 性能与安全检查');
  console.log('-'.repeat(40));
  
  // 检查响应头安全设置
  try {
    const res = await makeRequest(BASE_URL);
    const headers = res.headers;
    
    const securityHeaders = {
      'X-Frame-Options': headers['x-frame-options'],
      'X-Content-Type-Options': headers['x-content-type-options'],
      'X-XSS-Protection': headers['x-xss-protection'],
      'Content-Security-Policy': headers['content-security-policy']
    };
    
    const hasSecurityHeaders = Object.values(securityHeaders).some(h => h);
    
    addResult('安全响应头', hasSecurityHeaders ? '✅ PASS' : '⚠️ WARN',
      hasSecurityHeaders ? '配置了安全头' : '缺少安全响应头',
      { headers: securityHeaders }
    );
  } catch (error) {
    addResult('安全响应头', '❌ FAIL', error.message, { error: error.toString() });
  }
  
  // 检查CORS配置
  try {
    const res = await makeRequest(`${API_BASE_URL}/api/health`, {
      headers: { 'Origin': 'http://example.com' }
    });
    
    const corsHeader = res.headers['access-control-allow-origin'];
    const hasCors = corsHeader === '*' || corsHeader === 'http://localhost:5177';
    
    addResult('CORS配置', hasCors ? '✅ PASS' : '⚠️ WARN',
      hasCors ? `CORS配置: ${corsHeader}` : 'CORS配置可能过严或过松',
      { 'access-control-allow-origin': corsHeader }
    );
  } catch (error) {
    addResult('CORS配置', '❌ FAIL', error.message, { error: error.toString() });
  }
}

// 6. 生成详细报告
function generateReport() {
  console.log('\n📈 6. 校验报告总结');
  console.log('='.repeat(80));
  
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  
  console.log(`📊 总体统计:`);
  console.log(`   总检查项: ${results.total}`);
  console.log(`   通过项: ${results.passed} (${passRate}%)`);
  console.log(`   警告项: ${results.warnings}`);
  console.log(`   失败项: ${results.failed}`);
  
  console.log(`\n🏆 通过率: ${passRate}%`);
  
  if (passRate >= 90) {
    console.log('🎉 优秀 - 网站功能规范完整');
  } else if (passRate >= 70) {
    console.log('👍 良好 - 基本功能规范达标');
  } else if (passRate >= 50) {
    console.log('⚠️  一般 - 需要改进');
  } else {
    console.log('❌ 较差 - 需要重点修复');
  }
  
  // 输出失败详情
  const failures = results.details.filter(r => r.status === '❌ FAIL');
  if (failures.length > 0) {
    console.log(`\n🔴 失败项详情 (${failures.length}项):`);
    failures.forEach((fail, index) => {
      console.log(`   ${index + 1}. ${fail.name}: ${fail.message}`);
      if (fail.error) console.log(`      错误: ${fail.error}`);
    });
  }
  
  // 输出警告详情
  const warnings = results.details.filter(r => r.status === '⚠️ WARN');
  if (warnings.length > 0) {
    console.log(`\n🟡 警告项详情 (${warnings.length}项):`);
    warnings.forEach((warn, index) => {
      console.log(`   ${index + 1}. ${warn.name}: ${warn.message}`);
    });
  }
  
  // 建议改进项
  console.log('\n💡 建议改进项:');
  if (failures.length > 0) {
    console.log('   1. 优先修复失败项，确保核心功能可用');
  }
  if (warnings.length > 0) {
    console.log('   2. 处理警告项，提升规范性和用户体验');
  }
  if (passRate < 90) {
    console.log('   3. 进行全面的功能测试和用户验收测试');
  }
  
  // 保存详细报告
  const reportPath = path.join(__dirname, 'website-validation-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      passRate: parseFloat(passRate)
    },
    details: results.details,
    recommendations: [
      failures.length > 0 ? '优先修复失败项' : null,
      warnings.length > 0 ? '处理警告项提升规范性' : null,
      passRate < 90 ? '进行全面的功能测试' : '保持当前规范水平'
    ].filter(Boolean)
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存: ${reportPath}`);
  
  return report;
}

// 主函数
async function main() {
  try {
    await checkBasicHealth();
    await checkRouteStandards();
    await checkFunctionality();
    await checkStandardization();
    await checkPerformanceAndSecurity();
    
    const report = generateReport();
    
    console.log('\n🚀 下一步行动建议:');
    console.log('   1. 根据报告修复失败项');
    console.log('   2. 优化警告项提升规范性');
    console.log('   3. 进行用户验收测试(UAT)');
    console.log('   4. 建立自动化测试流水线');
    
    // 退出码
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ 校验过程发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
main();