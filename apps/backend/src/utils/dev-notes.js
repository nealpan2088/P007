/**
 * 开发注释系统
 * 
 * 在代码中用注释标记关键逻辑和注意事项，
 * 开发模式下输出到控制台/日志，
 * 生产环境自动静默。
 * 
 * 用法：
 *   devNote('创建店铺需要 tenantId', 'store.service')
 *   devWarn('slug 生成逻辑改过，注意旧数据兼容', 'migration')
 *   devError('这个分支不应该被执行', 'menu.service', new Error('xxx'))
 *   devDebug(`收到的数据: ${JSON.stringify(data)}`, 'store.service')
 */

const scopeEnabled = process.env.DEV_NOTES !== 'false'
const isDevelopment = process.env.NODE_ENV !== 'production'

// 输出颜色的 ANSI 码
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
}

/**
 * 普通开发笔记
 * @param {string} message 笔记内容
 * @param {string} scope 所属模块
 */
export function devNote(message, scope = 'general') {
  if (!isDevelopment || !scopeEnabled) return
  console.log(`${colors.dim}[DEV]${colors.reset} ${colors.green}[${scope}]${colors.reset} ${message}`)
}

/**
 * 开发警告（潜在问题或待办事项）
 * @param {string} message 警告内容
 * @param {string} scope 所属模块
 */
export function devWarn(message, scope = 'general') {
  if (!isDevelopment || !scopeEnabled) return
  console.warn(`${colors.yellow}[DEV-WARN]${colors.reset} ${colors.dim}[${scope}]${colors.reset} ${message}`)
}

/**
 * 开发错误
 * @param {string} message 错误描述
 * @param {string} scope 所属模块
 * @param {Error} [error] 原始错误对象
 */
export function devError(message, scope = 'general', error = null) {
  if (!isDevelopment || !scopeEnabled) return
  console.error(`${colors.red}[DEV-ERROR]${colors.reset} ${colors.dim}[${scope}]${colors.reset} ${message}`)
  if (error) console.error(error)
}

/**
 * 调试输出（比 devNote 更详尽，按需启用）
 * @param {string} message 调试信息
 * @param {string} scope 所属模块
 */
export function devDebug(message, scope = 'general') {
  // 仅在 DEV_NOTES=all 时输出调试信息
  if (!isDevelopment || process.env.DEV_NOTES !== 'all') return
  console.log(`${colors.cyan}[DEV-DEBUG]${colors.reset} ${colors.dim}[${scope}]${colors.reset} ${message}`)
}

export default { devNote, devWarn, devError, devDebug }
