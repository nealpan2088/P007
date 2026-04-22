// 链接验证测试页面
// 用于测试和验证前端链接的有效性

import React, { useState, useEffect } from 'react';
import { validateLinks, generateValidationReport, startLinkHealthCheck } from '../utils/link-validator';

const LinkValidationTest: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [report, setReport] = useState<string>('');
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);
  const [stopHealthCheck, setStopHealthCheck] = useState<(() => void) | null>(null);

  // 执行链接验证
  const runValidation = async () => {
    setIsValidating(true);
    try {
      const results = await validateLinks();
      setValidationResults(results);
      
      const reportText = generateValidationReport(results);
      setReport(reportText);
      
      // 保存到localStorage供后续分析
      localStorage.setItem('last_link_validation', JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        report: reportText
      }));
      
    } catch (error) {
      console.error('链接验证失败:', error);
      setReport(`# 链接验证失败\n\n错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsValidating(false);
    }
  };

  // 启动/停止健康检查
  const toggleHealthCheck = () => {
    if (healthCheckRunning && stopHealthCheck) {
      stopHealthCheck();
      setHealthCheckRunning(false);
      setStopHealthCheck(null);
    } else {
      const stopFn = startLinkHealthCheck(60000); // 1分钟间隔
      setStopHealthCheck(() => stopFn);
      setHealthCheckRunning(true);
    }
  };

  // 组件加载时自动运行一次验证
  useEffect(() => {
    runValidation();
    
    // 清理函数
    return () => {
      if (stopHealthCheck) {
        stopHealthCheck();
      }
    };
  }, []);

  // 计算统计信息
  const validCount = validationResults.filter(r => r.isValid).length;
  const totalCount = validationResults.length;
  const successRate = totalCount > 0 ? ((validCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔗 前端链接验证测试</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📊 验证统计</h3>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: validCount === totalCount ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>
            <strong>有效链接:</strong> {validCount}/{totalCount}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '5px' }}>
            <strong>成功率:</strong> {successRate}%
          </div>
          <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
            <strong>状态:</strong> {isValidating ? '验证中...' : '已完成'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runValidation}
          disabled={isValidating}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isValidating ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isValidating ? '验证中...' : '重新验证链接'}
        </button>
        
        <button 
          onClick={toggleHealthCheck}
          style={{
            padding: '10px 20px',
            backgroundColor: healthCheckRunning ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {healthCheckRunning ? '停止健康检查' : '启动健康检查'}
        </button>
        
        {healthCheckRunning && (
          <span style={{ marginLeft: '10px', color: '#28a745' }}>
            ✅ 健康检查运行中 (1分钟间隔)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 左侧：详细结果 */}
        <div style={{ flex: 1 }}>
          <h3>📋 详细验证结果</h3>
          {validationResults.length === 0 ? (
            <p>暂无验证结果</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {validationResults.map((result, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: result.isValid ? '#e8f5e8' : '#f8e8e8',
                    borderLeft: `4px solid ${result.isValid ? '#28a745' : '#dc3545'}`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{result.isValid ? '✅' : '❌'} {result.url}</strong>
                      {result.description && <div style={{ fontSize: '0.9em', color: '#666' }}>{result.description}</div>}
                    </div>
                    <div>
                      {result.isValid ? (
                        <span style={{ color: '#28a745' }}>有效</span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>无效</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                    {result.status && <span>状态码: {result.status} | </span>}
                    {result.responseTime && <span>响应时间: {result.responseTime}ms | </span>}
                    {result.error && <span style={{ color: '#dc3545' }}>错误: {result.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：报告 */}
        <div style={{ flex: 1 }}>
          <h3>📄 验证报告</h3>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}>
            {report || '点击"重新验证链接"生成报告'}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4>💡 使用说明</h4>
            <ul style={{ fontSize: '0.9em', lineHeight: '1.6' }}>
              <li><strong>重新验证链接</strong>: 手动执行一次完整的链接验证</li>
              <li><strong>健康检查</strong>: 启动/停止定期自动检查 (1分钟间隔)</li>
              <li><strong>✅ 绿色</strong>: 链接有效，可正常访问</li>
              <li><strong>❌ 红色</strong>: 链接无效，需要检查修复</li>
              <li>验证结果会自动保存到localStorage供后续分析</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h4>🔧 技术信息</h4>
        <div style={{ fontSize: '0.9em' }}>
          <p><strong>验证工具</strong>: <code>src/utils/link-validator.ts</code></p>
          <p><strong>验证类型</strong>: 前端路由、API端点、外部链接</p>
          <p><strong>验证方法</strong>: HTTP请求 + 状态码检查</p>
          <p><strong>超时设置</strong>: 5秒</p>
          <p><strong>并行验证</strong>: 使用Promise.allSettled并行执行</p>
        </div>
      </div>
    </div>
  );
};

export default LinkValidationTest;