# 麒麟项目 部署指南

## 文件说明
| 文件 | 说明 |
|------|------|
| `qilin-complete-backup.tar.gz` | 完整备份包（源码+配置+证书） |

## 解压
```bash
tar -xzf qilin-complete-backup.tar.gz -C /目标目录
```
解压后会得到：`home/`（源码和配置）和 `etc/`（系统配置）

## 恢复步骤

### 1. 恢复代码
```bash
# 源码在 home/admin/projects/P007/
cd /目标目录/home/admin/projects/P007
git status  # 确认仓库完整
```

### 2. 恢复配置文件
- `apps/backend/.env` → 放回 `apps/backend/`
- `apps/frontend/.env.production` → 放回 `apps/frontend/`
- `apps/backend/pm2.ecosystem.config.cjs` → 放回 `apps/backend/`

### 3. 恢复 Nginx 配置
```bash
sudo cp etc/nginx/conf.d/qilin.conf /etc/nginx/conf.d/
sudo nginx -s reload
```

### 4. 恢复 SSL 证书（可选）
如果域名不变，可以让目标机器重新申请证书：
```bash
sudo certbot --nginx -d saas.openyun.xin
```

### 5. 安装依赖
```bash
cd /home/admin/projects/P007
cd apps/backend && npm install
cd ../frontend && npm install && npm run build
```

### 6. 恢复数据库
```bash
# 需要先从原服务器导出数据库
pg_dump qilin_dev > qilin_db_20260425.sql
# 然后在目标机器导入
psql -U postgres -d qilin_dev < qilin_db_20260425.sql
```

### 7. 启动服务
```bash
cd apps/backend
pm2 start pm2.ecosystem.config.cjs
# 验证
curl http://localhost:33038/api/health
```

## 注意事项
- 数据库需要单独导出（未包含在此包中）
- .env 中的 JWT_SECRET 和数据库密码在新环境可能需要修改
- SSL 证书推荐在新机器重新申请（certbot 自动续期）
