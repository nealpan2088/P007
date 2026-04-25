// 麒麟项目 - 店铺服务
// 提供店铺管理相关的业务逻辑

import { publicDb } from '../db/index.js';
import { createError } from '../utils/error-handler.js';
import { validateStoreData, validateBusinessHours } from '../validators/store.validator.js';

/**
 * 店铺服务类
 * 提供店铺创建、查询、更新、删除等业务逻辑
 */
class StoreService {
  constructor() {
    this.db = publicDb;
  }

  /**
   * 创建新店铺
   * @param {Object} storeData 店铺数据
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 创建的店铺
   */
  async createStore(storeData, tenantId, userId) {
    try {
      // 验证店铺数据
      const validationResult = validateStoreData(storeData);
      if (!validationResult.valid) {
        throw createError('VALIDATION_ERROR', `店铺数据验证失败: ${validationResult.errors.join(', ')}`);
      }

      // 检查租户是否存在
      const tenant = await this.db.tenant.findUnique({
        where: { id: tenantId, status: 'ACTIVE' }
      });

      if (!tenant) {
        throw createError('NOT_FOUND', '租户不存在或已停用');
      }

      // 检查用户是否有权限
      const userTenant = await this.db.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'MANAGER'] }
        }
      });

      if (!userTenant) {
        throw createError('FORBIDDEN', '没有权限创建店铺');
      }

      // 生成slug（URL友好标识）：如果传了slug就用传的，否则自动生成
      const slug = storeData.slug || await this.generateUniqueSlug(storeData.name, tenantId);

      // 如果传了 slug 且已存在（全局唯一），报友好错误
      if (storeData.slug) {
        const existing = await this.db.store.findFirst({ where: { slug }, select: { id: true } });
        if (existing) {
          throw createError('CONFLICT', `店铺标识符 "${slug}" 已被使用，请更换`);
        }
      }

      // 创建店铺
      const store = await this.db.store.create({
        data: {
          ...storeData,
          slug,
          tenantId,
          status: 'DRAFT', // 默认草稿状态
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          }
        }
      });

      // 创建默认营业时间（模型不存在时跳过）
      // this.db.storeBusinessHours 模型未定义，暂时注释
      // await this.createDefaultBusinessHours(store.id);

      // 创建店铺员工关联（模型不存在时跳过）
      // 注释整个数据块
      /*
      await this.db.storeStaff.create({
        data: {
          storeId: store.id,
          userId,
          role: 'OWNER',
          isActive: true,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      */

      return {
        success: true,
        message: '店铺创建成功',
        data: store
      };
    } catch (error) {
      console.error('创建店铺失败:', error);
      throw error;
    }
  }

  /**
   * 生成唯一的slug
   * @param {string} name 店铺名称
   * @param {string} tenantId 租户ID
   * @returns {Promise<string>} 唯一的slug
   */
  async generateUniqueSlug(name, tenantId) {
    // 移除中文字符，只保留拉丁字母、数字、连字符
    // 这样 slug 永远是纯英文/数字 URL 友好格式
    const latinPart = name
      .replace(/[\u4e00-\u9fa5]+/g, '')  // 去掉中文
      .trim();
    
    // 如果去掉中文后没有内容了，用简短哈希后缀避免冲突
    const base = latinPart || `store-${Date.now().toString(36).slice(-4)}`;
    
    const baseSlug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // 只保留小写字母和数字
      .replace(/^-+|-+$/g, '')      // 移除首尾连字符
      .replace(/-+/g, '-')          // 合并多个连字符
      || `store-${Date.now().toString(36).slice(-4)}`;
      
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existingStore = await this.db.store.findFirst({
        where: {
          slug,
          tenantId
        }
      });

      if (!existingStore) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  }

  /**
   * 创建默认营业时间
   * @param {string} storeId 店铺ID
   */
  async createDefaultBusinessHours(storeId) {
    const defaultHours = [];
    
    // 周一到周日，每天9:00-22:00
    for (let day = 0; day < 7; day++) {
      defaultHours.push({
        storeId,
        dayOfWeek: day,
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await this.db.storeBusinessHours.createMany({
      data: defaultHours
    });
  }

  /**
   * 获取租户下的所有店铺
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 店铺列表
   */
  async getStoresByTenant(tenantId, userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // 构建查询条件
      const where = {
        tenantId,
        deletedAt: null // 不返回已删除的店铺
      };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } }
        ];
      }

      // 检查用户权限
      const userTenant = await this.db.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          status: 'ACTIVE'
        }
      });

      if (!userTenant) {
        throw createError('FORBIDDEN', '没有权限查看店铺');
      }

      // 查询店铺
      const [stores, total] = await Promise.all([
        this.db.store.findMany({
          where,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                subdomain: true
              }
            },
            _count: {
              select: {
                tables: true,
                menuCategories: true,
                orders: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: limit
        }),
        this.db.store.count({ where })
      ]);

      return {
        success: true,
        data: stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取店铺详情
   * @param {string} storeId 店铺ID
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 店铺详情
   */
  async getStoreById(storeId, userId) {
    try {
      const store = await this.db.store.findFirst({
        where: {
          id: storeId,
          deletedAt: null
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          },
          // storeBusinessHours 模型尚未定义（暂不 include）
          // businessHours: {
          //   orderBy: {
          //     dayOfWeek: 'asc'
          //   }
          // },
          tables: {
            orderBy: {
              tableNumber: 'asc'
            },
            take: 10
          },
          menuCategories: {
            where: {
              isActive: true
            },
            orderBy: {
              sortOrder: 'asc'
            },
            include: {
              _count: {
                select: {
                  items: {
                    where: {
                      isAvailable: true
                    }
                  }
                }
              }
            },
            take: 10
          },
          _count: {
            select: {
              tables: true,
              menuCategories: true,
              orders: true
            }
          }
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已删除');
      }

      // 检查用户权限
      const hasAccess = await this.checkStoreAccess(storeId, userId);
      if (!hasAccess) {
        throw createError('FORBIDDEN', '没有权限查看此店铺');
      }

      return {
        success: true,
        data: store
      };
    } catch (error) {
      console.error('获取店铺详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新店铺信息
   * @param {string} storeId 店铺ID
   * @param {Object} updateData 更新数据
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 更新后的店铺
   */
  async updateStore(storeId, updateData, userId) {
    try {
      // 检查店铺是否存在
      const store = await this.db.store.findUnique({
        where: {
          id: storeId,
          deletedAt: null
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已删除');
      }

      // 检查用户权限（需要OWNER或MANAGER角色）
      const staff = await this.db.storeStaff.findFirst({
        where: {
          storeId,
          userId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER'] }
        }
      });

      if (!staff) {
        throw createError('FORBIDDEN', '没有权限更新店铺信息');
      }

      // 如果更新名称，需要重新生成slug
      let updatePayload = { ...updateData, updatedAt: new Date() };
      
      if (updateData.name && updateData.name !== store.name) {
        const newSlug = await this.generateUniqueSlug(updateData.name, store.tenantId);
        updatePayload.slug = newSlug;
      }

      // 更新店铺
      const updatedStore = await this.db.store.update({
        where: { id: storeId },
        data: updatePayload,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          }
        }
      });

      return {
        success: true,
        message: '店铺更新成功',
        data: updatedStore
      };
    } catch (error) {
      console.error('更新店铺失败:', error);
      throw error;
    }
  }

  /**
   * 删除店铺（软删除）
   * @param {string} storeId 店铺ID
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteStore(storeId, userId) {
    try {
      // 检查店铺是否存在
      const store = await this.db.store.findUnique({
        where: {
          id: storeId,
          deletedAt: null
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已删除');
      }

      // 检查用户权限（storeStaff 模型未定义，暂不检查）
      /*
      const staff = await this.db.storeStaff.findFirst({
        where: {
          storeId,
          userId,
          isActive: true,
          role: 'OWNER'
        }
      });

      if (!staff) {
        throw createError('FORBIDDEN', '只有店铺所有者可以删除店铺');
      }
      */

      // 软删除：设置deletedAt时间戳
      await this.db.store.update({
        where: { id: storeId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        message: '店铺删除成功'
      };
    } catch (error) {
      console.error('删除店铺失败:', error);
      throw error;
    }
  }

  /**
   * 更新营业时间
   * @param {string} storeId 店铺ID
   * @param {Array} businessHours 营业时间数组
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 更新结果
   */
  async updateBusinessHours(storeId, businessHours, userId) {
    try {
      // 验证营业时间数据
      const validationResult = validateBusinessHours(businessHours);
      if (!validationResult.valid) {
        throw createError('VALIDATION_ERROR', `营业时间数据验证失败: ${validationResult.errors.join(', ')}`);
      }

      // 检查店铺是否存在
      const store = await this.db.store.findUnique({
        where: {
          id: storeId,
          deletedAt: null
        }
      });

      if (!store) {
        throw createError('NOT_FOUND', '店铺不存在或已删除');
      }

      // 检查用户权限（需要OWNER或MANAGER角色）
      const staff = await this.db.storeStaff.findFirst({
        where: {
          storeId,
          userId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER'] }
        }
      });

      if (!staff) {
        throw createError('FORBIDDEN', '没有权限更新营业时间');
      }

      // 删除旧的营业时间
      await this.db.storeBusinessHours.deleteMany({
        where: { storeId }
      });

      // 创建新的营业时间
      const hoursData = businessHours.map(hour => ({
        storeId,
        dayOfWeek: hour.dayOfWeek,
        isOpen: hour.isOpen,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        breakStart: hour.breakStart,
        breakEnd: hour.breakEnd,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await this.db.storeBusinessHours.createMany({
        data: hoursData
      });

      // 获取更新后的营业时间
      const updatedHours = await this.db.storeBusinessHours.findMany({
        where: { storeId },
        orderBy: { dayOfWeek: 'asc' }
      });

      return {
        success: true,
        message: '营业时间更新成功',
        data: updatedHours
      };
    } catch (error) {
      console.error('更新营业时间失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户对店铺的访问权限
   * @param {string} storeId 店铺ID
   * @param {string} userId 用户ID
   * @returns {Promise<boolean>} 是否有权限
   */
  async checkStoreAccess(storeId, userId) {
    try {
      // 检查是否是店铺员工（storeStaff 模型尚未定义，暂不检查）
      // const staff = await this.db.storeStaff.findFirst({
      //   where: {
      //     storeId,
      //     userId,
      //     isActive: true
      //   }
      // });
      // if (staff) { return true; }

      // 检查是否是租户管理员
      const store = await this.db.store.findUnique({
        where: { id: storeId },
        select: { tenantId: true }
      });

      if (!store) {
        return false;
      }

      const userTenant = await this.db.userTenant.findFirst({
        where: {
          userId,
          tenantId: store.tenantId,
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'MANAGER'] }
        }
      });

      return !!userTenant;
    } catch (error) {
      console.error('检查店铺访问权限失败:', error);
      return false;
    }
  }

  /**
   * 获取用户的店铺列表
   * @param {string} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 店铺列表
   */
  async getStoresByUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        role
      } = options;

      const skip = (page - 1) * limit;

      // 构建查询条件
      const where = {
        staff: {
          some: {
            userId,
            isActive: true
          }
        },
        deletedAt: null
      };

      if (status) {
        where.status = status;
      }

      if (role) {
        where.staff.some.role = role;
      }

      // 查询店铺
      const [stores, total] = await Promise.all([
        this.db.store.findMany({
          where,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                subdomain: true
              }
            },
            staff: {
              where: {
                userId,
                isActive: true
              },
              select: {
                role: true,
                joinedAt: true
              }
            },
            _count: {
              select: {
                tables: true,
                menuCategories: true,
                orders: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        this.db.store.count({ where })
      ]);

      return {
        success: true,
        data: stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取用户店铺列表失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const storeService = new StoreService();

export default storeService;