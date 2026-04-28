import { publicDb } from '../db/index.js';
import bcrypt from 'bcrypt';
import { generateUniqueShortCode } from '../utils/short-code.js';
import { CATEGORY_MAP, BASE_CATEGORIES, getMappedCategoryName, guessCategoryByDishName } from '../constants/menu-template-map.constants.js';
import { generateStoreTheme } from '../utils/store-theme.js';

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
   * @param {number} params.tableCount - 餐桌数量（默认10）
   * @param {string} params.keyword - 菜品关键字（可选，筛选模板用）
   * @returns {Promise<Object>} 体验账号信息
   */
  async createDemoShop({ shopName, contactPhone, adminUserId, tableCount = 10, keyword = '' }) {
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
          rawPassword: password,
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

      // 生成店铺主题
      const theme = generateStoreTheme(shopName, (keyword || ''));

      // 3. 创建店铺
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: shopName,
          slug: storeSlug,
          description: `${shopName} - 营业中 · ${theme.headerConfig.slogan}`,
          type: 'RESTAURANT',
          status: 'ACTIVE',
          contactPhone: contactPhone || '',
          address: '体验店铺地址',
          themeColor: theme.themeColor,
          themeTemplate: theme.themeTemplate,
          headerImageUrl: theme.headerImageUrl,
        },
      });

      // 4. 从模板库取菜品
      let templates = [];
      if (keyword && keyword.trim()) {
        // 新逻辑：关键词匹配 categoryName，取该分类下全部模板菜品
        // 在 CATEGORY_MAP 的 key（模板分类名）中匹配关键词
        const matchedBaseNames = Object.keys(CATEGORY_MAP)
          .filter(k => k.includes(keyword.trim()));

        // 也直接在数据库 categoryName 中模糊匹配
        const matchedTplCats = matchedBaseNames.length > 0
          ? matchedBaseNames
          : [keyword.trim()];

        const catConditions = matchedTplCats.map(cat => ({ categoryName: { contains: cat } }));
        templates = await tx.menuTemplate.findMany({
          where: {
            isActive: true,
            OR: catConditions,
          },
          orderBy: { sortOrder: 'asc' },
        });
      } else {
        templates = await tx.menuTemplate.findMany({
          where: { isActive: true },
          take: 20,
          orderBy: { sortOrder: 'asc' },
        });
      }

      // 5. 创建基础分类（7个基础分类，始终创建）
      const categories = await Promise.all(
        BASE_CATEGORIES.map(cat =>
          tx.menuCategory.create({
            data: {
              storeId: store.id,
              name: cat.name,
              description: '',
              sortOrder: cat.order,
              isActive: true,
            },
          })
        )
      );

      // 建立基础分类名 → id 的映射
      const baseCategoryMap = {};
      for (const cat of categories) {
        baseCategoryMap[cat.name] = cat.id;
      }

      // 6. 将菜品按名称关键字匹配到基础分类
      const MENU_ITEM_BATCH_SIZE = 20;
      const createMenuItems = [];
      const seen = new Set();

      if (templates.length > 0) {
        for (let i = 0; i < templates.length && createMenuItems.length < MENU_ITEM_BATCH_SIZE; i++) {
          const tpl = templates[i];
          // 按菜名判断归属的基础分类
          const baseName = guessCategoryByDishName(tpl.name);
          const categoryId = baseCategoryMap[baseName] || categories[0].id;

          const key = `${categoryId}:${tpl.name}`;
          if (seen.has(key)) continue;
          seen.add(key);

          createMenuItems.push(
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
          { cat: '招牌菜', name: '红烧排骨', price: 38, img: 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?w=400&h=400&fit=crop' },
          { cat: '热菜', name: '回锅肉', price: 32, img: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?w=400&h=400&fit=crop' },
          { cat: '热菜', name: '鱼香肉丝', price: 28, img: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?w=400&h=400&fit=crop' },
          { cat: '热菜', name: '宫保鸡丁', price: 30, img: 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?w=400&h=400&fit=crop' },
          { cat: '热菜', name: '麻婆豆腐', price: 18, img: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?w=400&h=400&fit=crop' },
          { cat: '凉菜', name: '凉拌黄瓜', price: 12, img: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=400&h=400&fit=crop' },
          { cat: '凉菜', name: '口水鸡', price: 22, img: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?w=400&h=400&fit=crop' },
          { cat: '凉菜', name: '皮蛋豆腐', price: 15, img: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?w=400&h=400&fit=crop' },
          { cat: '主食', name: '蛋炒饭', price: 15, img: 'https://images.pexels.com/photos/955137/pexels-photo-955137.jpeg?w=400&h=400&fit=crop' },
          { cat: '主食', name: '炸酱面', price: 18, img: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?w=400&h=400&fit=crop' },
          { cat: '主食', name: '小笼包', price: 22, img: 'https://images.pexels.com/photos/9608/food-dumplings-vietnamese.jpg?w=400&h=400&fit=crop' },
        ];
        for (let i = 0; i < sampleItems.length; i++) {
          const item = sampleItems[i];
          createMenuItems.push(
            tx.menuItem.create({
              data: {
                categoryId: baseCategoryMap[item.cat] || categories[0].id,
                name: item.name,
                description: '',
                price: item.price,
                isAvailable: true,
                isRecommended: i < 3,
                sortOrder: i,
                imageUrl: item.img,
              },
            })
          );
        }
      }
      await Promise.all(createMenuItems);

      // 6. 创建餐桌（按 tableCount 生成，默认10张，带短码）
      const tables = [];
      const shortCodes = new Set();
      for (let i = 1; i <= tableCount; i++) {
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
          rawPassword: 'Demo@2026',
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

      return { user, tenant, store, storeAdminUser, theme };
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
        ownerUserId: result.user.id,
        shopName: result.store.name,
        tenantSlug: result.tenant.subdomain,
        storeSlug: result.store.slug,
        storeId: result.store.id,
        loginUrl: `https://saas.openyun.xin/auth/login`,
        storeAdminUrl: `https://saas.openyun.xin/store-admin/login`,
        scanUrl: `https://saas.openyun.xin/t/${result.tenant.subdomain}/s/${result.store.slug}/scan/A01`,
        trialEndsAt: result.tenant.trialEndsAt,
        theme: result.theme,
      },
    };
  }
}

export default new DemoShopService();
