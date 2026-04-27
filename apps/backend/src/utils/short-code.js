/**
 * 短码生成工具
 * 生成 5 位随机短码（a-z, A-Z, 0-9），共 62⁵ ≈ 9.1 亿种组合
 */

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 5;

/**
 * 生成一个随机短码
 */
export function generateShortCode() {
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

/**
 * 生成一个不重复的短码（带重试）
 * @param {Function} checkFn - 检查短码是否已存在的函数，返回 Promise<boolean>
 * @param {number} maxRetries - 最大重试次数，默认 10
 */
export async function generateUniqueShortCode(checkFn, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShortCode();
    if (!(await checkFn(code))) {
      return code;
    }
  }
  throw new Error('无法生成唯一短码（重试 ' + maxRetries + ' 次后失败）');
}
