// 验证服务 - 数据验证工具

/**
 * 验证数据
 * @param {Object} data - 要验证的数据
 * @param {Object} rules - 验证规则
 * @returns {Object} 验证结果
 */
export function validate(data, rules) {
  const errors = [];
  
  for (const [field, ruleString] of Object.entries(rules)) {
    const value = data[field];
    const rulesList = ruleString.split('|');
    
    for (const rule of rulesList) {
      const [ruleName, ruleParam] = rule.split(':');
      
      let isValid = true;
      let message = '';
      
      switch (ruleName) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            isValid = false;
            message = `${field} 是必填字段`;
          }
          break;
          
        case 'string':
          if (value !== undefined && value !== null && typeof value !== 'string') {
            isValid = false;
            message = `${field} 必须是字符串`;
          }
          break;
          
        case 'number':
          if (value !== undefined && value !== null && isNaN(Number(value))) {
            isValid = false;
            message = `${field} 必须是数字`;
          }
          break;
          
        case 'integer':
          if (value !== undefined && value !== null && !Number.isInteger(Number(value))) {
            isValid = false;
            message = `${field} 必须是整数`;
          }
          break;
          
        case 'boolean':
          if (value !== undefined && value !== null && typeof value !== 'boolean') {
            isValid = false;
            message = `${field} 必须是布尔值`;
          }
          break;
          
        case 'array':
          if (value !== undefined && value !== null && !Array.isArray(value)) {
            isValid = false;
            message = `${field} 必须是数组`;
          }
          break;
          
        case 'object':
          if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) {
            isValid = false;
            message = `${field} 必须是对象`;
          }
          break;
          
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            message = `${field} 必须是有效的邮箱地址`;
          }
          break;
          
        case 'phone':
          if (value && !/^1[3-9]\d{9}$/.test(value)) {
            isValid = false;
            message = `${field} 必须是有效的手机号码`;
          }
          break;
          
        case 'min':
          if (value !== undefined && value !== null) {
            const min = parseInt(ruleParam);
            if (typeof value === 'string' && value.length < min) {
              isValid = false;
              message = `${field} 长度不能少于 ${min} 个字符`;
            } else if (typeof value === 'number' && value < min) {
              isValid = false;
              message = `${field} 不能小于 ${min}`;
            } else if (Array.isArray(value) && value.length < min) {
              isValid = false;
              message = `${field} 不能少于 ${min} 个元素`;
            }
          }
          break;
          
        case 'max':
          if (value !== undefined && value !== null) {
            const max = parseInt(ruleParam);
            if (typeof value === 'string' && value.length > max) {
              isValid = false;
              message = `${field} 长度不能超过 ${max} 个字符`;
            } else if (typeof value === 'number' && value > max) {
              isValid = false;
              message = `${field} 不能大于 ${max}`;
            } else if (Array.isArray(value) && value.length > max) {
              isValid = false;
              message = `${field} 不能超过 ${max} 个元素`;
            }
          }
          break;
          
        case 'in':
          if (value !== undefined && value !== null) {
            const allowedValues = ruleParam.split(',');
            if (!allowedValues.includes(value.toString())) {
              isValid = false;
              message = `${field} 必须是以下值之一: ${allowedValues.join(', ')}`;
            }
          }
          break;
          
        case 'regex':
          if (value !== undefined && value !== null) {
            try {
              const regex = new RegExp(ruleParam);
              if (!regex.test(value.toString())) {
                isValid = false;
                message = `${field} 格式不正确`;
              }
            } catch (e) {
              // 正则表达式无效，跳过这个规则
            }
          }
          break;
          
        case 'uuid':
          if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            isValid = false;
            message = `${field} 必须是有效的UUID`;
          }
          break;
          
        case 'date':
          if (value && isNaN(Date.parse(value))) {
            isValid = false;
            message = `${field} 必须是有效的日期`;
          }
          break;
          
        case 'url':
          if (value) {
            try {
              new URL(value);
            } catch (e) {
              isValid = false;
              message = `${field} 必须是有效的URL`;
            }
          }
          break;
      }
      
      if (!isValid) {
        errors.push({
          field,
          rule: ruleName,
          message,
          value
        });
        break; // 一个字段只需要报告第一个错误
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 清理数据（移除未定义的字段）
 * @param {Object} data - 原始数据
 * @returns {Object} 清理后的数据
 */
export function sanitize(data) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * 验证请求参数
 * @param {Object} params - 请求参数
 * @param {Object} schema - 验证模式
 * @returns {Object} 验证结果
 */
export function validateParams(params, schema) {
  return validate(params, schema);
}

/**
 * 验证请求体
 * @param {Object} body - 请求体
 * @param {Object} schema - 验证模式
 * @returns {Object} 验证结果
 */
export function validateBody(body, schema) {
  return validate(body, schema);
}

/**
 * 验证查询参数
 * @param {Object} query - 查询参数
 * @param {Object} schema - 验证模式
 * @returns {Object} 验证结果
 */
export function validateQuery(query, schema) {
  return validate(query, schema);
}

/**
 * 快速验证（返回布尔值）
 * @param {Object} data - 要验证的数据
 * @param {Object} rules - 验证规则
 * @returns {boolean} 是否有效
 */
export function isValid(data, rules) {
  return validate(data, rules).valid;
}

export default {
  validate,
  sanitize,
  validateParams,
  validateBody,
  validateQuery,
  isValid
};