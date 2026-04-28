/**
 * 店铺主题生成器
 * 根据店铺名和菜品关键字，为每个店铺生成独特的色彩方案和装饰文案
 */

// 30 组预设配色方案 (主色 + 辅色，适用于餐饮场景)
const THEME_PALETTES = [
  { primary: '#ff6b35', secondary: '#ffb088', name: '暖橙' },
  { primary: '#e74c3c', secondary: '#f1948a', name: '热情红' },
  { primary: '#8e44ad', secondary: '#bb8fce', name: '浪漫紫' },
  { primary: '#2980b9', secondary: '#7fb3d8', name: '天空蓝' },
  { primary: '#27ae60', secondary: '#7dcea0', name: '自然绿' },
  { primary: '#f39c12', secondary: '#f7c974', name: '丰收黄' },
  { primary: '#1abc9c', secondary: '#76d7c4', name: '海洋青' },
  { primary: '#e67e22', secondary: '#f0b27a', name: '南瓜橙' },
  { primary: '#c0392b', secondary: '#e08283', name: '中国红' },
  { primary: '#2c3e50', secondary: '#85929e', name: '高级灰' },
  { primary: '#16a085', secondary: '#70c7b1', name: '翡翠绿' },
  { primary: '#9b59b6', secondary: '#c39bd3', name: '薰衣草' },
  { primary: '#3498db', secondary: '#85c1e9', name: '清爽蓝' },
  { primary: '#e84393', secondary: '#f1a9d0', name: '樱花粉' },
  { primary: '#d35400', secondary: '#eb984e', name: '夕阳橙' },
  { primary: '#2ecc71', secondary: '#82e0aa', name: '青草绿' },
  { primary: '#f1c40f', secondary: '#f7dc6f', name: '柠檬黄' },
  { primary: '#a93226', secondary: '#d98880', name: '红酒红' },
  { primary: '#5dade2', secondary: '#aed6f1', name: '冰川蓝' },
  { primary: '#ba4a00', secondary: '#dc7633', name: '巧克力' },
  { primary: '#6c3483', secondary: '#af7ac5', name: '星空紫' },
  { primary: '#0e6655', secondary: '#58d68d', name: '丛林绿' },
  { primary: '#b03a2e', secondary: '#e6b0aa', name: '陶土红' },
  { primary: '#1b4f72', secondary: '#5dade2', name: '深海蓝' },
  { primary: '#7b7d7d', secondary: '#bdc3c7', name: '轻奢灰' },
  { primary: '#a04000', secondary: '#edbb99', name: '拿铁' },
  { primary: '#4a235a', secondary: '#a569bd', name: '梦幻紫' },
  { primary: '#0e6251', secondary: '#73c6b6', name: '墨绿' },
  { primary: '#922b21', secondary: '#d98880', name: '枫叶红' },
  { primary: '#1a5276', secondary: '#85c1e9', name: '静谧蓝' },
];

// 店铺标语模板，支持 {shopName} 和 {keyword} 占位
const SLOGAN_TEMPLATES = [
  '{shopName} · 用心做好每一道菜',
  '舌尖上的{shopName}',
  '{shopName} · 家的味道',
  '来{shopName}，品人间烟火',
  '{shopName} · 吃货的天堂',
  '地道风味，尽在{shopName}',
  '{shopName} · 美味无需等待',
  '{shopName} · 每一口都是享受',
  '火候到位，口味对位 · {shopName}',
  '{shopName} · 烟火气里见真章',
  '新鲜食材，匠心烹饪 · {shopName}',
  '{shopName} · 不吃饱怎么有力气瘦',
  '聚会首选 · {shopName}',
  '{shopName} · 让美食温暖你的胃',
  '好味道，从{shopName}开始',
];

// 店铺徽章文字，与菜品关键字关联
const BADGE_TEMPLATES = [
  '今日推荐',
  '人气爆款',
  '主厨精选',
  '招牌必点',
  '限时优惠',
  '新品上市',
  '会员专享',
  '时令限定',
  '经典传承',
  '匠心制作',
];

/**
 * 根据字符串生成一个稳定的 0~n-1 的 hash 索引
 */
function hashIndex(str, n) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % n;
}

// 装饰纹样模板 —— 生成带食物相关图标的 SVG 背景图
const PATTERN_ICONS = [
  // 蒸气元素
  ['🍜', '🥟', '🥢', '🌶️', '🧄'],
  ['🍕', '🍔', '🌭', '🥓', '🧀'],
  ['🍣', '🍱', '🍙', '🦐', '🥟'],
  ['🍝', '🥗', '🥩', '🍞', '🧈'],
  ['🌮', '🌯', '🥘', '🍲', '🥣'],
  ['🍦', '🍰', '🧁', '🍩', '🥧'],
  ['☕', '🧋', '🍵', '🥤', '🍻'],
  ['🍇', '🍊', '🍋', '🍑', '🥝'],
  ['🥜', '🌰', '🍿', '🧂', '🌿'],
  ['🥐', '🥨', '🥖', '🧇', '🥞'],
];

/**
 * 生成店铺店招背景 SVG（data URI）
 * 生成具有质感的渐变背景：斜向渐变 + 装饰线条 + 店名首字
 * @param {string} shopName
 * @param {string} primaryColor
 * @param {string} secondaryColor
 * @returns {string} data:image/svg+xml;base64,...
 */
export function generateHeaderImage(shopName, primaryColor, secondaryColor) {
  // 装饰元素：分散分布的圆圈 + 小圆点
  const decor = [];
  // 分散分布的装饰圆（位置散落，大小不一）
  const circles = [
    { cx: 30, cy: -20, r: 100, opacity: 0.08 },
    { cx: 160, cy: -40, r: 80, opacity: 0.06 },
    { cx: 310, cy: 30, r: 60, opacity: 0.07 },
    { cx: -30, cy: 80, r: 70, opacity: 0.06 },
    { cx: 280, cy: 130, r: 50, opacity: 0.05 },
    { cx: 80, cy: 160, r: 40, opacity: 0.05 },
    { cx: 200, cy: -10, r: 35, opacity: 0.04 },
  ];
  // 小圆点装饰
  const dots = [
    { cx: 15, cy: 15, r: 3, opacity: 0.1 },
    { cx: 290, cy: 75, r: 4, opacity: 0.08 },
    { cx: 100, cy: 120, r: 2.5, opacity: 0.1 },
    { cx: 240, cy: 140, r: 3.5, opacity: 0.07 },
    { cx: 170, cy: 5, r: 2, opacity: 0.09 },
    { cx: 50, cy: 60, r: 2, opacity: 0.08 },
    { cx: 305, cy: 110, r: 2, opacity: 0.06 },
    { cx: 130, cy: 35, r: 1.5, opacity: 0.1 },
    { cx: 15, cy: 135, r: 2, opacity: 0.07 },
    { cx: 190, cy: 80, r: 1.5, opacity: 0.09 },
  ];

  circles.forEach(c => {
    decor.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="rgba(255,255,255,${c.opacity})"/>`);
  });
  dots.forEach(d => {
    decor.push(`<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="rgba(255,255,255,${d.opacity})"/>`);
  });

  // 抽象几何装饰（无文字）
  decor.push(`<circle cx="30" cy="-20" r="100" fill="rgba(255,255,255,0.08)"/>`);
  decor.push(`<circle cx="160" cy="-40" r="80" fill="rgba(255,255,255,0.06)"/>`);
  decor.push(`<circle cx="310" cy="30" r="60" fill="rgba(255,255,255,0.07)"/>`);
  decor.push(`<circle cx="-30" cy="80" r="70" fill="rgba(255,255,255,0.06)"/>`);
  decor.push(`<circle cx="280" cy="130" r="50" fill="rgba(255,255,255,0.05)"/>`);
  decor.push(`<circle cx="80" cy="160" r="40" fill="rgba(255,255,255,0.05)"/>`);
  decor.push(`<circle cx="200" cy="-10" r="35" fill="rgba(255,255,255,0.04)"/>`);
  // 小圆点
  decor.push(`<circle cx="15" cy="15" r="3" fill="rgba(255,255,255,0.1)"/>`);
  decor.push(`<circle cx="290" cy="75" r="4" fill="rgba(255,255,255,0.08)"/>`);
  decor.push(`<circle cx="100" cy="120" r="2.5" fill="rgba(255,255,255,0.1)"/>`);
  decor.push(`<circle cx="240" cy="140" r="3.5" fill="rgba(255,255,255,0.07)"/>`);
  decor.push(`<circle cx="170" cy="5" r="2" fill="rgba(255,255,255,0.09)"/>`);
  decor.push(`<circle cx="50" cy="60" r="2" fill="rgba(255,255,255,0.08)"/>`);
  decor.push(`<circle cx="305" cy="110" r="2" fill="rgba(255,255,255,0.06)"/>`);
  decor.push(`<circle cx="130" cy="35" r="1.5" fill="rgba(255,255,255,0.1)"/>`);
  decor.push(`<circle cx="15" cy="135" r="2" fill="rgba(255,255,255,0.07)"/>`);
  decor.push(`<circle cx="190" cy="80" r="1.5" fill="rgba(255,255,255,0.09)"/>`);
  // 抽象几何：圆环 + 弧线
  decor.push(`<circle cx="250" cy="20" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>`);
  decor.push(`<circle cx="70" cy="130" r="30" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>`);
  decor.push(`<path d="M0,152 Q80,100 160,140 Q240,90 320,120" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>`);
  decor.push(`<path d="M0,140 Q60,110 140,125 Q220,100 320,130" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1.5"/>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="152" viewBox="0 0 320 152">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="152" fill="url(#bg)" rx="14"/>
  ${decor.join('\n  ')}
</svg>`;

  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 为店铺生成独特的主题配置
 * @param {string} shopName - 店铺名称
 * @param {string} keyword - 菜品关键字（可选）
 * @returns {object} { themeColor, themesTemplate, headerConfig, slogan, badge }
 */
export function generateStoreTheme(shopName, keyword = '') {
  // 一键创建店铺统一使用暖橙色
  const palette = THEME_PALETTES[0];

  const seed = shopName + (keyword || '');
  const sloganIndex = hashIndex(seed + 'slogan', SLOGAN_TEMPLATES.length);
  const slogan = SLOGAN_TEMPLATES[sloganIndex]
    .replace('{shopName}', shopName)
    .replace('{keyword}', keyword || '经典');

  const badgeIndex = hashIndex(seed + 'badge', BADGE_TEMPLATES.length);
  const badge = BADGE_TEMPLATES[badgeIndex];

  // 装饰文案：从店铺名提取关键词
  const decorText = shopName.length > 12
    ? shopName.slice(0, 2) + '·' + shopName.slice(-2)
    : shopName.slice(0, 4);

  // 生成店头背景图（SVG data URI）
  const headerImageUrl = generateHeaderImage(shopName, palette.primary, palette.secondary);

  return {
    themeColor: palette.primary,
    themeTemplate: 'gradient',
    headerImageUrl,
    headerConfig: {
      paletteName: palette.name,
      primary: palette.primary,
      secondary: palette.secondary,
      slogan,
      badge,
      decorText,
    },
  };
}

export { THEME_PALETTES, SLOGAN_TEMPLATES, BADGE_TEMPLATES };
