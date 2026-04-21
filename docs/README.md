# 📚 P007项目文档索引

## 核心文档
* [项目README](../README.md) - 项目概述、快速开始、架构说明
* [CHANGELOG](../CHANGELOG.md) - 版本更新记录
* [开发规范](development-guidelines.md) - 开发流程与规范

## 类型安全文档
* [类型修复指南](type-fix-guidelines.md) - TypeScript类型规范化修复流程与最佳实践
* [类型修复快速参考](type-fix-quick-reference.md) - 紧急情况下的快速修复指南
* [类型修复记录](type-fix-log.md) - 类型修复历史记录与学习总结

## 配置文档
* [环境配置模板](../apps/backend/.env.template) - 后端环境变量配置模板
* [路由配置说明](../apps/backend/src/config/routes.js) - API路由配置说明
* [前端配置说明](../apps/frontend/src/config/) - 前端配置管理

## 工具文档
* [服务器检查脚本](../check-servers.sh) - 一键服务器状态检查
* [数据库初始化脚本](../scripts/init-database.sh) - 数据库初始化工具
* [部署脚本](../scripts/deploy/) - 部署与运维工具

## 架构文档
* [数据库Schema](../apps/backend/prisma/schema.prisma) - 数据库表结构设计
* [API设计规范](api-design.md) - API接口设计规范
* [组件设计规范](component-design.md) - 前端组件设计规范

## 运维文档
* [监控与告警](monitoring.md) - 系统监控与告警配置
* [备份与恢复](backup-recovery.md) - 数据备份与恢复流程
* [故障处理](troubleshooting.md) - 常见故障处理指南

## 更新日志
- **2026-04-21**: 创建类型安全文档体系
- **2026-04-20**: 更新开发规范文档
- **2026-04-19**: 创建配置管理文档

## 文档维护
- **维护者**: 开发团队
- **更新频率**: 每周更新
- **审核流程**: PR审核 + 团队评审

> 提示：所有文档都应保持最新，反映当前项目状态。
