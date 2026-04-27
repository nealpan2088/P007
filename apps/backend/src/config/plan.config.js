/**
 * 套餐计划配置
 * 定义各套餐的功能限制和权益
 */

const PLANS = {
  FREE: {
    name: '免费版',
    key: 'FREE',
    price: 0,
    period: 'month',
    limits: {
      maxStores: 1,           // 最多1家门店
      maxPrinters: 1,         // 最多1台打印机
      maxMenusPerStore: 50,    // 每家店最多50个菜品
      maxTablesPerStore: 20,   // 每家店最多20张餐桌
      dataRetentionDays: 30,   // 数据保留30天
    },
    features: [
      '扫码点餐基础功能',
      '1台云打印机',
      '30天数据留存',
      '基础数据看板',
    ],
    trialDays: 14,  // 试用天数
  },

  PRO: {
    name: '专业版',
    key: 'PRO',
    price: 199,
    period: 'month',
    limits: {
      maxStores: 5,
      maxPrinters: 10,
      maxMenusPerStore: 200,
      maxTablesPerStore: 50,
      dataRetentionDays: 90,
    },
    features: [
      '最多5家门店',
      '不限打印机数量',
      '90天数据留存',
      '完整数据看板 + 报表',
      '多店统一管理',
    ],
  },

  ENTERPRISE: {
    name: '企业版',
    key: 'ENTERPRISE',
    price: 499,
    period: 'month',
    limits: {
      maxStores: Infinity,
      maxPrinters: Infinity,
      maxMenusPerStore: Infinity,
      maxTablesPerStore: Infinity,
      dataRetentionDays: Infinity, // 永久
    },
    features: [
      '不限门店数量',
      '全部功能',
      '品牌定制域名',
      'API 接口对接',
      '专属客户成功经理',
      '永久数据留存',
    ],
  },
}

/**
 * 获取指定套餐的配置
 */
function getPlan(planKey) {
  return PLANS[planKey] || PLANS.FREE
}

/**
 * 检查指定操作是否超出套餐限制
 * @param {string} planKey - 套餐类型
 * @param {string} resourceType - 资源类型 ('stores'|'printers')
 * @param {number} currentCount - 当前已创建数量
 * @returns {{ allowed: boolean, max: number, message?: string }}
 */
function checkPlanLimit(planKey, resourceType, currentCount) {
  const plan = getPlan(planKey)
  const limitKey = `max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`
  const max = plan.limits[limitKey]

  if (max === Infinity) {
    return { allowed: true, max }
  }

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      message: `您的当前套餐（${plan.name}）最多支持 ${max} 个${resourceType === 'stores' ? '门店' : '打印机'}，当前已达上限。请升级套餐。`,
    }
  }

  return { allowed: true, max }
}

/**
 * 检查租户套餐是否有效（未过期）
 */
function isPlanActive(tenant) {
  if (!tenant) return false
  if (tenant.status !== 'ACTIVE') return false

  // 付费套餐不过期
  if (tenant.plan !== 'FREE') return true

  // 免费套餐检查试用期
  if (tenant.trialEndsAt) {
    return new Date(tenant.trialEndsAt) > new Date()
  }

  // 无 trialEndsAt 视为有效（兼容旧数据）
  return true
}

/**
 * 获取套餐试用到期天数
 */
function getTrialRemainingDays(tenant) {
  if (!tenant || !tenant.trialEndsAt) return 0
  const remainder = new Date(tenant.trialEndsAt) - new Date()
  return Math.max(0, Math.ceil(remainder / (1000 * 60 * 60 * 24)))
}

export {
  PLANS,
  getPlan,
  checkPlanLimit,
  isPlanActive,
  getTrialRemainingDays,
}
