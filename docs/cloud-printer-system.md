# 云打印机系统文档

## 总览

P007麒麟项目云打印机系统采用**适配器模式**设计，支持多品牌打印机接入。
当前已实现品牌：**商鹏云打印**。

## 核心概念

| 角色 | 说明 |
|------|------|
| **平台凭证** | 在商鹏开放平台注册获取，所有店铺共用（appid + appsecret） |
| **设备SN** | 每台打印机底部标签上的设备编号 |
| **设备KEY** | 每台打印机底部标签上的设备密钥（pkey），跟平台appsecret无关 |

## 数据流

```
用户下单 → P007后端
  → print-dispatcher 查店铺活跃打印机
  → 适配器用 平台appid + 平台appsecret 生成签名
  → POST /printer/print (传 sn=打印机SN)
  → 商鹏云推送到对应SN的打印机
```

签名算法：
1. 参数按ASCII字典序排序
2. 过滤空值（空字符串不参与，但"0"参与）
3. 拼接 `key=value` 成 stringA
4. 末尾追加 `&appsecret=xxx`
5. MD5 → 转大写

## 商用凭证

存放在 `.env.development`：

```env
SHANGPENG_APP_ID=sp69c62e5025d1e
SHANGPENG_APP_SECRET=3e9bd77a8e2f8d571a06ca777269dfbb
SHANGPENG_BASE_URL=https://open.spyun.net/v1
SHANGPENG_TIMEOUT=15000
```

所有代码从 `process.env.SHANGPENG_APP_ID` / `SHANGPENG_APP_SECRET` 读取，无硬编码。

## 测试环境打印机

- SN: `1928412350`
- 设备KEY: `fftj4bsr`
- 型号: SP-T5-WA
- 当前在线: ✅

## 商鹏API清单

### 添加打印机
- `POST /printer/add`
- body: `appid, sn, pkey, name, business(1=打印), timestamp, sign`
- 注意: name参数不要包含中文，否则签名可能失败（自动转为纯英文或SN）
- errorcode: 0=成功, 5=已添加

### 打印订单
- `POST /printer/print`
- body: `appid, sn, content, times, timestamp, sign`

### 删除打印机
- `DELETE /printer/delete`
- body/URL: `appid, sn, timestamp, sign`

### 清空待打印队列
- `DELETE /printer/cleansqs`
- URL params: `appid, sn, timestamp, sign`

### 获取设备信息
- `GET /printer/info`
- URL params: `appid, sn, timestamp, sign` 

### 查询打印状态
- `GET /printer/order/status`
- URL params: `appid, id(打印订单ID), timestamp, sign`

### 签名算法
```
参数名ASCII字典序排序 → key1=value1&key2=value2... → 末尾加 &appsecret=xxx → MD5 → 大写
```

## 文件结构

```
apps/backend/src/services/printer/
├── adapters/
│   ├── BaseAdapter.js              ← 基类（小票格式模板）
│   ├── ShangpengAdapter.js         ← 商鹏：添加/删除/打印/测试/清空/查状态/查信息
│   ├── ShangpengSignatureService.js← 签名算法
│   └── index.js                    ← 适配器工厂（可动态注册新品牌）
├── printer.service.js              ← CRUD + 云端同步
└── print-dispatcher.js             ← 订单创建后异步触发打印
```

## API路由

前缀 `/api/admin`（当前临时公开，后续需加认证）：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/printers/brands` | 品牌列表 |
| GET | `/printers?storeId=` | 店铺打印机列表 |
| POST | `/printers` | 添加打印机（自动云端注册） |
| PUT | `/printers/:id` | 更新 |
| DELETE | `/printers/:id` | 删除（同步删云端） |
| POST | `/printers/:id/test` | 测试连接（发测试小票） |
| POST | `/printers/:id/clear-queue` | 清空待打印队列 |
| GET | `/printers/:id/info` | 获取设备信息/在线状态 |

## 添加新品牌

1. 在 schema.prisma 的 PrinterBrand 表添加品牌记录
2. 创建适配器文件 `adapters/XxxAdapter.js`，继承 BaseAdapter
3. 在 `adapters/index.js` 中注册
4. 启用在 `printer.service.js` 的 `initDefaultBrands` 中
