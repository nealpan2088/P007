#!/bin/bash
# 麒麟项目健康监测脚本
# 每5分钟检查一次，记录运行时长和状态到日志

LOG_DIR="/home/admin/projects/P007/logs"
MONITOR_LOG="$LOG_DIR/health-monitor.log"
START_TIME_FILE="$LOG_DIR/.monitor_start"

mkdir -p "$LOG_DIR"

# 首次运行记录启动时间
if [ ! -f "$START_TIME_FILE" ]; then
  date +%s > "$START_TIME_FILE"
  echo "$(date '+%Y-%m-%d %H:%M:%S') | 🟢 监测启动" >> "$MONITOR_LOG"
fi

START_TIME=$(cat "$START_TIME_FILE")
NOW=$(date +%s)
UPTIME_SEC=$((NOW - START_TIME))
UPTIME_HOURS=$((UPTIME_SEC / 3600))
UPTIME_MIN=$(((UPTIME_SEC % 3600) / 60))
UPTIME_STR="${UPTIME_HOURS}h ${UPTIME_MIN}m"

# 检查后端
BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:33038/api/health 2>/dev/null)
BACKEND_PM2=$(pm2 status 2>/dev/null | grep -c "qilin-backend.*online")
BACKEND_MEM=$(pm2 show qilin-backend 2>/dev/null | grep "memory" | head -1 | awk '{print $NF}')

# 检查前端 Nginx
NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://saas.openyun.xin/ 2>/dev/null)
NGINX_API=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://saas.openyun.xin/api/health 2>/dev/null)

# 检查 Nginx 进程
NGINX_PID=$(ps aux | grep "nginx: master" | grep -v grep | awk '{print $2}')

# 综合状态
if [ "$BACKEND_HTTP" = "200" ] && [ "$BACKEND_PM2" -ge 1 ] && [ -n "$NGINX_PID" ]; then
  STATUS="🟢 正常"
elif [ "$BACKEND_HTTP" != "200" ] || [ "$BACKEND_PM2" -eq 0 ]; then
  STATUS="🔴 后端异常"
elif [ -z "$NGINX_PID" ]; then
  STATUS="🔴 Nginx异常"
else
  STATUS="🟡 部分异常"
fi

# 记录日志
echo "$(date '+%Y-%m-%d %H:%M:%S') | $STATUS | 运行: $UPTIME_STR | 后端: $BACKEND_HTTP/$BACKEND_PM2 | Nginx: $NGINX_HTTP/$NGINX_API | 内存: $BACKEND_MEM" >> "$MONITOR_LOG"

# 如果异常，打印到 stderr 方便排查
if [ "$STATUS" != "🟢 正常" ]; then
  echo "[告警] $STATUS | 后端HTTP=$BACKEND_HTTP PM2=$BACKEND_PM2 NginxPID=$NGINX_PID" >&2
fi

# 输出最后5条
tail -1 "$MONITOR_LOG"
