// 麒麟项目 - 店铺数据验证器
// 提供店铺相关数据的验证逻辑

/**
 * 验证店铺数据
 * @param {Object} storeData 店铺数据
 * @returns {Object} 验证结果
 */
export function validateStoreData(storeData) {
  const errors = [];

  // 必需字段检查
  if (!storeData.name || storeData.name.trim().length === 0) {
    errors.push('店铺名称不能为空');
  } else if (storeData.name.length > 100) {
    errors.push('店铺名称不能超过100个字符');
  }

  if (!storeData.type) {
    errors.push('店铺类型不能为空');
  } else if (!['RESTAURANT', 'CAFE', 'FAST_FOOD', 'BAKERY', 'BAR', 'FOOD_TRUCK', 'CATERING', 'OTHER'].includes(storeData.type)) {
    errors.push('无效的店铺类型');
  }

  // 可选字段验证
  if (storeData.displayName && storeData.displayName.length > 200) {
    errors.push('店铺显示名称不能超过200个字符');
  }

  if (storeData.description && storeData.description.length > 1000) {
    errors.push('店铺描述不能超过1000个字符');
  }

  if (storeData.contactPhone) {
    const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
    if (!phoneRegex.test(storeData.contactPhone)) {
      errors.push('联系电话格式无效');
    }
  }

  if (storeData.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(storeData.contactEmail)) {
      errors.push('联系邮箱格式无效');
    }
  }

  if (storeData.address && storeData.address.length > 500) {
    errors.push('地址不能超过500个字符');
  }

  if (storeData.city && storeData.city.length > 100) {
    errors.push('城市不能超过100个字符');
  }

  if (storeData.state && storeData.state.length > 100) {
    errors.push('省份不能超过100个字符');
  }

  if (storeData.country && storeData.country.length > 100) {
    errors.push('国家不能超过100个字符');
  }

  if (storeData.postalCode && storeData.postalCode.length > 20) {
    errors.push('邮政编码不能超过20个字符');
  }

  // 坐标验证
  if (storeData.latitude !== undefined) {
    if (typeof storeData.latitude !== 'number' || storeData.latitude < -90 || storeData.latitude > 90) {
      errors.push('纬度必须在-90到90之间');
    }
  }

  if (storeData.longitude !== undefined) {
    if (typeof storeData.longitude !== 'number' || storeData.longitude < -180 || storeData.longitude > 180) {
      errors.push('经度必须在-180到180之间');
    }
  }

  // 配置验证
  if (storeData.timezone && !isValidTimezone(storeData.timezone)) {
    errors.push('无效的时区');
  }

  if (storeData.currency && storeData.currency.length !== 3) {
    errors.push('货币代码必须是3个字符');
  }

  if (storeData.language && !isValidLanguageCode(storeData.language)) {
    errors.push('无效的语言代码');
  }

  if (storeData.themeColor && !isValidColor(storeData.themeColor)) {
    errors.push('主题颜色格式无效');
  }

  // 业务设置验证
  if (storeData.tableCount !== undefined) {
    if (!Number.isInteger(storeData.tableCount) || storeData.tableCount < 0 || storeData.tableCount > 1000) {
      errors.push('餐桌数量必须是0到1000之间的整数');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证营业时间数据
 * @param {Array} businessHours 营业时间数组
 * @returns {Object} 验证结果
 */
export function validateBusinessHours(businessHours) {
  const errors = [];

  if (!Array.isArray(businessHours)) {
    errors.push('营业时间必须是数组');
    return { valid: false, errors };
  }

  if (businessHours.length === 0) {
    errors.push('营业时间不能为空');
    return { valid: false, errors };
  }

  // 检查是否包含所有天数（0-6）
  const days = new Set();
  
  for (const hour of businessHours) {
    // 检查必需字段
    if (hour.dayOfWeek === undefined || hour.dayOfWeek === null) {
      errors.push('营业时间必须包含dayOfWeek字段');
      continue;
    }

    if (typeof hour.dayOfWeek !== 'number' || hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
      errors.push(`dayOfWeek必须是0到6之间的数字，当前值: ${hour.dayOfWeek}`);
      continue;
    }

    // 检查是否重复
    if (days.has(hour.dayOfWeek)) {
      errors.push(`dayOfWeek ${hour.dayOfWeek} 重复`);
    } else {
      days.add(hour.dayOfWeek);
    }

    // 检查isOpen字段
    if (hour.isOpen === undefined) {
      errors.push(`dayOfWeek ${hour.dayOfWeek} 缺少isOpen字段`);
      continue;
    }

    if (typeof hour.isOpen !== 'boolean') {
      errors.push(`dayOfWeek ${hour.dayOfWeek} 的isOpen必须是布尔值`);
      continue;
    }

    // 如果营业，检查时间格式
    if (hour.isOpen) {
      if (!hour.openTime || !isValidTimeFormat(hour.openTime)) {
        errors.push(`dayOfWeek ${hour.dayOfWeek} 的openTime格式无效，应为HH:MM格式`);
      }

      if (!hour.closeTime || !isValidTimeFormat(hour.closeTime)) {
        errors.push(`dayOfWeek ${hour.dayOfWeek} 的closeTime格式无效，应为HH:MM格式`);
      }

      // 检查时间逻辑
      if (hour.openTime && hour.closeTime) {
        const open = parseTime(hour.openTime);
        const close = parseTime(hour.closeTime);
        
        if (open >= close) {
          errors.push(`dayOfWeek ${hour.dayOfWeek} 的openTime必须早于closeTime`);
        }
      }

      // 检查休息时间
      if (hour.breakStart || hour.breakEnd) {
        if (!hour.breakStart || !isValidTimeFormat(hour.breakStart)) {
          errors.push(`dayOfWeek ${hour.dayOfWeek} 的breakStart格式无效，应为HH:MM格式`);
        }

        if (!hour.breakEnd || !isValidTimeFormat(hour.breakEnd)) {
          errors.push(`dayOfWeek ${hour.dayOfWeek} 的breakEnd格式无效，应为HH:MM格式`);
        }

        if (hour.breakStart && hour.breakEnd) {
          const breakStart = parseTime(hour.breakStart);
          const breakEnd = parseTime(hour.breakEnd);
          
          if (breakStart >= breakEnd) {
            errors.push(`dayOfWeek ${hour.dayOfWeek} 的breakStart必须早于breakEnd`);
          }

          // 检查休息时间是否在营业时间内
          if (hour.openTime && hour.closeTime) {
            const open = parseTime(hour.openTime);
            const close = parseTime(hour.closeTime);
            
            if (breakStart < open || breakEnd > close) {
              errors.push(`dayOfWeek ${hour.dayOfWeek} 的休息时间必须在营业时间内`);
            }
          }
        }
      }
    }
  }

  // 检查是否包含所有天数
  if (days.size < 7) {
    const missingDays = [];
    for (let i = 0; i < 7; i++) {
      if (!days.has(i)) {
        missingDays.push(i);
      }
    }
    errors.push(`缺少以下天数的营业时间: ${missingDays.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证时间格式 (HH:MM)
 * @param {string} time 时间字符串
 * @returns {boolean} 是否有效
 */
function isValidTimeFormat(time) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * 解析时间字符串为分钟数
 * @param {string} time 时间字符串 (HH:MM)
 * @returns {number} 分钟数
 */
function parseTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 验证时区
 * @param {string} timezone 时区
 * @returns {boolean} 是否有效
 */
function isValidTimezone(timezone) {
  // 常见的时区列表（简化验证）
  const validTimezones = [
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Singapore',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Australia/Sydney'
  ];
  
  return validTimezones.includes(timezone);
}

/**
 * 验证语言代码
 * @param {string} language 语言代码
 * @returns {boolean} 是否有效
 */
function isValidLanguageCode(language) {
  const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  return languageRegex.test(language);
}

/**
 * 验证颜色格式
 * @param {string} color 颜色值
 * @returns {boolean} 是否有效
 */
function isValidColor(color) {
  const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return colorRegex.test(color);
}

/**
 * 验证店铺更新数据
 * @param {Object} updateData 更新数据
 * @returns {Object} 验证结果
 */
export function validateStoreUpdateData(updateData) {
  const errors = [];

  // 只验证提供的字段
  if (updateData.name !== undefined) {
    if (updateData.name.trim().length === 0) {
      errors.push('店铺名称不能为空');
    } else if (updateData.name.length > 100) {
      errors.push('店铺名称不能超过100个字符');
    }
  }

  if (updateData.type !== undefined) {
    if (!['RESTAURANT', 'CAFE', 'FAST_FOOD', 'BAKERY', 'BAR', 'FOOD_TRUCK', 'CATERING', 'OTHER'].includes(updateData.type)) {
      errors.push('无效的店铺类型');
    }
  }

  if (updateData.status !== undefined) {
    if (!['DRAFT', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'].includes(updateData.status)) {
      errors.push('无效的店铺状态');
    }
  }

  if (updateData.displayName !== undefined && updateData.displayName.length > 200) {
    errors.push('店铺显示名称不能超过200个字符');
  }

  if (updateData.description !== undefined && updateData.description.length > 1000) {
    errors.push('店铺描述不能超过1000个字符');
  }

  if (updateData.contactPhone !== undefined && updateData.contactPhone) {
    const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
    if (!phoneRegex.test(updateData.contactPhone)) {
      errors.push('联系电话格式无效');
    }
  }

  if (updateData.contactEmail !== undefined && updateData.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.contactEmail)) {
      errors.push('联系邮箱格式无效');
    }
  }

  if (updateData.tableCount !== undefined) {
    if (!Number.isInteger(updateData.tableCount) || updateData.tableCount < 0 || updateData.tableCount > 1000) {
      errors.push('餐桌数量必须是0到1000之间的整数');
    }
  }

  if (updateData.themeColor !== undefined && updateData.themeColor) {
    if (!isValidColor(updateData.themeColor)) {
      errors.push('主题颜色格式无效');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证店铺查询参数
 * @param {Object} queryParams 查询参数
 * @returns {Object} 验证结果
 */
export function validateStoreQueryParams(queryParams) {
  const errors = [];

  if (queryParams.page !== undefined) {
    const page = parseInt(queryParams.page);
    if (isNaN(page) || page < 1) {
      errors.push('页码必须是大于0的整数');
    }
  }

  if (queryParams.limit !== undefined) {
    const limit = parseInt(queryParams.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('每页数量必须是1到100之间的整数');
    }
  }

  if (queryParams.status !== undefined) {
    if (!['DRAFT', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'].includes(queryParams.status)) {
      errors.push('无效的店铺状态');
    }
  }

  if (queryParams.type !== undefined) {
    if (!['RESTAURANT', 'CAFE', 'FAST_FOOD', 'BAKERY', 'BAR', 'FOOD_TRUCK', 'CATERING', 'OTHER'].includes(queryParams.type)) {
      errors.push('无效的店铺类型');
    }
  }

  if (queryParams.sortBy !== undefined) {
    const validSortFields = ['name', 'createdAt', 'updatedAt', 'status', 'type'];
    if (!validSortFields.includes(queryParams.sortBy)) {
      errors.push(`无效的排序字段，可选值: ${validSortFields.join(', ')}`);
    }
  }

  if (queryParams.sortOrder !== undefined) {
    if (!['asc', 'desc'].includes(queryParams.sortOrder.toLowerCase())) {
      errors.push('排序顺序必须是asc或desc');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}