# 国内免费图源API对接指南

## 🏆 推荐方案（按优先级排序）

### 1. 七牛云免费图床（最推荐）
- **免费额度**: 10GB存储 + 10GB CDN流量/月
- **稳定性**: ⭐⭐⭐⭐⭐ (企业级服务)
- **速度**: ⭐⭐⭐⭐⭐ (国内CDN加速)
- **注册**: 需要实名认证
- **API文档**: https://developer.qiniu.com/kodo

**优点**:
- 企业级稳定性
- 丰富的图片处理API
- 详细的监控统计
- 技术支持好

### 2. 又拍云（Upyun）免费套餐
- **免费额度**: 10GB存储 + 15GB CDN流量/月
- **特点**: 提供图片处理API（裁剪、压缩、水印）
- **注册**: 需要实名认证
- **API**: https://help.upyun.com/knowledge-base/image/

**图片处理示例**:
```
原始图: http://your-bucket.b0.upaiyun.com/photo.jpg
缩略图: http://your-bucket.b0.upaiyun.com/photo.jpg!300x300
灰度图: http://your-bucket.b0.upaiyun.com/photo.jpg!gray
```

### 3. 免费公共API（无需注册）

#### a) 随机图片API（最稳定）
- **URL**: `https://api.btstu.cn/sjbz/api.php`
- **参数**: 
  - `lx` = 类型 (dongman=动漫, meizi=妹子, fengjing=风景)
  - `format` = 格式 (json/text)
- **示例**: 
  ```
  # 返回图片URL
  https://api.btstu.cn/sjbz/api.php?lx=dongman
  
  # 返回JSON
  https://api.btstu.cn/sjbz/api.php?lx=fengjing&format=json
  ```

#### b) 必应每日一图（高质量）
- **URL**: `https://bing.ioliu.cn/v1/rand`
- **特点**: 高质量风景图，每日更新
- **返回格式**: JSON
- **示例响应**:
  ```json
  {
    "code": 200,
    "data": {
      "url": "https://bing.ioliu.cn/photo/xxx?size=1920x1080"
    }
  }
  ```

#### c) 食物图片API（需代理）
- **URL**: `https://foodish-api.herokuapp.com/api/`
- **问题**: 国外服务，需要代理访问
- **替代方案**: 使用本地占位图 + 定时从国内源更新

## 🍲 菜品图片专用方案

### 方案A：智能混合模式（推荐）
```javascript
// 根据环境自动选择图片源
const getFoodImageUrl = (foodId, foodName, environment = 'development') => {
  if (environment === 'development') {
    // 开发环境：本地占位图
    return `http://localhost:33038/api/placeholder/food/${foodId}`;
  }
  
  if (environment === 'staging') {
    // 测试环境：随机风景图（国内API）
    const types = ['fengjing', 'dongman', 'meizi'];
    const type = types[foodId % types.length];
    return `https://api.btstu.cn/sjbz/api.php?lx=${type}&food=${foodId}`;
  }
  
  // 生产环境：七牛云CDN
  const keyword = encodeURIComponent(foodName);
  return `https://cdn.your-domain.com/food/${foodId}.jpg?imageMogr2/thumbnail/400x400`;
};
```

### 方案B：立即可用的临时方案
```javascript
// 使用国内免费API + 本地回退
const FOOD_IMAGE_SOURCES = [
  // 主源：必应每日一图（高质量风景）
  (id) => `https://bing.ioliu.cn/v1/rand?food=${id}`,
  
  // 备源：随机图片API
  (id) => {
    const types = ['fengjing', 'dongman'];
    const type = types[id % 2];
    return `https://api.btstu.cn/sjbz/api.php?lx=${type}&id=${id}`;
  },
  
  // 最终回退：本地占位图
  (id) => `http://localhost:33038/api/placeholder/food/${id}`,
];

async function getFoodImageUrl(foodId) {
  // 尝试所有源，直到成功
  for (let i = 0; i < FOOD_IMAGE_SOURCES.length; i++) {
    try {
      const url = FOOD_IMAGE_SOURCES[i](foodId);
      console.log(`尝试图片源 ${i}: ${url}`);
      
      // 测试图片是否可访问
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 3000 
      });
      
      if (response.ok) {
        console.log(`✅ 图片源 ${i} 可用`);
        return url;
      }
    } catch (error) {
      console.log(`❌ 图片源 ${i} 失败: ${error.message}`);
      continue; // 尝试下一个源
    }
  }
  
  // 所有源都失败，返回本地占位图
  return FOOD_IMAGE_SOURCES[FOOD_IMAGE_SOURCES.length - 1](foodId);
}
```

## 🚀 立即实施：对接必应每日一图

让我为你实现一个立即可用的方案：

<｜DSML｜function_calls>
<｜DSML｜invoke name="exec">
<｜DSML｜parameter name="command" string="true"># 在后端添加必应图片API服务
cat >> /home/admin/projects/P007/apps/backend/server-optimized.mjs << 'EOF'

// 必应每日一图API服务
app.get('/api/bing/daily', async (request, reply) => {
  try {
    const response = await fetch('https://bing.ioliu.cn/v1/rand');
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.url) {
      return {
        success: true,
        url: data.data.url,
        description: '必应每日一图',
        source: 'bing'
      };
    }
    
    throw new Error('API响应格式错误');
  } catch (error) {
    // 失败时返回本地占位图
    return {
      success: true,
      url: \`http://localhost:33038/api/placeholder/food/\${Math.floor(Math.random() * 100)}\`,
      description: '本地占位图（必应API失败）',
      source: 'local'
    };
  }
});

// 随机风景图API（国内稳定）
app.get('/api/images/random', async (request, reply) => {
  const { type = 'fengjing', id } = request.query;
  const validTypes = ['fengjing', 'dongman', 'meizi'];
  const imageType = validTypes.includes(type) ? type : 'fengjing';
  
  try {
    // 使用国内稳定的随机图片API
    const response = await fetch(\`https://api.btstu.cn/sjbz/api.php?lx=\${imageType}\`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType.includes('image')) {
        // 直接返回图片
        reply.header('Content-Type', contentType);
        reply.header('Cache-Control', 'public, max-age=3600');
        return reply.send(await response.buffer());
      } else {
        // 可能是重定向，返回URL
        const imageUrl = response.url;
        return {
          success: true,
          url: imageUrl,
          type: imageType,
          source: 'btstu'
        };
      }
    }
    
    throw new Error('API请求失败');
  } catch (error) {
    // 失败时返回本地占位图
    return {
      success: true,
      url: \`http://localhost:33038/api/placeholder/food/\${id || Math.floor(Math.random() * 100)}\`,
      description: '本地占位图（随机图片API失败）',
      source: 'local'
    };
  }
});

// 智能菜品图片服务
app.get('/api/food/image/:foodId', async (request, reply) => {
  const { foodId } = request.params;
  const { prefer = 'auto' } = request.query;
  
  const strategies = [
    {
      name: 'bing',
      priority: 1,
      getUrl: async () => {
        const response = await fetch('https://bing.ioliu.cn/v1/rand');
        const data = await response.json();
        return data.data?.url;
      }
    },
    {
      name: 'btstu',
      priority: 2,
      getUrl: async () => {
        const types = ['fengjing', 'dongman'];
        const type = types[foodId % 2];
        const response = await fetch(\`https://api.btstu.cn/sjbz/api.php?lx=\${type}\`);
        return response.url;
      }
    },
    {
      name: 'local',
      priority: 3,
      getUrl: async () => \`http://localhost:33038/api/placeholder/food/\${foodId}\`
    }
  ];
  
  // 按优先级排序
  strategies.sort((a, b) => a.priority - b.priority);
  
  // 如果指定了偏好，调整优先级
  if (prefer !== 'auto') {
    const preferred = strategies.find(s => s.name === prefer);
    if (preferred) {
      preferred.priority = 0;
      strategies.sort((a, b) => a.priority - b.priority);
    }
  }
  
  // 尝试所有策略
  for (const strategy of strategies) {
    try {
      console.log(\`尝试图片策略: \${strategy.name}\`);
      const url = await strategy.getUrl();
      
      if (url) {
        return {
          success: true,
          foodId,
          imageUrl: url,
          strategy: strategy.name,
          cached: false
        };
      }
    } catch (error) {
      console.log(\`策略 \${strategy.name} 失败: \`, error.message);
      continue;
    }
  }
  
  // 所有策略都失败，返回本地占位图
  return {
    success: true,
    foodId,
    imageUrl: \`http://localhost:33038/api/placeholder/food/\${foodId}\`,
    strategy: 'local',
    cached: false,
    fallback: true
  };
});
