/**
 * 菜品模板分类 → 基础分类映射表
 *
 * 所有将模板菜品导入到店铺的逻辑（一键演示店铺创建 / 素材库导入按钮）都使用此映射表。
 * 扩展：新增模板分类时加一行即可，不改代码逻辑。
 */
const CATEGORY_MAP = {
  '招牌菜':  { name: '招牌菜', icon: '⭐', order: 0 },
  '热菜':    { name: '热菜',   icon: '🔥', order: 1 },
  '川菜':    { name: '热菜',   icon: '🔥', order: 1 },
  '湘菜':    { name: '热菜',   icon: '🔥', order: 1 },
  '粤菜':    { name: '热菜',   icon: '🔥', order: 1 },
  '江西小炒': { name: '热菜',   icon: '🔥', order: 1 },
  '凉菜':    { name: '凉菜',   icon: '🥗', order: 2 },
  '主食':    { name: '主食',   icon: '🍚', order: 3 },
  '兰州拉面': { name: '主食',   icon: '🍚', order: 3 },
  '沙县小吃': { name: '主食',   icon: '🍚', order: 3 },
  '早餐快餐': { name: '主食',   icon: '🍚', order: 3 },
  '汤品':    { name: '汤品',   icon: '🍲', order: 4 },
  '汤类':    { name: '汤品',   icon: '🍲', order: 4 },
  '饮品':    { name: '饮品',   icon: '🥤', order: 5 },
  '饮料酒水': { name: '饮品',   icon: '🥤', order: 5 },
  '特色小吃': { name: '特色小吃', icon: '🍢', order: 6 },
  '烧烤':    { name: '特色小吃', icon: '🍢', order: 6 },
  '街边烧烤': { name: '特色小吃', icon: '🍢', order: 6 },
};

/** 基础分类列表（按序创建，不重复，按 order 升序排列） */
const BASE_CATEGORIES = [
  { name: '招牌菜', icon: '⭐', order: 0 },
  { name: '热菜',   icon: '🔥', order: 1 },
  { name: '凉菜',   icon: '🥗', order: 2 },
  { name: '主食',   icon: '🍚', order: 3 },
  { name: '汤品',   icon: '🍲', order: 4 },
  { name: '饮品',   icon: '🥤', order: 5 },
  { name: '特色小吃', icon: '🍢', order: 6 },
];

/**
 * 获取模板分类名映射到的目标基础分类名
 * @param {string} categoryName - 模板中的 categoryName
 * @returns {string} 目标基础分类名（无匹配时返回 '热菜'）
 */
function getMappedCategoryName(categoryName) {
  return CATEGORY_MAP[categoryName]?.name || '热菜';
}

/**
 * 通过菜品名称关键字判断归属的基础分类
 * 用于"一键创建店铺"时，将模板菜品的名称关键字匹配到店铺的基础分类
 * @param {string} dishName - 菜品名称
 * @returns {string} 基础分类名
 */
function guessCategoryByDishName(dishName) {
  const rules = [
    { match: ['招牌', '特色', '推荐'], cat: '招牌菜' },
    { match: ['汤', '羹'], cat: '汤品' },
    { match: ['凉', '拌', '冷'], cat: '凉菜' },
    { match: ['饭', '面', '粉', '饼', '包', '饺', '馒', '馄饨', '云吞', '煎饼', '拉条', '凉皮', '泡馍'], cat: '主食' },
    { match: ['水', '饮料', '酒', '茶', '奶', '可乐', '雪碧', '橙汁', '豆浆', '酸梅', '啤酒', '精酿'], cat: '饮品' },
    { match: ['小吃', '串', '春卷', '糕', '糖', '薯条', '葫芦'], cat: '特色小吃' },
    { match: ['炒', '肉', '鸡', '鸭', '鱼', '虾', '牛', '羊', '煲', '锅', '烤', '炸', '蒸', '炖', '烧', '煮', '焖', '爆', '煎', '煨', '腊', '卤', '煸', '拌'], cat: '热菜' },
  ];
  for (const rule of rules) {
    if (rule.match.some(kw => dishName.includes(kw))) return rule.cat;
  }
  return '热菜';
}

/**
 * 获取目标基础分类的排序序号
 * @param {string} categoryName - 模板中的 categoryName
 * @returns {number} 排序序号
 */
function getCategoryOrder(categoryName) {
  return CATEGORY_MAP[categoryName]?.order ?? 1;
}

export { CATEGORY_MAP, BASE_CATEGORIES, getMappedCategoryName, getCategoryOrder, guessCategoryByDishName };
