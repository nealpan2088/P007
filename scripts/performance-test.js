#!/usr/bin/env node

/**
 * 麒麟项目 - 中间件性能测试脚本
 * 测试统一中间件的性能影响
 */

import http from 'http';
import { performance } from 'perf_hooks';

const API_BASE_URL = 'http://localhost:33037';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW84YmNwYTAwMDAwMTB2N2c4YWducTY1IiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc2Nzg2NTgxLCJleHAiOjE3NzczOTEzODF9.G0hVtXczsZaWI91CTM2-fn7eqSF6J_mICk6lNIkQWb0';
const TENANT_ID = 'cmo8c30sp0009gfqikv2ztz44';

// 测试配置
const CONFIG = {
  iterations: 10, // 每次测试的迭代次数
  concurrency: 5, // 并发请求数
  endpoints: [
    {
      name: '健康检查 (无认证)',
      path: '/api/health',
      method: 'GET',
      headers: {},
      expectedStatus: 200
    },
    {
      name: '店铺列表 (有认证)',
      path: '/api/v1/stores',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'X-Tenant-ID': TENANT_ID
      },
      expectedStatus: 200
    },
    {
      name: '租户列表 (有认证)',
      path: '/api/v1/tenants',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      expectedStatus: 200
    }
  ]
};

/**
 * 发送HTTP请求
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          duration: performance.now() - startTime
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    const startTime = performance.now();
    req.end();
  });
}

/**
 * 测试单个端点
 */
async function testEndpoint(endpoint, iteration) {
  const options = {
    hostname: 'localhost',
    port: 33037,
    path: endpoint.path,
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      ...endpoint.headers
    }
  };
  
  try {
    const result = await makeRequest(options);
    
    return {
      endpoint: endpoint.name,
      iteration,
      success: result.statusCode === endpoint.expectedStatus,
      statusCode: result.statusCode,
      duration: result.duration,
      bodyLength: result.body.length
    };
  } catch (error) {
    return {
      endpoint: endpoint.name,
      iteration,
      success: false,
      error: error.message,
      duration: 0
    };
  }
}

/**
 * 并发测试
 */
async function runConcurrentTest(endpoint, concurrency) {
  const promises = [];
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(testEndpoint(endpoint, i + 1));
  }
  
  return Promise.all(promises);
}

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('🚀 开始麒麟项目中间件性能测试');
  console.log('='.repeat(60));
  console.log(`测试配置: ${CONFIG.iterations}次迭代, ${CONFIG.concurrency}并发`);
  console.log('='.repeat(60));
  
  const results = {};
  
  for (const endpoint of CONFIG.endpoints) {
    console.log(`\n📊 测试端点: ${endpoint.name}`);
    console.log(`路径: ${endpoint.method} ${endpoint.path}`);
    
    const endpointResults = [];
    let totalDuration = 0;
    let successCount = 0;
    
    for (let i = 0; i < CONFIG.iterations; i++) {
      console.log(`  迭代 ${i + 1}/${CONFIG.iterations}...`);
      
      const iterationResults = await runConcurrentTest(endpoint, CONFIG.concurrency);
      endpointResults.push(...iterationResults);
      
      // 统计本次迭代
      const iterationDurations = iterationResults
        .filter(r => r.success)
        .map(r => r.duration);
      
      if (iterationDurations.length > 0) {
        const avgDuration = iterationDurations.reduce((a, b) => a + b, 0) / iterationDurations.length;
        totalDuration += avgDuration;
        successCount += iterationDurations.length;
      }
    }
    
    // 计算统计信息
    const successfulResults = endpointResults.filter(r => r.success);
    const failedResults = endpointResults.filter(r => !r.success);
    
    const durations = successfulResults.map(r => r.duration);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    
    // 计算百分位数
    const p95 = calculatePercentile(durations, 95);
    const p99 = calculatePercentile(durations, 99);
    
    results[endpoint.name] = {
      totalRequests: endpointResults.length,
      successRate: (successfulResults.length / endpointResults.length * 100).toFixed(2),
      avgDuration: avgDuration.toFixed(2),
      minDuration: minDuration.toFixed(2),
      maxDuration: maxDuration.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      failures: failedResults.length
    };
    
    console.log(`  ✅ 成功: ${successfulResults.length}/${endpointResults.length} (${results[endpoint.name].successRate}%)`);
    console.log(`  ⏱️  平均响应时间: ${results[endpoint.name].avgDuration}ms`);
    console.log(`  📈 P95响应时间: ${results[endpoint.name].p95}ms`);
    console.log(`  🚨 P99响应时间: ${results[endpoint.name].p99}ms`);
    
    if (failedResults.length > 0) {
      console.log(`  ❌ 失败请求: ${failedResults.length}`);
      failedResults.slice(0, 3).forEach(failure => {
        console.log(`     - ${failure.error || `状态码: ${failure.statusCode}`}`);
      });
    }
  }
  
  // 输出总结报告
  console.log('\n' + '='.repeat(60));
  console.log('📈 性能测试总结报告');
  console.log('='.repeat(60));
  
  console.log('\n端点性能对比:');
  console.log('─'.repeat(60));
  console.log('端点名称                成功率   平均(ms)  P95(ms)  失败数');
  console.log('─'.repeat(60));
  
  for (const [endpointName, stats] of Object.entries(results)) {
    const name = endpointName.padEnd(22);
    const successRate = `${stats.successRate}%`.padStart(7);
    const avg = `${stats.avgDuration}`.padStart(8);
    const p95 = `${stats.p95}`.padStart(8);
    const failures = `${stats.failures}`.padStart(6);
    
    console.log(`${name} ${successRate} ${avg} ${p95} ${failures}`);
  }
  
  console.log('─'.repeat(60));
  
  // 性能分析
  console.log('\n🔍 性能分析:');
  
  const authEndpoints = CONFIG.endpoints.filter(e => e.headers.Authorization);
  const noAuthEndpoints = CONFIG.endpoints.filter(e => !e.headers.Authorization);
  
  if (authEndpoints.length > 0 && noAuthEndpoints.length > 0) {
    const authAvg = parseFloat(results[authEndpoints[0].name].avgDuration);
    const noAuthAvg = parseFloat(results[noAuthEndpoints[0].name].avgDuration);
    const overhead = authAvg - noAuthAvg;
    const overheadPercentage = (overhead / noAuthAvg * 100).toFixed(1);
    
    console.log(`  • 认证中间件开销: ${overhead.toFixed(2)}ms (${overheadPercentage}%)`);
    
    if (overhead > 50) {
      console.log(`  ⚠️  警告: 认证中间件开销较高 (>50ms)`);
    } else if (overhead > 20) {
      console.log(`  ℹ️  提示: 认证中间件开销中等 (20-50ms)`);
    } else {
      console.log(`  ✅ 良好: 认证中间件开销较低 (<20ms)`);
    }
  }
  
  // 建议
  console.log('\n💡 优化建议:');
  
  const highLatencyEndpoints = Object.entries(results)
    .filter(([_, stats]) => parseFloat(stats.avgDuration) > 100)
    .map(([name, _]) => name);
  
  if (highLatencyEndpoints.length > 0) {
    console.log(`  • 以下端点响应时间超过100ms，建议优化:`);
    highLatencyEndpoints.forEach(name => {
      console.log(`    - ${name}`);
    });
  } else {
    console.log(`  • 所有端点响应时间良好 (<100ms)`);
  }
  
  const lowSuccessRateEndpoints = Object.entries(results)
    .filter(([_, stats]) => parseFloat(stats.successRate) < 95)
    .map(([name, _]) => name);
  
  if (lowSuccessRateEndpoints.length > 0) {
    console.log(`  • 以下端点成功率低于95%，需要检查:`);
    lowSuccessRateEndpoints.forEach(name => {
      console.log(`    - ${name}`);
    });
  } else {
    console.log(`  • 所有端点成功率良好 (>95%)`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 性能测试完成');
  console.log('='.repeat(60));
}

/**
 * 计算百分位数
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(percentile / 100 * sorted.length) - 1;
  
  return sorted[Math.max(0, index)];
}

/**
 * 验证测试环境
 */
async function validateEnvironment() {
  console.log('🔍 验证测试环境...');
  
  try {
    // 测试健康检查
    const healthResult = await makeRequest({
      hostname: 'localhost',
      port: 33037,
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResult.statusCode !== 200) {
      throw new Error(`健康检查失败: 状态码 ${healthResult.statusCode}`);
    }
    
    const healthData = JSON.parse(healthResult.body);
    console.log(`  ✅ 后端服务正常: ${healthData.service} v${healthData.version}`);
    
    // 测试认证
    const authResult = await makeRequest({
      hostname: 'localhost',
      port: 33037,
      path: '/api/v1/stores',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'X-Tenant-ID': TENANT_ID
      }
    });
    
    if (authResult.statusCode === 401) {
      console.log('  ⚠️  测试Token可能已过期，请更新TEST_TOKEN常量');
      return false;
    }
    
    console.log(`  ✅ 认证测试通过: 状态码 ${authResult.statusCode}`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ 环境验证失败: ${error.message}`);
    console.log('  请确保:');
    console.log('  1. 后端服务器正在运行 (端口33037)');
    console.log('  2. 数据库连接正常');
    console.log('  3. 测试Token有效');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🐉 麒麟项目中间件性能测试工具');
    console.log('版本: 1.0.0');
    console.log('='.repeat(60));
    
    // 验证环境
    const envValid = await validateEnvironment();
    if (!envValid) {
      console.log('\n❌ 测试环境验证失败，退出测试');
      process.exit(1);
    }
    
    // 运行性能测试
    await runPerformanceTest();
    
  } catch (error) {
    console.error(`\n❌ 测试执行失败: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  runPerformanceTest,
  validateEnvironment
};