// 租户服务 - 管理多租户SaaS平台的租户功能

import { publicDb } from '../db/index.js';
import { passwordUtils, tokenUtils } from './auth.service.js';
import config from '../config/index.js';
import systemMode from '../utils/system-mode.js';

// 使用公共数据库客户端
const db = publicDb;

/**
 * 租户服务类
 */
export class TenantService {
  /**
   * 创建新租户
   * @param {Object} tenantData 租户数据
   * @param {string} tenantData.name 租户名称
   * @param {string} tenantData.subdomain 子域名
   * @param {string} tenantData.plan 套餐计划 (free|basic|premium)
   * @param {Object} ownerData 所有者用户数据
   * @returns {Promise<Object>} 创建的租户和用户
   */
  async createTenant(tenantData, ownerData) {
    console.log('创建租户 - 租户数据:', tenantData);
    console.log('创建租户 - 所有者数据:', ownerData);
    console.log('配置 - tenant:', config.tenant);
    console.log('配置 - business:', config.business);
    
    const { name, subdomain, plan = 'free' } = tenantData;
    const { email, username, password, fullName, phone } = ownerData;

    // 系统始终为多租户模式，无需检查单店模式
    console.log('创建租户 - 系统为多租户模式');

    // 验证子域名
    await this.validateSubdomain(subdomain);

    // 验证套餐计划
    const validPlans = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
    const planUpper = plan.toUpperCase();
    
    if (!validPlans.includes(planUpper)) {
      throw new Error(`无效的套餐计划，有效值: ${validPlans.join(', ')}`);
    }

    // 开始事务
    return await db.$transaction(async (tx) => {
      // 1. 创建租户
      const tenant = await tx.tenant.create({
        data: {
          name,
          displayName: name, // 使用name作为displayName
          subdomain,
          plan: planUpper, // 使用大写的计划值
          status: 'ACTIVE',
          contactEmail: ownerData.email, // 使用所有者邮箱作为联系邮箱
          trialEndsAt: new Date(Date.now() + ((config.tenant?.trialDays) || 14) * 24 * 60 * 60 * 1000),
          settings: {
            language: config.business?.defaultStoreSettings?.language || 'zh-CN',
            currency: config.business?.defaultStoreSettings?.currency || 'CNY',
            timezone: config.business?.defaultStoreSettings?.timezone || 'Asia/Shanghai',
          },
        },
      });

      // 2. 创建所有者用户（如果不存在）
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        const { hash: passwordHash, salt: passwordSalt } = await passwordUtils.hashPassword(password);
        user = await tx.user.create({
          data: {
            email,
            username,
            fullName,
            phone,
            passwordHash,
            passwordSalt,
            status: 'ACTIVE',
            verificationToken: tokenUtils.generateVerificationToken(),
            verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
          },
        });
      }

      // 3. 关联用户和租户
      await tx.userTenant.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'ADMIN', // 使用ADMIN作为所有者角色
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      // 4. 创建租户的独立Schema（多租户模式）
      if (systemMode && systemMode.isMultiTenant && systemMode.isMultiTenant()) {
        await this.createTenantSchema(tenant.id);
      }

      return {
        tenant,
        user,
        userTenant: {
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      };
    });
  }

  /**
   * 验证子域名
   * @param {string} subdomain 子域名
   */
  async validateSubdomain(subdomain) {
    console.log('验证子域名:', subdomain);
    console.log('systemMode 对象:', systemMode);
    console.log('systemMode.getMode 类型:', typeof systemMode?.getMode);
    console.log('systemMode.isMultiTenant 类型:', typeof systemMode?.isMultiTenant);
    
    try {
      // 检查 systemMode 是否正确定义
      if (!systemMode || typeof systemMode.getMode !== 'function') {
        throw new Error('systemMode 对象未正确定义或初始化');
      }
      
      console.log('系统模式:', systemMode.getMode());
      console.log('是否为多租户:', systemMode.isMultiTenant());
      
      // 安全获取租户配置
      const tenantConfig = config.tenant || {};
      console.log('租户配置:', tenantConfig);
      console.log('租户配置 - reservedSubdomains:', tenantConfig.reservedSubdomains);
      console.log('租户配置 - subdomainRegex:', tenantConfig.subdomainRegex);
      
      // 检查系统模式 - 如果是单店版，使用默认配置
      
      // 检查保留子域名
      const reservedSubdomains = systemMode.isMultiTenant() 
        ? (tenantConfig.reservedSubdomains || ['www', 'app', 'api', 'admin', 'test', 'demo'])
        : ['www', 'app', 'api', 'admin', 'test', 'demo'];
      
      console.log('使用的保留子域名列表:', reservedSubdomains);
      
      if (reservedSubdomains.includes(subdomain)) {
        throw new Error(`子域名 "${subdomain}" 是保留域名`);
      }

      // 检查子域名格式
      const regexPattern = systemMode.isMultiTenant()
        ? (tenantConfig.subdomainRegex || '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$')
        : '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$';
      
      console.log('使用的正则表达式:', regexPattern);
      
      const regex = new RegExp(regexPattern);
      if (!regex.test(subdomain)) {
        throw new Error('子域名格式无效');
      }

      // 检查是否已存在（仅在多店模式下检查）
      console.log('检查系统模式 - 准备调用 isMultiTenant()');
      console.log('systemMode 对象:', systemMode);
      console.log('systemMode.isMultiTenant 类型:', typeof systemMode?.isMultiTenant);
      
      if (systemMode && systemMode.isMultiTenant && systemMode.isMultiTenant()) {
        console.log('系统是多租户模式，检查子域名是否已存在');
        console.log('db 对象:', db);
        console.log('db.tenant 类型:', typeof db?.tenant);
        
        try {
          const existing = await db.tenant.findUnique({
            where: { subdomain },
          });

          if (existing) {
            throw new Error('该子域名已被使用');
          }
        } catch (dbError) {
          console.error('数据库查询错误:', dbError);
          throw new Error(`数据库查询失败: ${dbError.message}`);
        }
      } else {
        console.log('系统不是多租户模式，跳过子域名存在性检查');
      }
    } catch (error) {
      console.error('验证子域名时发生错误:', error);
      throw error;
    }
  }

  /**
   * 创建租户独立Schema
   * @param {string} tenantId 租户ID
   */
  async createTenantSchema(tenantId) {
    const schemaName = `tenant_${tenantId}`;
    
    try {
      // 创建Schema
      await db.$executeRawUnsafe(`
        CREATE SCHEMA IF NOT EXISTS "${schemaName}"
      `);

      // 创建业务表（这里可以扩展）
      await this.createTenantTables(schemaName);

      console.log(`✅ 租户Schema创建成功: ${schemaName}`);
    } catch (error) {
      console.error(`❌ 创建租户Schema失败:`, error);
      throw new Error('创建租户数据空间失败');
    }
  }

  /**
   * 创建租户业务表
   * @param {string} schemaName Schema名称
   */
  async createTenantTables(schemaName) {
    // 这里可以创建租户特定的业务表
    // 例如：店铺、餐桌、菜单、订单等
    
    // 示例：创建店铺表
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".store (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        logo_url TEXT,
        settings JSONB DEFAULT '{}'::jsonb,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // 创建索引
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_store_status ON "${schemaName}".store(status)
    `);
  }

  /**
   * 获取租户信息
   * @param {string} tenantId 租户ID
   * @returns {Promise<Object>} 租户信息
   */
  async getTenant(tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('租户不存在');
    }

    return tenant;
  }

  /**
   * 获取用户的所有租户
   * @param {string} userId 用户ID（字符串UUID）
   * @returns {Promise<Array>} 租户列表
   */
  async getUserTenants(userId) {
    try {
      console.log('获取用户租户列表，用户ID:', userId);
      
      // 新数据库：userId是字符串UUID，直接使用
      const userTenants = await db.userTenant.findMany({
        where: {
          userId: String(userId),
          status: 'ACTIVE'
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`找到 ${userTenants.length} 个用户租户关联`);

      // 简化返回结构
      return userTenants.map(ut => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        subdomain: ut.tenant.subdomain,
        description: ut.tenant.description,
        status: ut.tenant.status,
        role: ut.role,
        createdAt: ut.createdAt,
      }));
    } catch (error) {
      console.error('获取用户租户列表错误:', error);
      throw error;
    }
  }

  /**
   * 更新租户信息
   * @param {string} tenantId 租户ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的租户
   */
  async updateTenant(tenantId, updateData) {
    const allowedFields = ['name', 'settings', 'plan', 'status'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('没有有效的更新字段');
    }

    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        ...filteredData,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 删除租户（软删除）
   * @param {string} tenantId 租户ID
   */
  async deleteTenant(tenantId) {
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 检查子域名可用性
   * @param {string} subdomain 子域名
   * @returns {Promise<Object>} 检查结果
   */
  async checkSubdomainAvailability(subdomain) {
    try {
      console.log('检查子域名可用性:', subdomain);
      console.log('systemMode 对象:', systemMode);
      console.log('systemMode 类型:', typeof systemMode);
      console.log('systemMode 是否存在:', !!systemMode);
      console.log('systemMode.isSingleStore 类型:', typeof systemMode?.isSingleStore);
      console.log('systemMode.isMultiTenant 类型:', typeof systemMode?.isMultiTenant);
      
      // 检查 systemMode 是否正确定义
      if (!systemMode || typeof systemMode.isSingleStore !== 'function') {
        console.error('systemMode 对象未正确定义或初始化');
        console.error('systemMode 值:', systemMode);
        console.error('systemMode.isSingleStore:', systemMode?.isSingleStore);
        return {
          available: false,
          message: '系统配置错误：systemMode 对象未正确定义',
          systemMode: 'unknown',
        };
      }
      
      // 检查系统模式
      if (systemMode.isSingleStore()) {
        return {
          available: false,
          message: '当前系统为单店版，不支持子域名注册',
          systemMode: 'single',
        };
      }
      
      await this.validateSubdomain(subdomain);
      return {
        available: true,
        message: '子域名可用',
        systemMode: 'multi',
      };
    } catch (error) {
      console.log('子域名检查错误详情:');
      console.log('错误消息:', error.message);
      console.log('错误堆栈:', error.stack);
      console.log('错误类型:', error.constructor.name);
      
      // 安全获取系统模式
      const currentMode = systemMode && typeof systemMode.getMode === 'function' 
        ? systemMode.getMode() 
        : 'unknown';
      
      return {
        available: false,
        message: error.message,
        systemMode: currentMode,
      };
    }
  }

  /**
   * 获取租户统计信息
   * @param {string} tenantId 租户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getTenantStats(tenantId) {
    const tenant = await this.getTenant(tenantId);

    // 获取用户数量
    const userCount = await db.userTenant.count({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    // 计算试用剩余天数
    const trialDaysLeft = tenant.trialEndsAt 
      ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      userCount,
      trialDaysLeft,
      plan: tenant.plan,
      status: tenant.status,
      createdAt: tenant.createdAt,
      trialEndsAt: tenant.trialEndsAt,
    };
  }

  /**
   * 添加用户到租户
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {string} role 角色 (OWNER|ADMIN|MANAGER|STAFF)
   * @returns {Promise<Object>} 用户租户关联
   */
  async addUserToTenant(tenantId, userId, role = 'STAFF') {
    const validRoles = ['ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
    if (!validRoles.includes(role)) {
      throw new Error('无效的角色');
    }

    // 检查是否已存在
    const existing = await db.userTenant.findFirst({
      where: {
        tenantId,
        userId,
      },
    });

    if (existing) {
      throw new Error('用户已在该租户中');
    }

    return await db.userTenant.create({
      data: {
        tenantId,
        userId,
        role,
        status: 'INVITED',
        invitedAt: new Date(),
      },
    });
  }

  /**
   * 从租户移除用户
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   */
  async removeUserFromTenant(tenantId, userId) {
    return await db.userTenant.updateMany({
      where: {
        tenantId,
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'REMOVED',
        removedAt: new Date(),
      },
    });
  }

  /**
   * 更新用户在租户中的角色
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {string} role 新角色
   */
  async updateUserRole(tenantId, userId, role) {
    const validRoles = ['ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
    if (!validRoles.includes(role)) {
      throw new Error('无效的角色');
    }

    return await db.userTenant.updateMany({
      where: {
        tenantId,
        userId,
        status: 'ACTIVE',
      },
      data: {
        role,
        updatedAt: new Date(),
      },
    });
  }
}

// 导出默认实例
export default new TenantService();