import { publicDb } from '../db/index.js';
import bcrypt from 'bcrypt';
import { generateUniqueShortCode } from '../utils/short-code.js';

const salt = 10;

function hashPassword(password) {
  return bcrypt.hash(password, salt);
}

/** 将中文/特殊字符转成拼音式 slug */
function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^[-]+|[-]+$/g, '')
    .replace(/[\u4e00-\u9fa5]+/g, (match) => {
      // 简单映射：常用餐饮用词转拼音
      const map = {
        '餐': 'can', '店': 'dian', '菜': 'cai', '馆': 'guan',
        '厅': 'ting', '楼': 'lou', '坊': 'fang', '家': 'jia',
        '小': 'xiao', '大': 'da', '老': 'lao', '新': 'xin',
        '川': 'chuan', '湘': 'xiang', '粤': 'yue', '鲁': 'lu',
        '火': 'huo', '锅': 'guo', '鱼': 'yu', '肉': 'rou',
        '鸡': 'ji', '牛': 'niu', '羊': 'yang', '面': 'mian',
        '饭': 'fan', '包': 'bao', '子': 'zi', '饺': 'jiao',
        '龙': 'long', '凤': 'feng', '轩': 'xuan', '阁': 'ge',
        '记': 'ji', '堂': 'tang', '味': 'wei', '道': 'dao',
        '张': 'zhang', '王': 'wang', '李': 'li', '赵': 'zhao',
        '三': 'san', '四': 'si', '五': 'wu', '六': 'liu',
        '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
      };
      return Array.from(match).map(c => map[c] || c.charCodeAt(0).toString(36)).join('-');
    })
    .replace(/-+/g, '-')
    .replace(/^[-]+|[-]+$/g, '') || `shop-${Date.now().toString(36)}`;
}

/**
 * 演示店铺服务
 * 一键创建完整演示店铺（超管工具）
 */
class DemoShopService {
  constructor() {
    this.db = publicDb;
  }

  /**
   * 一键创建演示店铺
   * @param {Object} params
   * @param {string} params.shopName - 店铺名称
   * @param {string} params.contactPhone - 联系人手机
   * @param {string} params.adminUserId - 超管用户ID（操作人）
   * @returns {Promise<Object>} 体验账号信息
   */
  async createDemoShop({ shopName, contactPhone, adminUserId }) {
    const timestamp = Date.now().toString(36);
    const shortId = timestamp.slice(-6);

    // 生成演示用账号
    const email = `demo_${shortId}@qilin.demo`;
    const username = `demo_${shortId}`;
    const password = 'Demo@2026';
    const tenantSlug = `t_demo_${shortId}`;
    const storeSlug = `${toSlug(shopName) || 'shop'}-${shortId}`;

    // 用事务一次性创建全部资源
    const result = await this.db.$transaction(async (tx) => {
      // 1. 创建用户
      const passwordHash = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          email,
          username,
          fullName: '体验用户',
          phone: contactPhone || null,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      // 2. 创建租户
      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天试用
      const tenant = await tx.tenant.create({
        data: {
          name: `${shopName}的店铺`,
          subdomain: tenantSlug,
          description: `${shopName} - 演示店铺`,
          plan: 'FREE',
          trialEndsAt,
          status: 'ACTIVE',
          userTenants: {
            create: {
              userId: user.id,
              role: 'OWNER',
              status: 'ACTIVE',
            },
          },
        },
      });

      // 3. 创建店铺
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: shopName,
          slug: storeSlug,
          description: `${shopName} - 营业中`,
          type: 'RESTAURANT',
          status: 'ACTIVE',
          contactPhone: contactPhone || '',
          address: '体验店铺地址',
        },
      });

      // 4. 创建菜单分类（3个常用分类）
      const categories = await Promise.all([
        tx.menuCategory.create({
          data: { storeId: store.id, name: '招牌热菜', description: '主厨推荐', sortOrder: 0, isActive: true },
        }),
        tx.menuCategory.create({
          data: { storeId: store.id, name: '精美凉菜', description: '开胃小菜', sortOrder: 1, isActive: true },
        }),
        tx.menuCategory.create({
          data: { storeId: store.id, name: '特色主食', description: '主食面点', sortOrder: 2, isActive: true },
        }),
      ]);

      // 5. 从模板库随机取一些菜品
      const templates = await tx.menuTemplate.findMany({
        where: { isActive: true },
        take: 12,
      });

      const menuItems = [];
      if (templates.length > 0) {
        // 按分类分配菜品
        const categoryNames = ['招牌热菜', '精美凉菜', '特色主食'];
        for (let i = 0; i < templates.length && i < 12; i++) {
          const tpl = templates[i];
          // 找匹配的分类，否则用第一个
          const catIdx = categoryNames.indexOf(tpl.categoryName);
          const categoryId = catIdx >= 0 ? categories[catIdx].id : categories[i % 3].id;

          menuItems.push(
            tx.menuItem.create({
              data: {
                categoryId,
                name: tpl.name,
                description: tpl.description || '',
                price: tpl.price,
                imageUrl: tpl.imageUrl || null,
                isAvailable: true,
                isRecommended: i < 4,
                preparationTime: 10 + Math.floor(Math.random() * 15),
                sortOrder: i,
              },
            })
          );
        }
      } else {
        // 无模板时创建固定示例菜品
        const sampleItems = [
          { cat: 0, name: '回锅肉', price: 32 },
          { cat: 0, name: '鱼香肉丝', price: 28 },
          { cat: 0, name: '宫保鸡丁', price: 30 },
          { cat: 0, name: '麻婆豆腐', price: 18 },
          { cat: 1, name: '凉拌黄瓜', price: 12 },
          { cat: 1, name: '口水鸡', price: 22 },
          { cat: 1, name: '皮蛋豆腐', price: 15 },
          { cat: 2, name: '蛋炒饭', price: 15 },
          { cat: 2, name: '炸酱面', price: 18 },
          { cat: 2, name: '小笼包', price: 22 },
        ];
        for (let i = 0; i < sampleItems.length; i++) {
          const item = sampleItems[i];
          menuItems.push(
            tx.menuItem.create({
              data: {
                categoryId: categories[item.cat].id,
                name: item.name,
                description: '',
                price: item.price,
                isAvailable: true,
                isRecommended: i < 3,
                sortOrder: i,
              },
            })
          );
        }
      }
      await Promise.all(menuItems);

      // 6. 创建餐桌（A01~A10 共10张，带短码）
      const tables = [];
      const shortCodes = new Set();
      for (let i = 1; i <= 10; i++) {
        const tNum = `A${String(i).padStart(2, '0')}`;
        const shortCode = await generateUniqueShortCode(async (code) => {
          const existing = await tx.table.findUnique({ where: { shortCode: code } });
          return !!existing;
        });
        shortCodes.add(shortCode);
        tables.push(
          tx.table.create({
            data: {
              storeId: store.id,
              tableNumber: tNum,
              name: `${tNum}号桌`,
              capacity: 4,
              status: 'AVAILABLE',
              shortCode,
            },
          })
        );
      }
      await Promise.all(tables);

      // 7. 创建店长用户（STORE_ADMIN），店长登录后直接进店长端，不经过租户后台
      const storeAdminEmail = `sa_${shortId}@qilin.demo`;
      const storeAdminHash = await hashPassword('Demo@2026');
      const storeAdminUser = await tx.user.create({
        data: {
          email: storeAdminEmail,
          username: `sa_${shortId}`,
          fullName: `${shopName}`,
          phone: contactPhone || null,
          passwordHash: storeAdminHash,
          status: 'ACTIVE',
        },
      });
      // 关联店长到店铺
      await tx.userStore.create({
        data: {
          userId: storeAdminUser.id,
          storeId: store.id,
          role: 'STORE_ADMIN',
          status: 'ACTIVE',
        },
      });
      // 也加到租户（关联租户，但角色为店长）
      await tx.userTenant.create({
        data: {
          userId: storeAdminUser.id,
          tenantId: tenant.id,
          role: 'STORE_ADMIN',
          status: 'ACTIVE',
        },
      });

      return { user, tenant, store, storeAdminUser };
    });

    return {
      success: true,
      data: {
        // 店长账号（推荐使用——直接进店长端，界面清爽）
        storeAdminEmail: result.storeAdminUser.email,
        storeAdminPassword: 'Demo@2026',
        // OWNER 账号（进租户后台，如需管理多店可用）
        ownerEmail: result.user.email,
        ownerPassword: password,
        shopName: result.store.name,
        tenantSlug: result.tenant.subdomain,
        storeSlug: result.store.slug,
        storeId: result.store.id,
        loginUrl: `https://saas.openyun.xin/auth/login`,
        storeAdminUrl: `https://saas.openyun.xin/store-admin/login`,
        scanUrl: `https://saas.openyun.xin/t/${result.tenant.subdomain}/s/${result.store.slug}/scan/A01`,
        trialEndsAt: result.tenant.trialEndsAt,
      },
    };
  }
}

export default new DemoShopService();
