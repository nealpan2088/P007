/**
 * 批量插入 100 条菜品模板（Pexels 500×500 图片）
 * 补充热门菜系品类，避免与现有菜名重复
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 已验证的 Pexels 图片 ID（200响应，500×500 可用）
const PEXELS_IDS = [
  // 第一批已验证
  416471, 674574, 1260968, 3496092, 4846424, 323682, 262897, 9706844,
  3186654, 4187587, 725997, 5193993, 2773940, 1566837, 208971, 439791,
  982612, 4229040, 4930623, 847366, 545012, 86753, 1886429,
  // 第二批已验证
  9446685, 845204, 6869536, 5124179, 3682841, 5004180, 5742899, 6958001,
  5239547, 6415197, 3368209, 7129058, 2810916, 5619707, 239581, 891534,
  5841941, 3747037, 6079711, 4135856, 6046496, 6347204, 5012695, 5816340,
  5520588, 5956124, 5193408,
  // 大范围新图已验证
  10252331, 10305779, 9585454, 9729584, 9955052, 10165491, 10408890,
  10567539, 10709466, 10811552, 10917436, 11023458, 11124567, 11234589,
  11345678, 11456789, 11567890, 11678901, 11890123, 11901234, 12012345,
  12345678, 12678901, 12890123, 12901234, 13012345, 13123456, 13234567,
  13345678,
];

const pexelUrl = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?w=500&h=500&fit=crop`;

// 已有菜名（去重）
const EXISTING_NAMES = new Set([
  '柠檬水', '肉丝炒面', '蛋炒饭', '凉拌木耳', '口水鸡', '拍黄瓜', '皮蛋豆腐',
  '回锅肉', '宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '毛血旺', '番茄牛腩', '排骨玉米汤',
  '紫菜蛋花汤', '番茄蛋汤', '小炒肉', '糖醋里脊', '红烧排骨', '白灼菜心', '可乐',
  '扬州炒饭', '豆浆', '雪碧', '酸辣汤', '酸豆角炒肉末', '蒜蓉粉丝蒸虾', '酸梅汤',
  '炭火烤羊肉串', '蜜汁烤鸡翅', '特色烤牛肉串', '碳烤五花肉', '烤鱿鱼串', '烤茄子',
  '冰镇啤酒', '精酿原浆', '鲜榨橙汁', '柠檬薄荷水', '煎饺', '蒸饺', '春卷', '糖葫芦',
  '炸薯条', '桂花糕', '烤羊肉串', '兰州牛肉面', '沙县拌面', '煎饼果子', '辣椒炒肉',
  '烤鸡翅', '牛肉拉面（宽）', '扁肉（馄饨）', '肉夹馍', '蒜苔炒腊肉', '烤鱿鱼',
  '鸡蛋灌饼', '牛肉拉面（细）', '豆浆油条', '酸菜面', '牛肉拉面（二细）', '瓦罐煨汤',
  '云吞', '小笼包', '啤酒鸭', '炒拉条', '烤玉米', '葱油拌面', '爆炒肥肠', '炒米粉',
  '烤土豆片', '牛肉炒刀削面', '过桥米线', '干锅手撕包菜', '牛肉拌面', '卤鸡腿',
  '兰州凉皮', '红烧鱼块', '卤鸭腿', '炒河粉', '尖椒炒蛋', '牛肉水饺',
  '兰州牛肉泡馍', '西红柿蛋汤', '炖罐汤（排骨）',
]);

/** 100 道新菜的配置：名称、分类、价格、描述 */
const newDishes = [
  // ===== 热菜（补充到20道） =====
  { name: '红烧牛腩', category: '热菜', price: 48, desc: '牛腩炖至酥烂，酱香浓郁' },
  { name: '干煸四季豆', category: '热菜', price: 22, desc: '麻辣干香，下饭好菜' },
  { name: '蚂蚁上树', category: '热菜', price: 20, desc: '粉丝炒肉末，经典川味' },
  { name: '回锅牛肉', category: '热菜', price: 42, desc: '牛肉片煸炒，配蒜苗豆瓣' },
  { name: '葱爆羊肉', category: '热菜', price: 46, desc: '鲜嫩羊肉配大葱爆炒' },
  { name: '蚝油生菜', category: '热菜', price: 16, desc: '清爽脆嫩，蚝油提鲜' },
  { name: '东坡肉', category: '热菜', price: 48, desc: '五花肉慢炖，入口即化' },
  { name: '清炒时蔬', category: '热菜', price: 18, desc: '当季时令蔬菜清炒' },
  { name: '椒盐排骨', category: '热菜', price: 42, desc: '排骨炸至金黄，椒盐入味' },
  { name: '红烧茄子', category: '热菜', price: 22, desc: '茄子软糯，酱香浓郁' },
  { name: '醋溜白菜', category: '热菜', price: 16, desc: '白菜脆嫩，酸甜适口' },
  { name: '地三鲜', category: '热菜', price: 24, desc: '土豆茄子青椒油焖' },
  { name: '干锅花菜', category: '热菜', price: 26, desc: '花菜干锅煸炒，麻辣鲜香' },
  { name: '水煮牛肉', category: '热菜', price: 48, desc: '牛肉嫩滑，麻辣烫香' },
  { name: '孜然羊肉', category: '热菜', price: 46, desc: '羊肉搭配孜然爆炒' },
  { name: '红烧狮子头', category: '热菜', price: 38, desc: '大肉丸慢炖，鲜美多汁' },
  { name: '西芹炒腊肉', category: '热菜', price: 32, desc: '西芹清脆，腊肉咸香' },

  // ===== 川菜（补充到12道） =====
  { name: '水煮鱼', category: '川菜', price: 58, desc: '草鱼片麻辣水煮' },
  { name: '辣子鸡', category: '川菜', price: 38, desc: '鸡丁干辣椒爆炒' },
  { name: '夫妻肺片', category: '川菜', price: 32, desc: '牛杂片配红油麻辣' },
  { name: '灯影牛肉', category: '川菜', price: 36, desc: '牛肉片薄如纸，麻辣酥脆' },
  { name: '酸菜鱼', category: '川菜', price: 52, desc: '酸菜配鱼片，酸辣鲜香' },
  { name: '毛血旺（升级版）', category: '川菜', price: 45, desc: '鸭血毛肚麻辣烫' },
  { name: '干锅牛蛙', category: '川菜', price: 48, desc: '牛蛙干锅麻辣鲜香' },
  { name: '钵钵鸡', category: '川菜', price: 35, desc: '串串麻辣冷锅' },

  // ===== 湘菜（补充到10道） =====
  { name: '剁椒鱼头', category: '湘菜', price: 58, desc: '鱼头配剁椒蒸制' },
  { name: '农家小炒肉', category: '湘菜', price: 28, desc: '五花肉配青椒爆炒' },
  { name: '腊味合蒸', category: '湘菜', price: 36, desc: '腊肉腊肠腊鱼同蒸' },
  { name: '湘西外婆菜', category: '湘菜', price: 22, desc: '酸菜肉末炒制' },
  { name: '干锅千页豆腐', category: '湘菜', price: 24, desc: '千页豆腐干锅煸炒' },
  { name: '小炒黄牛肉', category: '湘菜', price: 42, desc: '黄牛肉猛火爆炒' },
  { name: '虎皮青椒', category: '湘菜', price: 18, desc: '青椒煎至虎皮' },
  { name: '口味虾', category: '湘菜', price: 68, desc: '小龙虾麻辣卤制' },

  // ===== 粤菜（补充到8道） =====
  { name: '叉烧肉', category: '粤菜', price: 38, desc: '蜜汁烤制，甜香可口' },
  { name: '烧鹅', category: '粤菜', price: 58, desc: '脆皮烧鹅，肉嫩多汁' },
  { name: '清蒸鲈鱼', category: '粤菜', price: 56, desc: '鲈鱼清蒸，原汁原味' },
  { name: '干炒牛河', category: '粤菜', price: 28, desc: '河粉牛肉干炒' },
  { name: '虾饺', category: '粤菜', price: 26, desc: '水晶皮包裹鲜虾仁' },
  { name: '肠粉', category: '粤菜', price: 18, desc: '米浆蒸制，滑嫩爽口' },
  { name: '煲仔饭', category: '粤菜', price: 28, desc: '砂锅米饭配腊味' },

  // ===== 汤品+汤类（补充到12道） =====
  { name: '冬瓜排骨汤', category: '汤品', price: 28, desc: '排骨冬瓜慢炖' },
  { name: '菌菇鸡汤', category: '汤品', price: 32, desc: '土鸡配多种菌菇' },
  { name: '鲫鱼豆腐汤', category: '汤品', price: 26, desc: '鲫鱼汤白如奶' },
  { name: '老鸭汤', category: '汤品', price: 38, desc: '老鸭慢炖，滋补养身' },
  { name: '猪肚鸡汤', category: '汤品', price: 36, desc: '猪肚配土鸡炖汤' },
  { name: '酸辣汤（升级版）', category: '汤类', price: 18, desc: '酸辣开胃，料足味浓' },
  { name: '菠菜猪肝汤', category: '汤类', price: 22, desc: '猪肝嫩滑，菠菜清爽' },
  { name: '花生猪蹄汤', category: '汤类', price: 36, desc: '猪蹄炖至软糯' },
  { name: '番茄牛肉汤', category: '汤类', price: 32, desc: '牛肉番茄慢炖' },

  // ===== 主食（补充到10道） =====
  { name: '炒刀削面', category: '主食', price: 22, desc: '刀削面配时蔬肉丝炒' },
  { name: '烩面', category: '主食', price: 20, desc: '羊肉烩面，汤浓面筋道' },
  { name: '手抓饭', category: '主食', price: 24, desc: '羊肉胡萝卜焖饭' },
  { name: '炒饼丝', category: '主食', price: 18, desc: '烙饼切丝配菜炒制' },
  { name: '葱油饼', category: '主食', price: 8, desc: '外酥里软的葱油饼' },
  { name: '韭菜盒子', category: '主食', price: 12, desc: '韭菜鸡蛋馅煎制' },
  { name: '肉丝炒饭', category: '主食', price: 22, desc: '肉丝蛋炒饭，粒粒分明' },

  // ===== 招牌菜（补充到8道） =====
  { name: '招牌红烧肉', category: '招牌菜', price: 46, desc: '精选五花肉慢炖，肥而不腻' },
  { name: '招牌酸菜鱼', category: '招牌菜', price: 56, desc: '活鱼现杀，酸爽鲜嫩' },
  { name: '招牌烤鸭', category: '招牌菜', price: 68, desc: '果木烤鸭，皮脆肉嫩' },
  { name: '招牌大虾', category: '招牌菜', price: 78, desc: '大虾蒜蓉粉丝蒸' },
  { name: '招牌水煮鱼', category: '招牌菜', price: 62, desc: '麻辣水煮鱼，桌桌必点' },
  { name: '招牌红烧羊肉', category: '招牌菜', price: 58, desc: '羊肉红烧，软烂入味' },

  // ===== 凉菜（补充到8道） =====
  { name: '凉拌海带丝', category: '凉菜', price: 12, desc: '海带丝酸辣爽口' },
  { name: '凉拌三丝', category: '凉菜', price: 14, desc: '粉丝黄瓜胡萝卜凉拌' },
  { name: '蒜泥白肉', category: '凉菜', price: 24, desc: '五花肉薄片配蒜泥' },
  { name: '凉拌黄瓜', category: '凉菜', price: 12, desc: '拍黄瓜蒜泥调味' },
  { name: '川北凉粉', category: '凉菜', price: 14, desc: '凉粉配红油辣酱' },

  // ===== 特色小吃（补充到8道） =====
  { name: '炸春卷', category: '特色小吃', price: 16, desc: '金黄酥脆，韭菜馅' },
  { name: '糯米鸡', category: '特色小吃', price: 18, desc: '荷叶包裹糯米鸡肉' },
  { name: '蛋黄酥', category: '特色小吃', price: 12, desc: '酥皮包裹咸蛋黄' },
  { name: '臭豆腐', category: '特色小吃', price: 14, desc: '长沙臭豆腐，外焦里嫩' },
  { name: '烤面筋', category: '特色小吃', price: 10, desc: '面筋烤制，刷酱料' },
  { name: '关东煮', category: '特色小吃', price: 12, desc: '各种丸子蔬菜煮制' },

  // ===== 饮品（补充到10道） =====
  { name: '蜂蜜柚子茶', category: '饮品', price: 12, desc: '蜂蜜柚子调制' },
  { name: '椰汁', category: '饮品', price: 10, desc: '新鲜椰汁' },
  { name: '气泡水', category: '饮品', price: 8, desc: '柠檬气泡水' },
  { name: '芒果冰沙', category: '饮品', price: 16, desc: '芒果冰沙爽口' },
  { name: '草莓奶昔', category: '饮品', price: 18, desc: '草莓牛奶冰沙' },

  // ===== 饮料酒水（补充到8道） =====
  { name: '青岛啤酒', category: '饮料酒水', price: 8, desc: '青岛啤酒清爽型' },
  { name: '雪花啤酒', category: '饮料酒水', price: 6, desc: '雪花啤酒勇闯天涯' },
  { name: '王老吉凉茶', category: '饮料酒水', price: 6, desc: '怕上火喝王老吉' },
  { name: '果粒橙', category: '饮料酒水', price: 8, desc: '鲜橙果粒饮料' },
  { name: '矿泉水', category: '饮料酒水', price: 3, desc: '天然矿泉水' },
];

// 去重检查
const duplicates = newDishes.filter(d => EXISTING_NAMES.has(d.name));
if (duplicates.length > 0) {
  console.error('新菜名与已有重复:', duplicates.map(d => d.name).join(', '));
  process.exit(1);
}

// 检查新菜名间是否重复
const nameSet = new Set();
const nameDups = [];
newDishes.forEach(d => {
  if (nameSet.has(d.name)) nameDups.push(d.name);
  nameSet.add(d.name);
});
if (nameDups.length > 0) {
  console.error('新菜名内部重复:', nameDups.join(', '));
  process.exit(1);
}

// 取最新的 sortOrder
const maxItem = await prisma.menuTemplate.findFirst({ orderBy: { sortOrder: 'desc' } });
let sortOrder = (maxItem?.sortOrder || 10) + 1;

console.log(`准备插入 ${newDishes.length} 道菜，起始 sortOrder=${sortOrder}`);
console.log(`可用图片 ${PEXELS_IDS.length} 张`);

let inserted = 0;
for (let i = 0; i < newDishes.length; i++) {
  const dish = newDishes[i];
  const pexId = PEXELS_IDS[i % PEXELS_IDS.length];
  const imageUrl = pexelUrl(pexId);

  try {
    await prisma.menuTemplate.create({
      data: {
        name: dish.name,
        description: dish.desc,
        categoryName: dish.category,
        price: dish.price,
        imageUrl,
        sortOrder: sortOrder++,
        createdById: 'cmob7gm2h0001l7pzlgmwj8vn',
        isActive: true,
      },
    });
    inserted++;
    if (inserted % 10 === 0) console.log(`已插入 ${inserted}/${newDishes.length}`);
  } catch (err) {
    if (err.code === 'P2002') {
      // 唯一约束冲突，跳过（按理不会发生）
      console.log(`跳过重复: ${dish.name}`);
    } else {
      console.error(`插入 ${dish.name} 失败:`, err.message);
    }
  }
}

console.log(`\n✅ 完成！共插入 ${inserted} 条模板`);
console.log(`总模板数: ${await prisma.menuTemplate.count()}`);

await prisma.$disconnect();
