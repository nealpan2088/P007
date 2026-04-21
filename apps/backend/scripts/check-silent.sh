#!/bin/bash

# 静默检查脚本 - 用于Git钩子等场景
# 只返回退出码，不输出信息（除非失败）

# 加载环境变量
if [ -f setup-env.sh ]; then
    source setup-env.sh > /dev/null 2>&1
fi

# 检查计数器
errors=0

# 1. 检查配置
node -e "import('./src/config/dynamic-config.js').then(c => { c.default.validate(); }).catch(e => { console.error('配置验证失败:', e.message); process.exit(1); })" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    errors=$((errors + 1))
fi

# 2. 检查路由
node -e "import('./src/config/routes.js').then(r => { const routes = r.default || r; routes.getAllRoutes(); }).catch(e => { console.error('路由系统错误:', e.message); process.exit(1); })" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    errors=$((errors + 1))
fi

# 3. 检查硬编码（只检查严重错误，忽略警告）
if [ -f "../../scripts/check-hardcoded.sh" ]; then
    # 运行检查，但只关注退出码
    ../../scripts/check-hardcoded.sh > /dev/null 2>&1
    exit_code=$?
    
    # 如果退出码是1（严重错误），则记录错误
    if [ $exit_code -eq 1 ]; then
        errors=$((errors + 1))
    fi
    # 如果退出码是0或2（警告），则忽略
fi

# 返回结果
if [ $errors -eq 0 ]; then
    exit 0  # 成功
else
    exit 1  # 失败
fi