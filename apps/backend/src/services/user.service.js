// 用户服务 - 超管后台用户管理
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取全平台用户列表（分页、搜索、角色过滤）
 */
export async function getUsers({ page = 1, pageSize = 20, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const skip = (page - 1) * pageSize;

  const where = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { username: { contains: search } },
      { fullName: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        userTenants: {
          include: {
            tenant: { select: { id: true, name: true, subdomain: true, plan: true, status: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      // 关联的租户信息
      tenants: u.userTenants.map(ut => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        subdomain: ut.tenant.subdomain,
        plan: ut.tenant.plan,
        role: ut.role,
        status: ut.tenant.status,
      })),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取用户详情（含租户信息）
 */
export async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userTenants: {
        include: {
          tenant: {
            include: {
              _count: { select: { stores: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: user.lockedUntil,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    tenants: user.userTenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      subdomain: ut.tenant.subdomain,
      plan: ut.tenant.plan,
      role: ut.role,
      storeCount: ut.tenant._count.stores,
      createdAt: ut.createdAt,
    })),
  };
}
