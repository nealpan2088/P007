# 麒麟项目 - 版本管理规范

## 📋 概述

本文档定义了麒麟项目的版本管理规范、发布流程和版本控制策略。

## 🏷️ 版本号规范

### 语义化版本 (SemVer)
版本号格式：`主版本号.次版本号.修订号`

- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

### 版本一致性要求
以下文件的版本号必须保持一致：
1. `package.json` - 项目根目录
2. `apps/backend/package.json` - 后端
3. `apps/frontend/package.json` - 前端

## 🚀 发布流程

### 1. 预发布检查
```bash
# 运行版本一致性检查
./version-commit.sh

# 或手动检查
grep '"version"' package.json apps/*/package.json
```

### 2. 更新版本号
```bash
# 更新所有package.json文件
sed -i 's/"version": "0.2.5"/"version": "0.2.6"/' package.json
sed -i 's/"version": "0.2.5"/"version": "0.2.6"/' apps/backend/package.json
sed -i 's/"version": "0.2.5"/"version": "0.2.6"/' apps/frontend/package.json
```

### 3. 更新CHANGELOG.md
在CHANGELOG.md文件顶部添加新版本章节：
```markdown
## [0.2.6] - YYYY-MM-DD

### 新增
- 功能描述...

### 修复
- 问题描述...

### 变更
- 变更描述...
```

### 4. 提交版本更新
```bash
# 使用自动化脚本
./version-commit.sh

# 或手动提交
git add .
git commit -m "🔧 配置: 版本 0.2.6 - $(date +%Y-%m-%d)"
git tag -a "v0.2.6" -m "版本 0.2.6 - 版本描述"
```

### 5. 推送到远程仓库
```bash
git push origin main
git push origin --tags
```

## 📊 版本历史

### 当前版本
- **v0.2.5** (2026-04-23): 端口配置管理工具链完整实现

### 版本记录
| 版本 | 日期 | 主要特性 |
|------|------|----------|
| v0.2.5 | 2026-04-23 | 端口配置管理工具链，自动化监控 |
| v0.2.4 | 2026-04-22 | 多租户SaaS架构，扫码点餐基础 |
| v0.2.3 | 2026-04-21 | 规范化保障体系建立 |
| v0.2.2 | 2026-04-20 | 基础架构搭建 |
| v0.2.1 | 2026-04-19 | 项目初始化 |

## 🔧 版本管理工具

### 自动化脚本
```bash
# 版本提交脚本
./version-commit.sh

# 版本一致性检查
grep '"version"' package.json apps/*/package.json

# 生成版本报告
echo "当前版本: $(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
```

### Git命令参考
```bash
# 查看版本历史
git log --oneline --decorate --graph

# 查看标签
git tag -l

# 查看特定版本的代码
git checkout v0.2.5

# 比较版本差异
git diff v0.2.4..v0.2.5
```

## 📁 版本相关文件

### 必须维护的文件
1. **CHANGELOG.md** - 版本更新日志
2. **package.json** - 版本定义文件
3. **VERSION-MANAGEMENT.md** - 版本管理规范

### 自动生成的文件
1. **Git标签** - 版本标记
2. **提交历史** - 版本变更记录

## 🛡️ 质量保证

### 版本发布前检查清单
- [ ] 所有package.json版本号一致
- [ ] CHANGELOG.md已更新
- [ ] 代码通过所有测试
- [ ] 文档已同步更新
- [ ] 版本标签已创建
- [ ] 远程仓库已推送

### 版本回滚流程
```bash
# 回滚到上一个版本
git checkout v0.2.4

# 创建修复分支
git checkout -b hotfix/v0.2.5

# 合并修复到主分支
git checkout main
git merge hotfix/v0.2.5
```

## 🔄 持续集成

### 自动化版本检查
项目配置了以下自动化检查：
1. **每日端口检查** - 确保配置一致性
2. **版本一致性检查** - 确保版本号统一
3. **文档同步检查** - 确保文档与代码同步

### Cron定时任务
```bash
# 每天上午9点和下午3点检查
0 9,15 * * * cd /home/admin/projects/P007 && ./daily-port-check.sh

# 每周日志轮转
0 2 * * 0 cd /home/admin/projects/P007 && ./log-rotate-config.sh
```

## 📝 最佳实践

### 版本命名约定
- 使用语义化版本 (SemVer)
- 版本号前加 `v` 前缀 (如 `v0.2.5`)
- 提交信息包含版本号
- 标签描述清晰明确

### 版本发布频率
- **主版本**: 重大架构变更时发布
- **次版本**: 每月或每季度发布
- **修订版**: 根据需要随时发布

### 版本兼容性
- 次版本和修订版必须向后兼容
- 主版本变更需提供迁移指南
- 废弃的API需提前通知

## 🎯 版本管理目标

### 短期目标 (1个月)
- 建立完整的版本管理流程
- 实现版本发布自动化
- 确保100%版本一致性

### 中期目标 (3个月)
- 集成CI/CD版本发布
- 实现自动化版本号递增
- 建立版本质量门禁

### 长期目标 (6个月)
- 实现完全自动化版本管理
- 建立版本发布仪表板
- 集成生产环境部署

## 📞 支持与维护

### 版本问题处理
1. **版本冲突**: 检查所有package.json文件
2. **标签冲突**: 删除旧标签后重新创建
3. **推送失败**: 检查网络和权限设置

### 联系信息
- 项目维护者: 麒麟项目团队
- 版本管理: 自动化工具链支持
- 问题反馈: GitHub Issues

---

**最后更新**: 2026-04-23  
**当前版本**: 0.2.5  
**文档版本**: 1.0.0