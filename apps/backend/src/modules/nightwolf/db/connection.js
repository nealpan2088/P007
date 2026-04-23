// 夜狼行动 - 数据库连接管理器
// 版本: 0.1.0
// 功能: 管理夜狼模块的数据库连接

const { getPerformanceConfig } = require('../config/feature-flags');
const { ErrorFactory } = require('../config/errors');

// 数据库连接池
let connectionPool = null;
let isConnected = false;
let connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  connectionErrors: 0,
  queryCount: 0,
  errorCount: 0,
  lastError: null,
  lastQuery: null,
};

/**
 * 初始化数据库连接
 */
async function initializeDatabase() {
  const performanceConfig = getPerformanceConfig();
  
  console.log('🔌 初始化夜狼模块数据库连接...');
  console.log(`📊 数据库配置: 连接池大小=${performanceConfig.DB_POOL_SIZE}, 查询超时=${performanceConfig.QUERY_TIMEOUT}ms`);
  
  try {
    // 检查是否应该使用独立数据库连接
    if (process.env.NIGHTWOLF_DB_ISOLATION === 'true') {
      return await initializeIsolatedConnection(performanceConfig);
    } else {
      return await initializeSharedConnection(performanceConfig);
    }
    
  } catch (error) {
    console.error('❌ 初始化数据库连接失败:', error);
    connectionStats.connectionErrors++;
    connectionStats.lastError = error.message;
    
    throw ErrorFactory.system.databaseError('initialize', error);
  }
}

/**
 * 初始化独立数据库连接
 */
async function initializeIsolatedConnection(performanceConfig) {
  console.log('🔒 使用独立数据库连接...');
  
  // 这里应该创建独立的数据库连接
  // 为了简化，我们使用模拟连接
  const connection = {
    type: 'isolated',
    host: process.env.NIGHTWOLF_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.NIGHTWOLF_DB_PORT || process.env.DB_PORT || 5432,
    database: process.env.NIGHTWOLF_DB_NAME || process.env.DB_NAME || 'p007_simple',
    user: process.env.NIGHTWOLF_DB_USER || process.env.DB_USER,
    password: process.env.NIGHTWOLF_DB_PASSWORD || process.env.DB_PASSWORD,
    poolSize: performanceConfig.DB_POOL_SIZE,
    connected: false,
  };
  
  // 模拟连接建立
  await new Promise(resolve => setTimeout(resolve, 100));
  connection.connected = true;
  
  connectionPool = {
    connection,
    pool: [],
    stats: connectionStats,
  };
  
  isConnected = true;
  connectionStats.totalConnections = performanceConfig.DB_POOL_SIZE;
  connectionStats.idleConnections = performanceConfig.DB_POOL_SIZE;
  
  console.log('✅ 独立数据库连接初始化完成');
  console.log(`📊 连接信息: ${connection.host}:${connection.port}/${connection.database}`);
  
  return connectionPool;
}

/**
 * 初始化共享数据库连接
 */
async function initializeSharedConnection(performanceConfig) {
  console.log('🔗 使用共享数据库连接...');
  
  // 这里应该复用主应用的数据库连接
  // 为了简化，我们使用模拟连接
  const connection = {
    type: 'shared',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'p007_simple',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolSize: Math.min(5, performanceConfig.DB_POOL_SIZE), // 共享连接池较小
    connected: false,
  };
  
  // 模拟连接建立
  await new Promise(resolve => setTimeout(resolve, 50));
  connection.connected = true;
  
  connectionPool = {
    connection,
    pool: [],
    stats: connectionStats,
  };
  
  isConnected = true;
  connectionStats.totalConnections = connection.poolSize;
  connectionStats.idleConnections = connection.poolSize;
  
  console.log('✅ 共享数据库连接初始化完成');
  console.log(`📊 复用主应用数据库连接`);
  
  return connectionPool;
}

/**
 * 获取数据库连接
 */
async function getConnection() {
  if (!isConnected || !connectionPool) {
    throw ErrorFactory.system.databaseError('get_connection', new Error('数据库未连接'));
  }
  
  // 模拟从连接池获取连接
  if (connectionStats.idleConnections <= 0) {
    console.warn('⚠️  数据库连接池繁忙，等待可用连接...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  connectionStats.activeConnections++;
  connectionStats.idleConnections--;
  
  const connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    acquiredAt: new Date(),
    stats: connectionStats,
  };
  
  console.log(`🔗 获取数据库连接: ${connection.id} (活跃: ${connectionStats.activeConnections}, 空闲: ${connectionStats.idleConnections})`);
  
  return connection;
}

/**
 * 释放数据库连接
 */
async function releaseConnection(connection) {
  if (!connection) return;
  
  connectionStats.activeConnections--;
  connectionStats.idleConnections++;
  
  console.log(`🔓 释放数据库连接: ${connection.id} (活跃: ${connectionStats.activeConnections}, 空闲: ${connectionStats.idleConnections})`);
}

/**
 * 执行数据库查询
 */
async function executeQuery(sql, params = [], options = {}) {
  const startTime = Date.now();
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`📝 执行查询 [${queryId}]:`, {
      sql: sql.length > 100 ? sql.substring(0, 100) + '...' : sql,
      params: params.length > 5 ? params.slice(0, 5) : params,
      options,
    });
    
    // 获取连接
    const connection = await getConnection();
    
    try {
      // 执行查询（模拟）
      const result = await executeMockQuery(sql, params, options);
      
      const queryTime = Date.now() - startTime;
      connectionStats.queryCount++;
      
      console.log(`✅ 查询完成 [${queryId}]: ${queryTime}ms, 结果: ${result.rows?.length || 0} 行`);
      
      // 记录慢查询
      if (queryTime > 1000) {
        console.warn(`🐌 慢查询警告 [${queryId}]: ${queryTime}ms`);
        connectionStats.lastQuery = {
          id: queryId,
          sql,
          time: queryTime,
          timestamp: new Date().toISOString(),
        };
      }
      
      return result;
      
    } finally {
      // 释放连接
      await releaseConnection(connection);
    }
    
  } catch (error) {
    const queryTime = Date.now() - startTime;
    connectionStats.errorCount++;
    connectionStats.lastError = error.message;
    
    console.error(`❌ 查询失败 [${queryId}]: ${queryTime}ms`, {
      error: error.message,
      sql: sql.length > 200 ? sql.substring(0, 200) + '...' : sql,
    });
    
    throw ErrorFactory.system.databaseError('execute_query', error);
  }
}

/**
 * 执行模拟查询（用于开发环境）
 */
async function executeMockQuery(sql, params, options) {
  // 模拟查询延迟
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));
  
  // 根据SQL类型返回模拟结果
  if (sql.includes('SELECT')) {
    return {
      rows: generateMockRows(sql, params),
      rowCount: Math.floor(Math.random() * 10) + 1,
    };
  } else if (sql.includes('INSERT')) {
    return {
      rows: [{ id: `new_${Date.now()}` }],
      rowCount: 1,
    };
  } else if (sql.includes('UPDATE') || sql.includes('DELETE')) {
    return {
      rows: [],
      rowCount: Math.floor(Math.random() * 5) + 1,
    };
  } else {
    return {
      rows: [],
      rowCount: 0,
    };
  }
}

/**
 * 生成模拟数据行
 */
function generateMockRows(sql, params) {
  const rows = [];
  const rowCount = Math.floor(Math.random() * 10) + 1;
  
  for (let i = 0; i < rowCount; i++) {
    const row = {};
    
    if (sql.includes('nightwolf_strategy')) {
      row.id = `strat_${Date.now()}_${i}`;
      row.storeId = params[0] || `store_${Math.floor(Math.random() * 10) + 1}`;
      row.name = `策略 ${i + 1}`;
      row.type = ['fast_food', 'casual_dining', 'custom'][Math.floor(Math.random() * 3)];
      row.isActive = Math.random() > 0.5;
      row.createdAt = new Date().toISOString();
    } else if (sql.includes('nightwolf_template')) {
      row.id = `template_${Date.now()}_${i}`;
      row.name = `模板 ${i + 1}`;
      row.type = ['fast_food', 'casual_dining'][Math.floor(Math.random() * 2)];
      row.isPublic = true;
      row.isDefault = i === 0;
      row.usageCount = Math.floor(Math.random() * 100);
      row.createdAt = new Date().toISOString();
    } else {
      row.id = `row_${Date.now()}_${i}`;
      row.name = `记录 ${i + 1}`;
      row.createdAt = new Date().toISOString();
    }
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * 开始事务
 */
async function beginTransaction() {
  console.log('🔐 开始数据库事务');
  
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startedAt: new Date(),
    queries: [],
  };
  
  return transaction;
}

/**
 * 提交事务
 */
async function commitTransaction(transaction) {
  if (!transaction) return;
  
  const transactionTime = Date.now() - transaction.startedAt.getTime();
  console.log(`✅ 提交事务 [${transaction.id}]: ${transactionTime}ms, ${transaction.queries.length} 个查询`);
  
  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 20));
}

/**
 * 回滚事务
 */
async function rollbackTransaction(transaction) {
  if (!transaction) return;
  
  const transactionTime = Date.now() - transaction.startedAt.getTime();
  console.log(`↩️  回滚事务 [${transaction.id}]: ${transactionTime}ms, ${transaction.queries.length} 个查询`);
  
  // 模拟回滚
  await new Promise(resolve => setTimeout(resolve, 20));
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  console.log('🔌 关闭夜狼模块数据库连接...');
  
  if (!isConnected) {
    console.log('ℹ️  数据库未连接，无需关闭');
    return;
  }
  
  try {
    // 模拟关闭连接
    await new Promise(resolve => setTimeout(resolve, 50));
    
    connectionPool = null;
    isConnected = false;
    
    console.log('✅ 数据库连接已关闭');
    console.log('📊 连接统计:', JSON.stringify(connectionStats, null, 2));
    
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error);
    throw error;
  }
}

/**
 * 获取数据库状态
 */
function getDatabaseStatus() {
  return {
    connected: isConnected,
    pool: connectionPool ? {
      type: connectionPool.connection.type,
      host: connectionPool.connection.host,
      database: connectionPool.connection.database,
      poolSize: connectionPool.connection.poolSize,
    } : null,
    stats: { ...connectionStats },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 健康检查
 */
async function healthCheck() {
  try {
    if (!isConnected) {
      return {
        healthy: false,
        reason: 'database_not_connected',
        message: '数据库未连接',
      };
    }
    
    // 执行简单查询测试连接
    const result = await executeQuery('SELECT 1 as test');
    
    return {
      healthy: true,
      testResult: result.rows[0]?.test === 1,
      stats: connectionStats,
    };
    
  } catch (error) {
    return {
      healthy: false,
      reason: 'health_check_failed',
      message: error.message,
      stats: connectionStats,
    };
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  releaseConnection,
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closeDatabase,
  getDatabaseStatus,
  healthCheck,
};