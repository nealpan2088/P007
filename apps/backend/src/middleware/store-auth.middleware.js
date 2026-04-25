/**
 * 店铺级认证中间件
 * 用于店长（STORE_ADMIN）等店铺级角色的权限校验
 * 
 * 权限链：SUPER_ADMIN（通吃）> TENANT_ADMIN（该租户下所有店）> STORE_ADMIN（单店）
 * 所有校验实时查库，不依赖 token 中的缓存角色
 */
import { publicDb } from '../db/index.js';

/**
 * 获取用户对某个店铺的访问权限
 * 返回：{ access: boolean, role: string | null, tenantId: string | null }
 */
async function getStoreAccess(request, storeId) {
  
  if (!publicDb) throw new Error('数据库连接不可用');
  if (!request.user) return { access: false, role: null, tenantId: null };

  const userId = request.user.id;
  const userRole = request.user.role;

  // SUPER_ADMIN：通吃所有店
  if (userRole === 'SUPER_ADMIN') {
    const store = await publicDb.store.findUnique({ where: { id: storeId } });
    if (!store) return { access: false, role: null, tenantId: null };
    return { access: true, role: 'SUPER_ADMIN', tenantId: store.tenantId };
  }

  // 查店铺信息
  const store = await publicDb.store.findUnique({ where: { id: storeId } });
  if (!store) return { access: false, role: null, tenantId: null };

  // TENANT_ADMIN：检查是否是该租户的管理员
  if (userRole === 'TENANT_ADMIN') {
    const userTenant = await publicDb.userTenant.findFirst({
      where: {
        userId,
        tenantId: store.tenantId,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });
    if (userTenant) {
      return { access: true, role: 'TENANT_ADMIN', tenantId: store.tenantId };
    }
  }

  // STORE_ADMIN：检查 UserStore 关联
  const storeAssignment = await publicDb.userStore.findFirst({
    where: {
      userId,
      storeId,
      status: 'ACTIVE',
    },
  });
  if (storeAssignment) {
    return { access: true, role: storeAssignment.role, tenantId: store.tenantId };
  }

  return { access: false, role: null, tenantId: null };
}

/**
 * 店铺访问中间件
 * 要求用户必须有指定店铺的访问权限
 * @param {Object} options
 * @param {string} options.storeIdParam - storeId 的参数字段名（默认 'storeId'）
 * @param {string[]} options.allowedRoles - 允许的角色（默认所有店铺级角色）
 */
export function requireStoreAccess(options = {}) {
  const { storeIdParam = 'storeId', allowedRoles = null } = options;

  return async function (request, reply) {
    try {
      const storeId = request.params[storeIdParam] || request.query[storeIdParam] || request.body?.[storeIdParam];
      if (!storeId) {
        return reply.status(400).send({
          success: false,
          error: '缺少店铺ID',
          code: 'MISSING_STORE_ID',
        });
      }

      const access = await getStoreAccess(request, storeId);
      if (!access.access) {
        return reply.status(403).send({
          success: false,
          error: '无权访问该店铺',
          code: 'STORE_ACCESS_DENIED',
        });
      }

      // 如果指定了角色限制，进一步校验
      if (allowedRoles && !allowedRoles.includes(access.role)) {
        return reply.status(403).send({
          success: false,
          error: '权限不足，需要更高级别的店铺角色',
          code: 'STORE_ROLE_INSUFFICIENT',
        });
      }

      // 将店铺信息附加到请求上
      request.storeAccess = access;
      return;
    } catch (error) {
      request.log.error({ msg: '店铺权限检查失败', error: error.message });
      return reply.status(500).send({
        success: false,
        error: '店铺权限检查失败',
        code: 'STORE_AUTH_ERROR',
      });
    }
  };
}

/**
 * 获取用户可管理的店铺列表
 * 用于前端店长登录后获取自己的店铺
 */
export async function getMyStores(request, reply) {
  try {
    
    if (!request.user) {
      return reply.status(401).send({ success: false, error: '未认证' });
    }

    const userId = request.user.id;
    const userRole = request.user.role;

    let stores;

    if (userRole === 'SUPER_ADMIN') {
      // 超管：所有店铺（不分页，只取基础信息）
      stores = await publicDb.store.findMany({
        include: { tenant: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userRole === 'TENANT_ADMIN') {
      // 租管：所有管理的租户下的店铺
      const userTenants = await publicDb.userTenant.findMany({
        where: { userId, status: 'ACTIVE', role: { in: ['OWNER', 'ADMIN'] } },
        select: { tenantId: true },
      });
      const tenantIds = userTenants.map(ut => ut.tenantId);
      stores = await publicDb.store.findMany({
        where: { tenantId: { in: tenantIds } },
        include: { tenant: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // 店长（或普通用户）：仅获取 UserStore 关联的店铺
      const assignments = await publicDb.userStore.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { storeId: true },
      });
      const storeIds = assignments.map(a => a.storeId);
      stores = await publicDb.store.findMany({
        where: { id: { in: storeIds } },
        include: { tenant: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return { success: true, data: stores };
  } catch (error) {
    request.log.error({ msg: '获取店铺列表失败', error: error.message });
    return reply.status(500).send({ success: false, error: '获取店铺列表失败' });
  }
}

export default {
  requireStoreAccess,
  getMyStores,
};
