# 变更记录

## 版本 0.2.5 (2026-04-22)

### 新增
- **类型系统**: 创建统一的类型定义体系
- **自动化工具**: 添加 `scripts/type-check.sh` 类型检查脚本
- **测试框架**: 添加User类型兼容性测试
- **文档系统**: 创建技术决策记录文档

### 修复
#### TypeScript错误修复 (111个 → 0个)
1. **类型导出问题** (42个)
   - 修复类型被错误作为值导出的问题
   - 更新 `src/types/api.types.ts` 和 `src/types/utility.types.ts`

2. **User类型兼容性** (3个)
   - 统一 `fullName` 属性类型: `string | null | undefined`
   - 修复 `api.types.ts` 和 `simple-auth.ts` 类型不一致问题
   - 文件: `src/types/api.types.ts`, `src/api/simple-auth.ts`, `src/hooks/useAuth.ts`

3. **未使用导入和变量** (25个)
   - 清理所有未使用的导入和变量
   - 文件: 多个页面组件文件

4. **函数类型不匹配** (15个)
   - 修复 `submitOrder` 函数返回类型
   - 文件: `src/pages/scan-order/hooks/useScanOrder.ts`

5. **组件属性问题** (20个)
   - 修复Card组件不存在的属性
   - 文件: `src/pages/store-management/StoreDetailPage.tsx`

6. **循环引用问题** (6个)
   - 修复工具类型中的循环引用
   - 文件: `src/types/utility.types.ts`

#### 具体文件修复
- `src/App.tsx`: 删除未使用的CreateStorePage导入
- `src/AppTest.tsx`: 删除未使用的React导入
- `src/pages/CreateTenant.tsx`: 修复表单类型和未使用变量
- `src/pages/TenantDashboard.tsx`: 修复未使用状态变量
- `src/pages/TenantManagement.tsx`: 清理未使用导入
- `src/pages/scan-order/index.tsx`: 修复函数引用和未使用变量
- `src/pages/store-management/*`: 修复多个店铺管理页面类型问题
- `src/utils/fetch-utils.ts`: 修复API响应类型

### 改进
1. **代码质量**
   - 建立完整的类型检查流程
   - 集成ESLint自动修复
   - 创建预提交检查脚本

2. **开发流程**
   - 添加 `npm run check:types` 命令
   - 添加 `npm run pre-commit` 命令
   - 集成到 `npm run quality` 检查流程

3. **文档完善**
   - 创建技术决策记录: `docs/technical-decisions/2026-04-22-typescript-fixes.md`
   - 更新架构文档
   - 添加类型系统说明

### 技术决策
1. **User类型统一**: 采用 `string | null | undefined` 类型保持兼容性
2. **类型导出策略**: 只做类型导出，不作为值导出
3. **代码清理原则**: 删除所有未使用代码，提高可读性
4. **自动化验证**: 建立自动化类型检查流程

### 测试覆盖
- ✅ 添加User类型兼容性测试
- ✅ 验证类型修复正确性
- ✅ 测试边界情况 (null, undefined, string值)

### 影响评估
#### 积极影响
1. **代码质量**: TypeScript错误从111个减少到0个
2. **类型安全**: 建立完整的类型系统
3. **开发效率**: 自动化检查减少人工错误
4. **维护性**: 统一类型定义便于长期维护

#### 潜在风险
1. **向后兼容**: 确保现有功能不受影响
2. **API兼容**: 需要后端返回兼容的数据格式
3. **测试覆盖**: 需要补充更多单元测试

### 验证结果
- ✅ `npm run check:config`: 通过 (0个错误)
- ✅ `npm run check:types`: 通过
- ✅ `npm run lint`: 通过 (剩余警告可逐步修复)
- ✅ 前后端服务: 正常运行

### 后续计划
1. **短期** (本周内)
   - 补充更多单元测试
   - 完善类型文档
   - 优化ESLint配置

2. **中期** (本月内)
   - 实现100%类型覆盖率
   - 建立完整的测试套件
   - 优化性能监控

3. **长期** (季度内)
   - 建立CI/CD流水线
   - 实现自动化部署
   - 建立监控告警系统

---

## 版本 0.2.4 (2026-04-21)

### 新增
- 多店模式架构实现
- 路径参数URL方案 (`/t/{tenantSlug}/s/{storeSlug}/scan/{tableId}`)
- 店铺管理功能页面

### 修复
- 后端服务器端口从33037迁移到33038
- 修复数据库连接问题
- 优化PM2进程管理

### 改进
- 建立规范化检查系统
- 创建自动化部署脚本
- 完善项目文档

---

## 版本 0.2.3 (2026-04-20)

### 初始版本
- 基础SaaS架构搭建
- 扫码点餐核心功能
- 租户管理系统
- 基础认证功能

---

*注: 此变更记录遵循语义化版本控制，记录所有重要变更。*