// 链接验证工具 - 规范化链接检查和验证
// 用于验证前端链接的有效性和API端点的可用性

import { SCAN_ROUTES } from '../config/scan-routes';
import { PUBLIC_API_ROUTES } from '../config/api-routes';

// 安全获取测试URL的辅助函数
function getSafeTestScanUrl(): string {
  try {
    if (SCAN_ROUTES && SCAN_ROUTES.utils && typeof SCAN_ROUTES.utils.getTestUrl === 'function') {
      return SCAN_ROUTES.utils.getTestUrl();
    }
    console.warn('SCAN_ROUTES.utils.getTestUrl() 不可用，使用默认测试URL');
    return '/t/qilin-test/s/test-store/scan/A01';
  } catch (error) {
    console.error('获取测试扫码URL失败:', error);
    return '/t/qilin-test/s/test-store/scan/A01';
  }
}

function getSafeLegacyTestScanUrl(): string {
  try {
    if (SCAN_ROUTES && SCAN_ROUTES.utils && typeof SCAN_ROUTES.utils.getLegacyTestUrl === 'function') {
      return SCAN_ROUTES.utils.getLegacyTestUrl();
    }
    console.warn('SCAN_ROUTES.utils.getLegacyTestUrl() 不可用，使用默认测试URL');
    return '/scan/test-store/A01';
  } catch (error) {
    console.error('获取旧规范测试扫码URL失败:', error);
    return '/scan/test-store/A01';
  }
}

/**
 * 链接验证结果
 */
export interface LinkValidationResult {
  url: string;
  isValid: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
  timestamp: string;
}

/**
 * 链接类型
 */
export type LinkType = 'FRONTEND_ROUTE' | 'API_ENDPOINT' | 'EXTERNAL_URL';

/**
 * 需要验证的关键链接配置
 */
export const CRITICAL_LINKS = [
  // 前端路由
  {
    type: 'FRONTEND_ROUTE' as LinkType,
    url: '/',
    description: '首页'
  },
  {
    type: 'FRONTEND_ROUTE' as LinkType,
    url: getSafeTestScanUrl(),
    description: '新规范扫码点餐测试链接'
  },
  {
    type: 'FRONTEND_ROUTE' as LinkType,
    url: getSafeLegacyTestScanUrl(),
    description: '旧规范扫码点餐测试链接'
  },
  {
    type: 'FRONTEND_ROUTE' as LinkType,
    url: '/tenants',
    description: '租户管理页面'
  },
  
  // API端点
  {
    type: 'API_ENDPOINT' as LinkType,
    url: PUBLIC_API_ROUTES.HEALTH,
    description: '健康检查API'
  },
  {
    type: 'API_ENDPOINT' as LinkType,
    url: '/api/test/tenants',
    description: '租户列表测试API'
  },
  {
    type: 'API_ENDPOINT' as LinkType,
    url: '/api/public/tenants/qilin-test',
    description: '测试租户信息API'
  },
  {
    type: 'API_ENDPOINT' as LinkType,
    url: '/api/public/tenants/qilin-test/stores/test-store/menu',
    description: '测试店铺菜单API'
  }
];

/**
 * 验证单个链接
 * @param link 链接配置
 * @returns 验证结果
 */
export async function validateLink(link: typeof CRITICAL_LINKS[0]): Promise<LinkValidationResult> {
  const startTime = Date.now();
  const result: LinkValidationResult = {
    url: link.url,
    isValid: false,
    timestamp: new Date().toISOString()
  };

  try {
    let response: Response;
    
    if (link.type === 'API_ENDPOINT') {
      // API端点验证
      response = await fetch(link.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // 添加超时控制
        signal: AbortSignal.timeout(5000)
      });
    } else {
      // 前端路由验证
      response = await fetch(link.url, {
        method: 'HEAD', // 使用HEAD方法减少数据传输
        signal: AbortSignal.timeout(5000)
      });
    }

    const endTime = Date.now();
    result.responseTime = endTime - startTime;
    result.status = response.status;
    
    // 判断是否有效
    if (response.ok || response.status === 200) {
      result.isValid = true;
    } else {
      result.error = `HTTP ${response.status}`;
    }
    
  } catch (error) {
    const endTime = Date.now();
    result.responseTime = endTime - startTime;
    
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      result.error = '请求超时';
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      result.error = '网络连接失败';
    } else {
      result.error = error instanceof Error ? error.message : '未知错误';
    }
    
    console.warn(`链接验证失败: ${link.url}`, error);
  }

  return result;
}

/**
 * 批量验证链接
 * @param links 链接列表
 * @returns 验证结果数组
 */
export async function validateLinks(links = CRITICAL_LINKS): Promise<LinkValidationResult[]> {
  console.log('开始验证关键链接...');
  
  const results: LinkValidationResult[] = [];
  
  // 使用Promise.allSettled并行验证，避免一个失败影响其他
  const promises = links.map(link => validateLink(link));
  const settledResults = await Promise.allSettled(promises);
  
  settledResults.forEach((settledResult, index) => {
    if (settledResult.status === 'fulfilled') {
      results.push(settledResult.value);
    } else {
      results.push({
        url: links[index].url,
        isValid: false,
        error: settledResult.reason?.message || '验证异常',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 统计结果
  const validCount = results.filter(r => r.isValid).length;
  const totalCount = results.length;
  
  console.log(`链接验证完成: ${validCount}/${totalCount} 个链接有效`);
  
  // 输出失败链接
  const failedLinks = results.filter(r => !r.isValid);
  if (failedLinks.length > 0) {
    console.warn('以下链接验证失败:');
    failedLinks.forEach(link => {
      console.warn(`  - ${link.url}: ${link.error || '未知错误'}`);
    });
  }
  
  return results;
}

/**
 * 生成链接验证报告
 * @param results 验证结果
 * @returns 格式化报告
 */
export function generateValidationReport(results: LinkValidationResult[]): string {
  const validCount = results.filter(r => r.isValid).length;
  const totalCount = results.length;
  const successRate = ((validCount / totalCount) * 100).toFixed(1);
  
  let report = `# 链接验证报告\n\n`;
  report += `**生成时间**: ${new Date().toLocaleString()}\n`;
  report += `**验证结果**: ${validCount}/${totalCount} (${successRate}%)\n\n`;
  
  report += `## 详细结果\n\n`;
  
  // 按类型分组
  const byType = results.reduce((acc, result) => {
    const linkConfig = CRITICAL_LINKS.find(l => l.url === result.url);
    const type = linkConfig?.type || 'UNKNOWN';
    
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push({ ...result, description: linkConfig?.description });
    return acc;
  }, {} as Record<string, Array<LinkValidationResult & { description?: string }>>);
  
  // 输出每个类型的结果
  Object.entries(byType).forEach(([type, typeResults]) => {
    report += `### ${type}\n\n`;
    
    typeResults.forEach(result => {
      const statusEmoji = result.isValid ? '✅' : '❌';
      const statusText = result.isValid ? '有效' : '无效';
      const timeText = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      
      report += `- ${statusEmoji} **${result.description || result.url}**\n`;
      report += `  - 状态: ${statusText}\n`;
      report += `  - URL: ${result.url}\n`;
      report += `  - 响应时间: ${timeText}\n`;
      
      if (result.status) {
        report += `  - HTTP状态: ${result.status}\n`;
      }
      
      if (result.error) {
        report += `  - 错误: ${result.error}\n`;
      }
      
      report += `\n`;
    });
  });
  
  // 建议
  const failedCount = totalCount - validCount;
  if (failedCount > 0) {
    report += `## 建议\n\n`;
    report += `1. **检查网络连接** - 确保后端服务正常运行\n`;
    report += `2. **验证代理配置** - 检查Vite代理设置\n`;
    report += `3. **检查路由配置** - 确认前端路由正确注册\n`;
    report += `4. **监控服务状态** - 建立服务健康监控\n`;
  }
  
  return report;
}

/**
 * 定期链接健康检查
 * @param intervalMs 检查间隔(毫秒)
 */
export function startLinkHealthCheck(intervalMs = 300000): () => void { // 默认5分钟
  console.log(`启动链接健康检查，间隔: ${intervalMs / 1000}秒`);
  
  let isRunning = true;
  
  const check = async () => {
    if (!isRunning) return;
    
    try {
      console.log('执行定期链接健康检查...');
      const results = await validateLinks();
      const report = generateValidationReport(results);
      
      // 保存检查结果到localStorage
      localStorage.setItem('link_health_check', JSON.stringify({
        timestamp: new Date().toISOString(),
        results
      }));
      
      // 如果有失败链接，在控制台警告
      const failedLinks = results.filter(r => !r.isValid);
      if (failedLinks.length > 0) {
        console.warn(`链接健康检查发现 ${failedLinks.length} 个问题`);
        console.warn(report);
      } else {
        console.log('所有链接健康检查通过');
      }
      
    } catch (error) {
      console.error('链接健康检查失败:', error);
    }
    
    // 安排下一次检查
    if (isRunning) {
      setTimeout(check, intervalMs);
    }
  };
  
  // 立即执行第一次检查
  check();
  
  // 返回停止函数
  return () => {
    console.log('停止链接健康检查');
    isRunning = false;
  };
}