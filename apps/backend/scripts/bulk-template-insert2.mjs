/**
 * 继续补充到100条
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PEXELS_IDS = [
  9594177, 9380628, 9104809, 8930485, 8756173, 8571861, 8397549, 8223237,
  8048925, 7874613, 7700301, 7525989, 7351677, 7177365, 7003053, 6828741,
  6654429, 6480117, 6305805, 6131493, 1109197, 1516418, 1640772, 1653877,
  2101150, 3642041, 4109111, 414630, 580612, 769289, 955137,
];
const pexelUrl = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?w=500&h=500&fit=crop`;

const maxItem = await prisma.menuTemplate.findFirst({ orderBy: { sortOrder: 'desc' } });
let sortOrder = (maxItem?.sortOrder || 93) + 1;

// 补充的菜
const newDishes = [
  // ===== 早餐快餐补充 =====
  { name: '皮蛋瘦肉粥', category: '早餐快餐', price: 12, desc: '皮蛋瘦肉熬粥' },
  { name: '小米粥', category: '早餐快餐', price: 6, desc: '养胃小米粥' },
  { name: '茶叶蛋', category: '早餐快餐', price: 2, desc: '卤制茶叶蛋' },
  { name: '灌汤包', category: '早餐快餐', price: 14, desc: '鲜肉灌汤包' },
  { name: '豆腐脑', category: '早餐快餐', price: 6, desc: '咸甜可选豆腐脑' },
  { name: '油条', category: '早餐快餐', price: 3, desc: '现炸油条' },

  // ===== 街边烧烤补充 =====
  { name: '烤韭菜', category: '街边烧烤', price: 10, desc: '炭火烤韭菜' },
  { name: '烤馒头片', category: '街边烧烤', price: 6, desc: '烤至金黄酥脆' },
  { name: '烤金针菇', category: '街边烧烤', price: 10, desc: '蒜蓉烤金针菇' },
  { name: '烤鸡胗', category: '街边烧烤', price: 8, desc: '炭火烤鸡胗串' },

  // ===== 烧烤补充 =====
  { name: '烤乳鸽', category: '烧烤', price: 28, desc: '碳烤乳鸽整只' },
  { name: '烤牛板筋', category: '烧烤', price: 10, desc: '牛板筋烤制' },
  { name: '烤羊排', category: '烧烤', price: 48, desc: '整块羊排碳烤' },
  { name: '烤生蚝', category: '烧烤', price: 18, desc: '蒜蓉烤生蚝' },
  { name: '烤扇贝', category: '烧烤', price: 16, desc: '粉丝蒜蓉扇贝' },

  // ===== 还有别的补满 =====
  { name: '凉拌猪耳', category: '凉菜', price: 22, desc: '猪耳切丝凉拌' },
  { name: '柠檬鸡爪', category: '凉菜', price: 20, desc: '柠檬泡椒凤爪' },
];

let inserted = 0;
for (let i = 0; i < newDishes.length; i++) {
  const dish = newDishes[i];
  const pexId = PEXELS_IDS[i % PEXELS_IDS.length];
  try {
    await prisma.menuTemplate.create({
      data: {
        name: dish.name,
        description: dish.desc,
        categoryName: dish.category,
        price: dish.price,
        imageUrl: pexelUrl(pexId),
        sortOrder: sortOrder++,
        isActive: true,
        createdById: 'cmob7gm2h0001l7pzlgmwj8vn',
      },
    });
    inserted++;
  } catch (err) {
    console.log(`跳过 ${dish.name}:`, err.message);
  }
}

console.log(`✅ 补充插入 ${inserted} 条`);
console.log(`总模板数: ${await prisma.menuTemplate.count()}`);
await prisma.$disconnect();
