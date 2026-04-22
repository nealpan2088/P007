// 麒麟项目 - 优化后端服务
// 使用简化数据库Schema，查询真实数据

// 修复BigInt序列化问题
BigInt.prototype.toJSON = function() {
  return this.toString();
};

import dotenv from 'dotenv';
dotenv.config();
import fastify from 'fastify';
import cors from '@fastify/cors';
import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { PrismaClient } = pkg;

const app = fastify({ logger: true });

// 初始化Prisma客户端
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['query', 'info', 'warn', 'error']
});

// CORS
await app.register(cors, {
  origin: true,
  credentials: true
});

// 健康检查
app.get('/api/health', async () => {
  try {
    // 测试数据库连接
    const dbResult = await prisma.$queryRaw`SELECT 1 as test`;
    const dbConnected = dbResult && dbResult[0] && dbResult[0].test === 1;
    
    return { 
      status: 'ok', 
      service: 'qilin-optimized', 
      version: '0.2.5',
      database: dbConnected ? 'connected' : 'disconnected',
      mode: 'multi',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      status: 'ok', 
      service: 'qilin-optimized', 
      version: '0.2.5',
      database: 'error',
      mode: 'multi',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
});

// 获取租户列表（查询真实数据库）
app.get('/api/test/tenants', async (request, reply) => {
  try {
    console.log('查询真实租户数据...');
    
    // 使用简化视图查询
    const tenants = await prisma.$queryRaw`
      SELECT 
        id, name, subdomain, plan, status, created_at,
        store_count, user_count
      FROM tenant_simple_view
      ORDER BY created_at DESC
    `;
    
    return {
      success: true,
      message: '租户列表（真实数据库）',
      data: tenants,
      count: tenants.length,
      source: 'database'
    };
  } catch (error) {
    console.error('查询租户失败:', error);
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      data: []
    };
  }
});

// 获取店铺列表
app.get('/api/stores', async (request, reply) => {
  try {
    const stores = await prisma.$queryRaw`
      SELECT 
        s.id, s.name, s.slug, s.status, s.created_at,
        t.name as tenant_name, t.slug as tenant_slug
      FROM stores s
      JOIN tenants t ON s.tenant_id = t.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `;
    
    return {
      success: true,
      data: stores,
      count: stores.length
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
});

// 根据tenantSlug获取租户信息
app.get('/api/public/tenants/:tenantSlug', async (request, reply) => {
  try {
    const { tenantSlug } = request.params;
    
    const tenant = await prisma.$queryRaw`
      SELECT 
        id, name, slug, display_name, plan, status, 
        contact_email, contact_phone, contact_person,
        address, business_type, industry, created_at
      FROM tenants 
      WHERE slug = ${tenantSlug} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    if (tenant.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '租户不存在或已停用'
      });
    }
    
    // 获取租户的店铺数量
    const storeCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stores 
      WHERE tenant_id = ${tenant[0].id} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    return {
      success: true,
      data: {
        ...tenant[0],
        store_count: parseInt(storeCount[0].count) || 0
      }
    };
  } catch (error) {
    console.error('获取租户信息错误:', error);
    return reply.status(500).send({
      success: false,
      message: `获取租户信息失败: ${error.message}`
    });
  }
});

// 根据tenantSlug获取店铺菜单（自动选择默认店铺）
app.get('/api/public/tenants/:tenantSlug/menu', async (request, reply) => {
  try {
    const { tenantSlug } = request.params;
    const { storeSlug } = request.query; // 可选：指定店铺
    
    // 先获取租户ID
    const tenant = await prisma.$queryRaw`
      SELECT id FROM tenants 
      WHERE slug = ${tenantSlug} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    if (tenant.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '租户不存在或已停用'
      });
    }
    
    const tenantId = tenant[0].id;
    
    let store;
    
    // 如果指定了storeSlug，使用指定店铺
    if (storeSlug) {
      store = await prisma.$queryRaw`
        SELECT id, name, slug FROM stores 
        WHERE tenant_id = ${tenantId} 
          AND slug = ${storeSlug}
          AND deleted_at IS NULL
          AND status = 'ACTIVE'
        LIMIT 1
      `;
    } else {
      // 否则使用默认店铺（第一个活跃店铺）
      store = await prisma.$queryRaw`
        SELECT id, name, slug FROM stores 
        WHERE tenant_id = ${tenantId} 
          AND deleted_at IS NULL
          AND status = 'ACTIVE'
        ORDER BY created_at ASC
        LIMIT 1
      `;
    }
    
    if (store.length === 0) {
      return reply.status(404).send({
        success: false,
        message: storeSlug ? '指定店铺不存在' : '该租户没有可用的店铺'
      });
    }
    
    const storeId = store[0].id;
    
    // 获取店铺菜单（分类和菜品）
    const categories = await prisma.$queryRaw`
      SELECT 
        id, name, description, sort_order,
        (SELECT COUNT(*) FROM menu_items WHERE category_id = menu_categories.id AND deleted_at IS NULL) as item_count
      FROM menu_categories
      WHERE store_id = ${storeId} 
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const menuItems = await prisma.$queryRaw`
      SELECT 
        mi.id, mi.name, mi.description, CAST(mi.price AS float) as price, mi.image_url,
        mi.sort_order, mi.status, mi.is_available, mi.created_at,
        mc.name as category_name, mc.id as category_id
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mc.store_id = ${storeId} 
        AND mi.deleted_at IS NULL
        AND mi.status = 'AVAILABLE'
        AND mc.deleted_at IS NULL
      ORDER BY mc.sort_order ASC, mi.sort_order ASC, mi.created_at ASC
    `;
    
    // 按分类组织菜单
    const organizedMenu = categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.category_id === category.id)
    }));
    
    return {
      success: true,
      data: {
        tenant: {
          id: tenantId,
          slug: tenantSlug,
          name: tenant[0].name || tenantSlug
        },
        store: store[0],
        menu: organizedMenu,
        categories_count: categories.length,
        items_count: menuItems.length,
        url_type: storeSlug ? 'store_specific' : 'default_store'
      }
    };
  } catch (error) {
    console.error('获取租户菜单错误:', error);
    return reply.status(500).send({
      success: false,
      message: `获取菜单失败: ${error.message}`
    });
  }
});

// 店铺级API：明确指定店铺
app.get('/api/public/tenants/:tenantSlug/stores/:storeSlug/menu', async (request, reply) => {
  try {
    const { tenantSlug, storeSlug } = request.params;
    
    // 先获取租户ID
    const tenant = await prisma.$queryRaw`
      SELECT id FROM tenants 
      WHERE slug = ${tenantSlug} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    if (tenant.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '租户不存在或已停用'
      });
    }
    
    const tenantId = tenant[0].id;
    
    // 获取指定店铺
    const store = await prisma.$queryRaw`
      SELECT id, name, slug FROM stores 
      WHERE tenant_id = ${tenantId} 
        AND slug = ${storeSlug}
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
      LIMIT 1
    `;
    
    if (store.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '店铺不存在'
      });
    }
    
    const storeId = store[0].id;
    
    // 获取店铺菜单（分类和菜品）
    const categories = await prisma.$queryRaw`
      SELECT 
        id, name, description, sort_order,
        (SELECT COUNT(*) FROM menu_items WHERE category_id = menu_categories.id AND deleted_at IS NULL) as item_count
      FROM menu_categories
      WHERE store_id = ${storeId} 
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const menuItems = await prisma.$queryRaw`
      SELECT 
        mi.id, mi.name, mi.description, CAST(mi.price AS float) as price, mi.image_url,
        mi.sort_order, mi.status, mi.is_available, mi.created_at,
        mc.name as category_name, mc.id as category_id
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mc.store_id = ${storeId} 
        AND mi.deleted_at IS NULL
        AND mi.status = 'AVAILABLE'
        AND mc.deleted_at IS NULL
      ORDER BY mc.sort_order ASC, mi.sort_order ASC, mi.created_at ASC
    `;
    
    // 按分类组织菜单
    const organizedMenu = categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.category_id === category.id)
    }));
    
    return {
      success: true,
      data: {
        tenant: {
          id: tenantId,
          slug: tenantSlug,
          name: tenant[0].name || tenantSlug
        },
        store: store[0],
        menu: organizedMenu,
        categories_count: categories.length,
        items_count: menuItems.length,
        url_type: 'store_specific'
      }
    };
  } catch (error) {
    console.error('获取店铺菜单错误:', error);
    return reply.status(500).send({
      success: false,
      message: `获取菜单失败: ${error.message}`
    });
  }
});

// 根据tenantSlug和tableId获取餐桌信息
app.get('/api/public/tenants/:tenantSlug/tables/:tableId', async (request, reply) => {
  try {
    const { tenantSlug, tableId } = request.params;
    
    // 先获取租户ID
    const tenant = await prisma.$queryRaw`
      SELECT id FROM tenants 
      WHERE slug = ${tenantSlug} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    if (tenant.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '租户不存在或已停用'
      });
    }
    
    const tenantId = tenant[0].id;
    
    // 获取租户的默认店铺
    const store = await prisma.$queryRaw`
      SELECT id, name, slug FROM stores 
      WHERE tenant_id = ${tenantId} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    
    if (store.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '该租户没有可用的店铺'
      });
    }
    
    const storeId = store[0].id;
    
    // 获取餐桌信息
    const table = await prisma.$queryRaw`
      SELECT 
        id, table_number, table_name, capacity, status,
        description, location, created_at
      FROM tables
      WHERE store_id = ${storeId} 
        AND (table_number = ${tableId} OR table_name = ${tableId})
        AND deleted_at IS NULL
      LIMIT 1
    `;
    
    if (table.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '餐桌不存在'
      });
    }
    
    return {
      success: true,
      data: {
        tenant: {
          id: tenantId,
          slug: tenantSlug,
          name: tenant[0].name || tenantSlug
        },
        store: store[0],
        table: table[0]
      }
    };
  } catch (error) {
    console.error('获取餐桌信息错误:', error);
    return reply.status(500).send({
      success: false,
      message: `获取餐桌信息失败: ${error.message}`
    });
  }
});

// 根据tenantSlug创建订单
app.post('/api/public/tenants/:tenantSlug/orders', async (request, reply) => {
  try {
    const { tenantSlug } = request.params;
    const { tableId, items, customerName, customerPhone, notes } = request.body;
    
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({
        success: false,
        message: '餐桌号和菜品不能为空'
      });
    }
    
    // 先获取租户ID
    const tenant = await prisma.$queryRaw`
      SELECT id FROM tenants 
      WHERE slug = ${tenantSlug} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
    `;
    
    if (tenant.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '租户不存在或已停用'
      });
    }
    
    const tenantId = tenant[0].id;
    
    // 获取租户的默认店铺
    const store = await prisma.$queryRaw`
      SELECT id, name, slug FROM stores 
      WHERE tenant_id = ${tenantId} 
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    
    if (store.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '该租户没有可用的店铺'
      });
    }
    
    const storeId = store[0].id;
    
    // 验证餐桌存在
    const table = await prisma.$queryRaw`
      SELECT id FROM tables
      WHERE store_id = ${storeId} 
        AND (table_number = ${tableId} OR table_name = ${tableId})
        AND deleted_at IS NULL
      LIMIT 1
    `;
    
    if (table.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '餐桌不存在'
      });
    }
    
    const tableRecord = table[0];
    
    // 生成订单号
    const orderNumber = `TEN${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // 计算总金额
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const menuItem = await prisma.$queryRaw`
        SELECT id, name, price FROM menu_items
        WHERE id = ${item.menuItemId} 
          AND store_id = ${storeId}
          AND deleted_at IS NULL
          AND is_available = true
        LIMIT 1
      `;
      
      if (menuItem.length === 0) {
        return reply.status(400).send({
          success: false,
          message: `菜品ID ${item.menuItemId} 不存在或不可用`
        });
      }
      
      const itemTotal = menuItem[0].price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        menu_item_id: menuItem[0].id,
        menu_item_name: menuItem[0].name,
        quantity: item.quantity,
        unit_price: menuItem[0].price,
        total_price: itemTotal,
        special_instructions: item.specialInstructions || ''
      });
    }
    
    // 创建订单（简化事务处理）
    const order = await prisma.$queryRaw`
      INSERT INTO orders (
        order_number, store_id, table_id, 
        customer_name, customer_phone, notes,
        total_amount, status, created_at
      ) VALUES (
        ${orderNumber}, ${storeId}, ${tableRecord.id},
        ${customerName || ''}, ${customerPhone || ''}, ${notes || ''},
        ${totalAmount}, 'PENDING', CURRENT_TIMESTAMP
      )
      RETURNING id, order_number, total_amount, status, created_at
    `;
    
    const orderId = order[0].id;
    
    // 创建订单项
    for (const item of orderItems) {
      await prisma.$queryRaw`
        INSERT INTO order_items (
          order_id, menu_item_id, menu_item_name,
          quantity, unit_price, total_price,
          special_instructions, created_at
        ) VALUES (
          ${orderId}, ${item.menu_item_id}, ${item.menu_item_name},
          ${item.quantity}, ${item.unit_price}, ${item.total_price},
          ${item.special_instructions}, CURRENT_TIMESTAMP
        )
      `;
    }
    
    // 触发打印（简化处理）
    console.log(`订单 ${orderNumber} 已创建，总金额: ${totalAmount}，触发打印...`);
    
    return {
      success: true,
      message: '订单创建成功',
      data: {
        order: order[0],
        items: orderItems,
        tenant: {
          id: tenantId,
          slug: tenantSlug,
          name: tenant[0].name || tenantSlug
        },
        store: store[0],
        table: {
          id: tableRecord.id,
          number: tableId
        }
      }
    };
    
  } catch (error) {
    console.error('创建订单错误:', error);
    return reply.status(500).send({
      success: false,
      message: `创建订单失败: ${error.message}`
    });
  }
});

// 检查租户标识符（slug）可用性
app.post('/api/v1/tenant/check-slug', async (request, reply) => {
  try {
    const { slug } = request.body;
    
    if (!slug || typeof slug !== 'string') {
      return reply.status(400).send({
        success: false,
        message: '租户标识符参数无效'
      });
    }
    
    // 验证slug格式（URL路径标识符）
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!slugRegex.test(slug)) {
      return reply.status(400).send({
        success: false,
        message: '租户标识符格式无效，只能包含小写字母、数字和连字符，且不能以连字符开头或结尾'
      });
    }
    
    if (slug.length < 3 || slug.length > 30) {
      return reply.status(400).send({
        success: false,
        message: '租户标识符长度必须在3-30个字符之间'
      });
    }
    
    // 检查slug是否已存在
    const existingTenant = await prisma.$queryRaw`
      SELECT id, name, slug FROM tenants 
      WHERE slug = ${slug} 
        AND deleted_at IS NULL
    `;
    
    const available = existingTenant.length === 0;
    
    return {
      success: true,
      data: {
        available,
        slug,
        suggestion: available ? null : `${slug}${Math.floor(Math.random() * 1000)}`,
        url: available ? `http://localhost:5177/t/${slug}` : null
      },
      message: available ? '租户标识符可用' : '租户标识符已被占用'
    };
  } catch (error) {
    console.error('检查租户标识符错误:', error);
    return reply.status(500).send({
      success: false,
      message: `检查租户标识符失败: ${error.message}`
    });
  }
});

// 保持向后兼容（临时）
app.post('/api/v1/tenant/check-subdomain', async (request, reply) => {
  try {
    const { subdomain } = request.body;
    return reply.send({
      success: true,
      data: {
        available: false,
        subdomain,
        suggestion: `${subdomain}-new`,
        message: '子域名模式已弃用，请使用租户标识符（slug）'
      }
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: `检查失败: ${error.message}`
    });
  }
});

// 租户注册（公开API）
app.post('/api/v1/tenant/register', async (request, reply) => {
  try {
    const { tenant, owner } = request.body;
    
    // 验证必要字段
    if (!tenant || !tenant.name || !tenant.slug) {
      return reply.status(400).send({
        success: false,
        message: '租户名称和标识符是必需的'
      });
    }

    if (!owner || !owner.email || !owner.password) {
      return reply.status(400).send({
        success: false,
        message: '所有者邮箱和密码是必需的'
      });
    }
    
    // 验证slug格式（URL路径标识符）
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!slugRegex.test(tenant.slug)) {
      return reply.status(400).send({
        success: false,
        message: '租户标识符格式无效，只能包含小写字母、数字和连字符，且不能以连字符开头或结尾'
      });
    }
    
    if (tenant.slug.length < 3 || tenant.slug.length > 30) {
      return reply.status(400).send({
        success: false,
        message: '租户标识符长度必须在3-30个字符之间'
      });
    }
    
    // 检查slug是否已存在
    const existingTenant = await prisma.$queryRaw`
      SELECT id FROM tenants 
      WHERE slug = ${tenant.slug} 
        AND deleted_at IS NULL
    `;
    
    if (existingTenant.length > 0) {
      return reply.status(400).send({
        success: false,
        message: '租户标识符已被占用，请选择其他标识符'
      });
    }
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users 
      WHERE email = ${owner.email} 
        AND deleted_at IS NULL
    `;
    
    if (existingUser.length > 0) {
      return reply.status(400).send({
        success: false,
        message: '邮箱已被注册，请使用其他邮箱'
      });
    }
    
    // 开始事务 - 创建租户和用户
    // 注意：简化版本，实际生产环境需要更完整的事务处理
    
    // 1. 创建租户（使用slug作为路径标识符）
    const newTenant = await prisma.$queryRaw`
      INSERT INTO tenants (
        name, slug, display_name, subdomain, plan, status, contact_email
      ) VALUES (
        ${tenant.name}, ${tenant.slug}, ${tenant.name},
        ${tenant.slug}, ${tenant.plan || 'FREE'}, 'ACTIVE', ${owner.email}
      )
      RETURNING id, name, slug, display_name, plan, status, created_at
    `;
    
    // 2. 创建用户（简化密码处理，实际需要bcrypt加密）
    const passwordHash = `hashed_${owner.password}_placeholder`; // 简化处理
    
    const newUser = await prisma.$queryRaw`
      INSERT INTO users (
        email, username, full_name, password_hash, role, status
      ) VALUES (
        ${owner.email}, ${owner.username || owner.email.split('@')[0]},
        ${owner.fullName || ''}, ${passwordHash}, 'OWNER', 'ACTIVE'
      )
      RETURNING id, email, username, full_name, role, status
    `;
    
    // 3. 关联用户和租户
    await prisma.$queryRaw`
      INSERT INTO user_tenants (user_id, tenant_id, role, status)
      VALUES (${newUser[0].id}, ${newTenant[0].id}, 'OWNER', 'ACTIVE')
    `;
    
    // 4. 创建默认店铺
    const defaultStore = await prisma.$queryRaw`
      INSERT INTO stores (
        tenant_id, name, slug, status
      ) VALUES (
        ${newTenant[0].id}, ${tenant.name + '总店'}, 
        ${tenant.subdomain + '-main'}, 'ACTIVE'
      )
      RETURNING id, name, slug
    `;
    
    return {
      success: true,
      message: '租户注册成功',
      data: {
        tenant: newTenant[0],
        owner: {
          ...newUser[0],
          password: undefined // 不返回密码
        },
        defaultStore: defaultStore[0],
        loginUrl: `http://localhost:5177/auth/login`,
        tenantUrl: `http://localhost:5177/t/${tenant.slug}`,
        scanUrl: `http://localhost:5177/t/${tenant.slug}/scan/A01`
      }
    };
    
  } catch (error) {
    console.error('租户注册错误:', error);
    return reply.status(500).send({
      success: false,
      message: `租户注册失败: ${error.message}`
    });
  }
});

// 扫码点餐：获取店铺菜单（使用优化视图）
// 扫码点餐：获取店铺详情
app.get('/api/public/stores/:storeSlug', async (request) => {
  const { storeSlug } = request.params;
  
  try {
    const store = await prisma.$queryRaw`
      SELECT id, name, slug, description, address, phone, status
      FROM stores 
      WHERE slug = ${storeSlug} 
        AND deleted_at IS NULL 
        AND status = 'ACTIVE'
    `;
    
    if (!store || store.length === 0) {
      return {
        success: false,
        message: '店铺不存在或已停用'
      };
    }
    
    return {
      success: true,
      data: store[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// 扫码点餐：获取餐桌信息
app.get('/api/public/stores/:storeSlug/tables/:tableCode', async (request) => {
  const { storeSlug, tableCode } = request.params;
  
  try {
    const table = await prisma.$queryRaw`
      SELECT t.id, t.code, t.table_number, t.capacity, t.status, t.description
      FROM tables t
      JOIN stores s ON t.store_id = s.id
      WHERE s.slug = ${storeSlug}
        AND (t.code = ${tableCode} OR t.table_number = ${tableCode})
        AND t.deleted_at IS NULL
        AND s.deleted_at IS NULL
    `;
    
    if (!table || table.length === 0) {
      return {
        success: false,
        message: '餐桌不存在'
      };
    }
    
    return {
      success: true,
      data: table[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});
app.get('/api/public/stores/:storeSlug/menu', async (request) => {
  const { storeSlug } = request.params;
  
  try {
    // 首先获取店铺信息
    const store = await prisma.$queryRaw`
      SELECT id, name, slug, description, address, phone
      FROM stores 
      WHERE slug = ${storeSlug} 
        AND deleted_at IS NULL 
        AND status = 'ACTIVE'
    `;
    
    if (!store || store.length === 0) {
      return {
        success: false,
        message: '店铺不存在或已停用',
        data: null
      };
    }
    
    // 使用优化视图获取菜单
    const menuItems = await prisma.$queryRaw`
      SELECT 
        menu_id as id, menu_name as name, menu_description as description,
        menu_price as price, menu_image as image_url,
        category_id, category_name, category_sort
      FROM store_menu_view 
      WHERE store_slug = ${storeSlug}
      ORDER BY category_sort, menu_sort
    `;
    
    // 按分类分组
    const categories = {};
    menuItems.forEach(item => {
      if (!categories[item.category_id]) {
        categories[item.category_id] = {
          id: item.category_id,
          name: item.category_name,
          sort_order: item.category_sort,
          items: []
        };
      }
      categories[item.category_id].items.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        image_url: item.image_url
      });
    });
    
    return {
      success: true,
      data: {
        store: store[0],
        categories: Object.values(categories)
      }
    };
  } catch (error) {
    console.error('获取菜单失败:', error);
    return {
      success: false,
      message: `获取菜单失败: ${error.message}`,
      data: null
    };
  }
});

// 创建订单（扫码点餐核心功能）
app.post('/api/public/orders', async (request, reply) => {
  const { store_id, table_code, items, customer_name, customer_phone, notes } = request.body;
  
  try {
    // 1. 查找店铺 - 支持ID或slug
    let store;
    if (isNaN(store_id)) {
      store = await prisma.$queryRaw`
        SELECT id, name FROM stores 
        WHERE slug = ${store_id} 
          AND deleted_at IS NULL 
          AND status = 'ACTIVE'
      `;
    } else {
      store = await prisma.$queryRaw`
        SELECT id, name FROM stores 
        WHERE id = ${parseInt(store_id)} 
          AND deleted_at IS NULL 
          AND status = 'ACTIVE'
      `;
    }
    
    if (!store || store.length === 0) {
      return reply.status(404).send({
        success: false,
        message: '店铺不存在或已停用'
      });
    }
    
    const storeId = store[0].id;
    const storeName = store[0].name;
    
    // 2. 验证餐桌
    let tableDbId = null;
    if (table_code) {
      const table = await prisma.$queryRaw`
        SELECT id FROM tables 
        WHERE store_id = ${storeId} 
          AND (code = ${table_code} OR table_number = ${table_code})
          AND deleted_at IS NULL
      `;
      if (table && table.length > 0) {
        tableDbId = table[0].id;
      }
    }
    
    // 3. 验证菜单项
    const validatedItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      const menuItem = await prisma.$queryRaw`
        SELECT id, name, price FROM menu_items 
        WHERE id = ${parseInt(item.menu_item_id)} 
          AND deleted_at IS NULL 
          AND status = 'AVAILABLE'
      `;
      
      if (!menuItem || menuItem.length === 0) {
        return reply.status(400).send({
          success: false,
          message: '菜单项 ' + item.menu_item_id + ' 不存在或不可用'
        });
      }
      
      const price = parseFloat(menuItem[0].price);
      const quantity = parseInt(item.quantity) || 1;
      
      validatedItems.push({
        menu_item_id: item.menu_item_id,
        name: menuItem[0].name,
        price: price,
        quantity: quantity,
        special_instructions: item.special_instructions || ''
      });
      
      totalAmount += price * quantity;
    }
    
    // 4. 生成订单号
    const orderNumber = 'PUB' + Date.now() + Math.floor(Math.random() * 1000);
    
    // 5. 创建订单
    const order = await prisma.$queryRaw`
      INSERT INTO orders (store_id, order_number, table_id, customer_name, customer_phone, items, total_amount, status, notes, created_at)
      VALUES (${storeId}, ${orderNumber}, ${tableDbId}, ${customer_name || ''}, ${customer_phone || ''}, ${JSON.stringify(validatedItems)}::jsonb, ${totalAmount}, 'PENDING', ${notes || ''}, NOW())
      RETURNING id, order_number, table_id, total_amount, status, created_at
    `;
    
    return {
      success: true,
      message: '订单创建成功',
      data: order[0],
      printInfo: {
        orderNumber: order[0].order_number,
        storeName: storeName,
        tableCode: table_code,
        totalAmount: totalAmount,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('订单创建错误:', error);
    return reply.status(500).send({
      success: false,
      message: '订单创建失败',
      error: error.message
    });
  }
});
app.get('/api/public/orders/:orderNumber/status', async (request) => {
  const { orderNumber } = request.params;
  
  try {
    const order = await prisma.$queryRaw`
      SELECT 
        o.id, o.order_number, o.table_id, o.status, o.total_amount,
        o.items, o.created_at, o.updated_at,
        s.name as store_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.order_number = ${orderNumber}
        AND o.deleted_at IS NULL
    `;
    
    if (!order || order.length === 0) {
      return {
        success: false,
        message: '订单不存在'
      };
    }
    
    return {
      success: true,
      data: order[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// 店铺统计信息（使用优化视图）
app.get('/api/stores/:storeId/stats', async (request) => {
  const { storeId } = request.params;
  
  try {
    const stats = await prisma.$queryRaw`
      SELECT * FROM store_stats_view 
      WHERE store_id = ${parseInt(storeId)}
    `;
    
    return {
      success: true,
      data: stats[0] || {}
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// ====== 菜品模板管理 API (总部统一管控) ======

// 1. 上传菜品图片
app.post('/api/v1/upload/menu-image', async (request, reply) => {
  const { tenant_id, image_base64, filename } = request.body;
  
  if (!image_base64) {
    return reply.status(400).send({ success: false, message: '缺少图片数据' });
  }
  
  try {
    const uploadDir = path.join(import.meta.dirname, 'uploads', 'menu');
    const ext = filename ? path.extname(filename) : '.jpg';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, safeName);
    
    // 解码 base64
    const matches = image_base64.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,(.+)$/);
    let buffer;
    if (matches) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image_base64, 'base64');
    }
    
    // 写入文件
    fs.writeFileSync(filePath, buffer);
    
    const url = `/uploads/menu/${safeName}`;
    
    return {
      success: true,
      data: { url, filename: safeName }
    };
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 2. 获取租户的菜品模板列表
app.get('/api/v1/tenant/:tenantId/menu-templates', async (request) => {
  const { tenantId } = request.params;
  
  try {
    const categories = await prisma.$queryRaw`
      SELECT DISTINCT mt.category_name, mt.category_icon
      FROM menu_templates mt
      LEFT JOIN menu_category_templates mct ON mct.tenant_id = ${parseInt(tenantId)} AND mct.name = mt.category_name
      WHERE mt.tenant_id = ${parseInt(tenantId)} AND mt.deleted_at IS NULL
      ORDER BY mt.category_name
    `;
    
    const items = await prisma.$queryRaw`
      SELECT mt.id, mt.category_name, mt.name, mt.description, mt.price, mt.image_url, mt.sort_order, mt.is_available
      FROM menu_templates mt
      WHERE mt.tenant_id = ${parseInt(tenantId)} AND mt.deleted_at IS NULL
      ORDER BY mt.category_name, mt.sort_order, mt.name
    `;
    
    return {
      success: true,
      data: { categories, items }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 3. 创建/更新菜品模板
app.post('/api/v1/tenant/:tenantId/menu-templates', async (request, reply) => {
  const { tenantId } = request.params;
  const { id, category_name, name, description, price, image_url, sort_order } = request.body;
  
  try {
    if (id) {
      // 更新
      await prisma.$executeRaw`
        UPDATE menu_templates 
        SET category_name = ${category_name}, name = ${name}, description = ${description || ''}, 
            price = ${price}, image_url = ${image_url || ''}, sort_order = ${sort_order || 0},
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${parseInt(tenantId)}
      `;
      return { success: true, message: '更新成功' };
    } else {
      // 创建
      const result = await prisma.$executeRaw`
        INSERT INTO menu_templates (tenant_id, category_name, name, description, price, image_url, sort_order)
        VALUES (${parseInt(tenantId)}, ${category_name}, ${name}, ${description || ''}, ${price}, ${image_url || ''}, ${sort_order || 0})
        RETURNING id
      `;
      return { success: true, message: '创建成功', data: { id: result } };
    }
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 4. 删除菜品模板
app.delete('/api/v1/menu-templates/:id', async (request, reply) => {
  const { id } = request.params;
  
  try {
    await prisma.$executeRaw`
      UPDATE menu_templates SET deleted_at = NOW() WHERE id = ${parseInt(id)}
    `;
    return { success: true, message: '删除成功' };
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 5. 获取分店菜品配置（哪些上架了，哪些售罄）
app.get('/api/v1/store/:storeId/menu-config', async (request) => {
  const { storeId } = request.params;
  
  try {
    const config = await prisma.$queryRaw`
      SELECT smi.template_id, smi.is_active, smi.is_sold_out, smi.custom_price, smi.sort_order
      FROM store_menu_items smi
      WHERE smi.store_id = ${parseInt(storeId)} AND smi.deleted_at IS NULL
    `;
    return { success: true, data: config };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 6. 更新分店菜品配置（上架/下架/售罄）
app.post('/api/v1/store/:storeId/menu-config', async (request, reply) => {
  const { storeId } = request.params;
  const { template_id, is_active, is_sold_out } = request.body;
  
  try {
    // upsert: 如果不存在则插入，存在则更新
    const existing = await prisma.$queryRaw`
      SELECT id FROM store_menu_items 
      WHERE store_id = ${parseInt(storeId)} AND template_id = ${template_id} AND deleted_at IS NULL
    `;
    
    if (existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE store_menu_items 
        SET is_active = ${is_active !== undefined ? is_active : true},
            is_sold_out = ${is_sold_out !== undefined ? is_sold_out : false},
            updated_at = NOW()
        WHERE store_id = ${parseInt(storeId)} AND template_id = ${template_id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO store_menu_items (store_id, template_id, is_active, is_sold_out)
        VALUES (${parseInt(storeId)}, ${template_id}, ${is_active !== undefined ? is_active : true}, ${is_sold_out || false})
      `;
    }
    
    return { success: true, message: '配置更新成功' };
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 8. 创建店铺 API
app.post('/api/v1/stores', async (request, reply) => {
  const { tenant_id, name, slug, description, address, phone, status } = request.body;
  
  // 必填字段验证
  if (!name || !slug) {
    return reply.status(400).send({ success: false, message: '店铺名称和标识符不能为空' });
  }
  
  // slug 格式验证
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return reply.status(400).send({ success: false, message: '标识符只能包含小写字母、数字和连字符，且不能以连字符开头或结尾' });
  }
  
  try {
    // 检查 slug 是否已存在
    const existing = await prisma.$queryRaw`
      SELECT id FROM stores WHERE slug = ${slug} AND deleted_at IS NULL
    `;
    
    if (existing.length > 0) {
      return reply.status(409).send({ success: false, message: `标识符 "${slug}" 已被使用` });
    }
    
    // 创建店铺
    const result = await prisma.$executeRaw`
      INSERT INTO stores (tenant_id, name, slug, description, address, phone, status, created_at, updated_at)
      VALUES (${parseInt(tenant_id || 8)}, ${name}, ${slug}, ${description || ''}, ${address || ''}, ${phone || ''}, ${status || 'ACTIVE'}, NOW(), NOW())
      RETURNING id
    `;
    
    // 查询刚创建的店铺完整信息
    const store = await prisma.$queryRaw`
      SELECT id, tenant_id, name, slug, description, address, phone, status, created_at
      FROM stores WHERE slug = ${slug}
    `;
    
    return {
      success: true,
      message: '店铺创建成功',
      data: store[0]
    };
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 9. 检查店铺 slug 可用性
app.post('/api/v1/stores/check-slug', async (request, reply) => {
  const { slug } = request.body;
  
  if (!slug) {
    return reply.status(400).send({ success: false, message: '请提供标识符' });
  }
  
  try {
    const existing = await prisma.$queryRaw`
      SELECT id FROM stores WHERE slug = ${slug} AND deleted_at IS NULL
    `;
    
    return {
      success: true,
      data: { available: existing.length === 0 }
    };
  } catch (error) {
    return reply.status(500).send({ success: false, message: error.message });
  }
});

// 7. 静态文件服务 - 上传的图片
app.get('/uploads/*', async (request, reply) => {
  const filePath = path.join(import.meta.dirname, request.url);
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp'
    };
    reply.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    return reply.send(content);
  } catch {
    return reply.status(404).send({ success: false, message: '文件不存在' });
  }
});

// 启动服务器
const start = async () => {
  try {
    const port = process.env.PORT || 33038;
    
    // 测试数据库连接
    console.log('测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 优化后端启动成功！`);
    console.log(`📡 地址: http://localhost:${port}`);
    console.log(`📋 健康检查: http://localhost:${port}/api/health`);
    console.log(`👥 真实租户数据: http://localhost:${port}/api/test/tenants`);
    console.log(`🏪 店铺列表: http://localhost:${port}/api/stores`);
    console.log(`🍽️  扫码点餐: http://localhost:${port}/api/public/stores/phoenix-main/menu`);
    console.log(`💾 数据库: ${process.env.DATABASE_URL?.split('@')[1] || '未知'}`);
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到关闭信号，正在清理...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

start();