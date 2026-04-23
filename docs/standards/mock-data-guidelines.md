# 模拟数据标识规范

## 目的
清晰区分模拟数据和真实数据，避免开发混淆。

## 标识要求

### 1. 注释标识
所有模拟数据必须用以下注释包裹：
```typescript
// 🚨 模拟数据警告 🚨
// 以下为模拟数据，仅用于开发和演示
// 实际使用时必须替换为真实API调用
// 模拟数据开始
const mockData = { ... };
// 模拟数据结束
```

### 2. 变量命名
模拟数据变量必须以 `mock` 或 `MOCK` 开头：
- `mockUserData`
- `MOCK_PRODUCTS`
- `mockOrders`

### 3. 模式标志
使用模拟数据的组件必须定义模式标志：
```typescript
const isMockMode = true; // 设置为false时使用真实API
```

### 4. UI警告
在模拟数据模式下，必须在页面顶部显示警告：
```tsx
{isMockMode && (
  <Alert severity="warning" icon={<WarningIcon />}>
    <strong>模拟数据模式</strong> - 当前显示的是模拟数据，仅用于开发和演示。
  </Alert>
)}
```

### 5. 数据标签
在显示模拟数据的地方添加标签：
```tsx
<Typography variant="h4">
  {user.name}
  {isMockMode && <Chip label="模拟数据" color="warning" size="small" />}
</Typography>
```

## 转换指南

### 从模拟数据切换到真实API
1. 将 `isMockMode` 设置为 `false`
2. 实现对应的后端API接口
3. 替换 `useState` 初始值为 `null` 或空数组
4. 在 `useEffect` 中添加API调用
5. 移除模拟数据警告UI（或改为开发模式提示）

### 示例转换
```typescript
// 模拟数据模式
const isMockMode = true;
const [data, setData] = useState(mockData);

// 真实API模式
const isMockMode = false;
const [data, setData] = useState(null);

useEffect(() => {
  if (!isMockMode) {
    fetch(API_ENDPOINTS.REAL_DATA)
      .then(res => res.json())
      .then(setData);
  }
}, []);
```

## 检查清单
- [ ] 模拟数据有清晰注释
- [ ] 变量名以 mock/MOCK 开头
- [ ] 定义了 isMockMode 标志
- [ ] 页面显示模拟数据警告
- [ ] 数据项有模拟标签
- [ ] 有TODO注释说明如何切换到真实API

## 违规处理
发现未标识的模拟数据必须立即添加标识，否则可能导致：
1. 开发混淆（以为是真实数据）
2. 测试不准确
3. 生产环境问题
