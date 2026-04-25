// 夜狼行动 - 数据库迁移文件
// 版本: 0.1.0
// 功能: 创建夜狼模块的数据库表

const { NightWolfConstants } = require('../config/constants');

/**
 * 创建夜狼模块数据库表
 */
async function createNightWolfTables(db) {
  console.log('📊 开始创建夜狼模块数据库表...');
  
  try {
    // 1. 策略表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${NightWolfConstants.DATABASE.TABLES.STRATEGY} (
        id VARCHAR(50) PRIMARY KEY,
        storeId VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        isActive BOOLEAN NOT NULL DEFAULT false,
        version INTEGER NOT NULL DEFAULT 1,
        templateId VARCHAR(50),
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- 索引
        INDEX idx_store_id (storeId),
        INDEX idx_is_active (isActive),
        INDEX idx_type (type),
        INDEX idx_created_at (createdAt),
        
        -- 外键约束（可选，可断开）
        CONSTRAINT fk_store_id FOREIGN KEY (storeId) REFERENCES Store(id) ON DELETE CASCADE
      );
    `);
    console.log(`✅ 表创建完成: ${NightWolfConstants.DATABASE.TABLES.STRATEGY}`);
    
    // 2. 模板表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${NightWolfConstants.DATABASE.TABLES.TEMPLATE} (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        strategy JSONB NOT NULL DEFAULT '{}',
        isPublic BOOLEAN NOT NULL DEFAULT false,
        isDefault BOOLEAN NOT NULL DEFAULT false,
        usageCount INTEGER NOT NULL DEFAULT 0,
        createdBy VARCHAR(50),
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- 索引
        INDEX idx_type (type),
        INDEX idx_is_public (isPublic),
        INDEX idx_is_default (isDefault),
        INDEX idx_usage_count (usageCount),
        INDEX idx_created_at (createdAt)
      );
    `);
    console.log(`✅ 表创建完成: ${NightWolfConstants.DATABASE.TABLES.TEMPLATE}`);
    
    // 3. 配置表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${NightWolfConstants.DATABASE.TABLES.CONFIG} (
        id VARCHAR(50) PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value JSONB NOT NULL DEFAULT '{}',
        description TEXT,
        isSystem BOOLEAN NOT NULL DEFAULT false,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- 索引
        INDEX idx_key (key),
        INDEX idx_is_system (isSystem)
      );
    `);
    console.log(`✅ 表创建完成: ${NightWolfConstants.DATABASE.TABLES.CONFIG}`);
    
    // 4. 订单策略关联表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${NightWolfConstants.DATABASE.TABLES.ORDER_STRATEGY} (
        id VARCHAR(50) PRIMARY KEY,
        orderId VARCHAR(50) NOT NULL,
        strategyId VARCHAR(50) NOT NULL,
        appliedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        result JSONB,
        success BOOLEAN NOT NULL DEFAULT true,
        errorMessage TEXT,
        
        -- 索引
        INDEX idx_order_id (orderId),
        INDEX idx_strategy_id (strategyId),
        INDEX idx_applied_at (appliedAt),
        INDEX idx_success (success),
        
        -- 外键约束（可选，可断开）
        CONSTRAINT fk_strategy_id FOREIGN KEY (strategyId) REFERENCES ${NightWolfConstants.DATABASE.TABLES.STRATEGY}(id) ON DELETE CASCADE
      );
    `);
    console.log(`✅ 表创建完成: ${NightWolfConstants.DATABASE.TABLES.ORDER_STRATEGY}`);
    
    // 5. 插入默认模板数据
    await insertDefaultTemplates(db);
    
    // 6. 插入默认配置数据
    await insertDefaultConfigs(db);
    
    console.log('🎉 夜狼模块数据库表创建完成');
    
    return {
      success: true,
      tables: [
        NightWolfConstants.DATABASE.TABLES.STRATEGY,
        NightWolfConstants.DATABASE.TABLES.TEMPLATE,
        NightWolfConstants.DATABASE.TABLES.CONFIG,
        NightWolfConstants.DATABASE.TABLES.ORDER_STRATEGY,
      ],
      message: '夜狼模块数据库初始化完成',
    };
    
  } catch (error) {
    console.error('❌ 创建夜狼模块数据库表失败:', error);
    throw error;
  }
}

/**
 * 插入默认模板数据
 */
async function insertDefaultTemplates(db) {
  const { DEFAULTS, TEMPLATE_TYPES } = NightWolfConstants;
  
  const defaultTemplates = [
    {
      id: 'template_fast_food',
      name: DEFAULTS.TEMPLATES.FAST_FOOD.name,
      type: TEMPLATE_TYPES.FAST_FOOD,
      description: DEFAULTS.TEMPLATES.FAST_FOOD.description,
      strategy: DEFAULTS.TEMPLATES.FAST_FOOD.strategy,
      isPublic: true,
      isDefault: true,
      usageCount: 0,
      createdBy: 'system',
    },
    {
      id: 'template_casual_dining',
      name: DEFAULTS.TEMPLATES.CASUAL_DINING.name,
      type: TEMPLATE_TYPES.CASUAL_DINING,
      description: DEFAULTS.TEMPLATES.CASUAL_DINING.description,
      strategy: DEFAULTS.TEMPLATES.CASUAL_DINING.strategy,
      isPublic: true,
      isDefault: true,
      usageCount: 0,
      createdBy: 'system',
    },
  ];
  
  for (const template of defaultTemplates) {
    try {
      await db.execute(`
        INSERT INTO ${NightWolfConstants.DATABASE.TABLES.TEMPLATE} 
        (id, name, type, description, strategy, isPublic, isDefault, usageCount, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `, [
        template.id,
        template.name,
        template.type,
        template.description,
        JSON.stringify(template.strategy),
        template.isPublic,
        template.isDefault,
        template.usageCount,
        template.createdBy,
      ]);
      
      console.log(`📦 插入默认模板: ${template.name}`);
    } catch (error) {
      console.warn(`⚠️  插入模板失败 ${template.name}:`, error.message);
    }
  }
}

/**
 * 插入默认配置数据
 */
async function insertDefaultConfigs(db) {
  const defaultConfigs = [
    {
      id: 'config_module_settings',
      key: 'module_settings',
      value: {
        enabled: process.env.NIGHTWOLF_ENABLED === 'true',
        strictMode: process.env.NIGHTWOLF_STRICT_MODE === 'true',
        logLevel: process.env.NIGHTWOLF_LOG_LEVEL || 'info',
      },
      description: '夜狼模块基础设置',
      isSystem: true,
    },
    {
      id: 'config_performance',
      key: 'performance',
      value: {
        cacheEnabled: process.env.NIGHTWOLF_CACHE === 'true',
        cacheTTL: parseInt(process.env.NIGHTWOLF_CACHE_TTL || '300'),
        dbPoolSize: parseInt(process.env.NIGHTWOLF_DB_POOL || '10'),
        queryTimeout: parseInt(process.env.NIGHTWOLF_QUERY_TIMEOUT || '5000'),
      },
      description: '性能配置',
      isSystem: true,
    },
    {
      id: 'config_security',
      key: 'security',
      value: {
        validateInput: process.env.NIGHTWOLF_VALIDATE === 'true',
        permissionCheck: process.env.NIGHTWOLF_PERMISSION === 'true',
        auditLog: process.env.NIGHTWOLF_AUDIT === 'true',
      },
      description: '安全配置',
      isSystem: true,
    },
  ];
  
  for (const config of defaultConfigs) {
    try {
      await db.execute(`
        INSERT INTO ${NightWolfConstants.DATABASE.TABLES.CONFIG} 
        (id, key, value, description, isSystem)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description,
          updatedAt = CURRENT_TIMESTAMP
      `, [
        config.id,
        config.key,
        JSON.stringify(config.value),
        config.description,
        config.isSystem,
      ]);
      
      console.log(`⚙️  插入默认配置: ${config.key}`);
    } catch (error) {
      console.warn(`⚠️  插入配置失败 ${config.key}:`, error.message);
    }
  }
}

/**
 * 删除夜狼模块数据库表
 */
async function dropNightWolfTables(db) {
  console.log('🧹 开始删除夜狼模块数据库表...');
  
  try {
    // 注意删除顺序（外键约束）
    const tables = [
      NightWolfConstants.DATABASE.TABLES.ORDER_STRATEGY,
      NightWolfConstants.DATABASE.TABLES.STRATEGY,
      NightWolfConstants.DATABASE.TABLES.TEMPLATE,
      NightWolfConstants.DATABASE.TABLES.CONFIG,
    ];
    
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`🗑️  删除表: ${table}`);
      } catch (error) {
        console.warn(`⚠️  删除表失败 ${table}:`, error.message);
      }
    }
    
    console.log('✅ 夜狼模块数据库表删除完成');
    
    return {
      success: true,
      message: '夜狼模块数据库表已删除',
    };
    
  } catch (error) {
    console.error('❌ 删除夜狼模块数据库表失败:', error);
    throw error;
  }
}

/**
 * 检查夜狼模块数据库表是否存在
 */
async function checkNightWolfTables(db) {
  console.log('🔍 检查夜狼模块数据库表状态...');
  
  try {
    const tables = [
      NightWolfConstants.DATABASE.TABLES.STRATEGY,
      NightWolfConstants.DATABASE.TABLES.TEMPLATE,
      NightWolfConstants.DATABASE.TABLES.CONFIG,
      NightWolfConstants.DATABASE.TABLES.ORDER_STRATEGY,
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        results[table] = {
          exists: true,
          hasData: result.rows.length > 0,
        };
        console.log(`✅ ${table}: 存在${result.rows.length > 0 ? '且有数据' : '但无数据'}`);
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('no such table')) {
          results[table] = {
            exists: false,
            error: '表不存在',
          };
          console.log(`❌ ${table}: 不存在`);
        } else {
          results[table] = {
            exists: false,
            error: error.message,
          };
          console.log(`⚠️ ${table}: 检查失败 - ${error.message}`);
        }
      }
    }
    
    return {
      success: true,
      tables: results,
      message: '夜狼模块数据库表检查完成',
    };
    
  } catch (error) {
    console.error('❌ 检查夜狼模块数据库表失败:', error);
    throw error;
  }
}

module.exports = {
  createNightWolfTables,
  dropNightWolfTables,
  checkNightWolfTables,
  insertDefaultTemplates,
  insertDefaultConfigs,
};