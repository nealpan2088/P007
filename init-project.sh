#!/bin/bash

# P007项目初始化脚本
# 使用: bash init-project.sh [项目类型]

set -e

PROJECT_TYPE="${1:-standard}"
PROJECT_NAME="P007"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 开始初始化 P007 项目..."
echo "项目目录: $PROJECT_DIR"
echo "项目类型: $PROJECT_TYPE"

# 创建基础目录结构
echo "📁 创建目录结构..."
mkdir -p apps/frontend/src/{components,pages,api,hooks,utils,styles}
mkdir -p apps/backend/src/{routes,services,models,middleware,utils}
mkdir -p docs scripts

# 创建基础配置文件
echo "📄 创建配置文件..."

# 创建前端 package.json 模板
cat > apps/frontend/package.json << 'EOF'
{
  "name": "p007-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "typescript": "^5.0.0",
    "vite": "^7.3.2",
    "vitest": "^1.0.0"
  }
}
EOF

# 创建后端 package.json 模板
cat > apps/backend/package.json << 'EOF'
{
  "name": "p007-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "lint": "eslint . --ext js,mjs --report-unused-disable-directives --max-warnings 0",
    "test": "vitest"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.0",
    "@prisma/client": "^5.0.0",
    "fastify": "^5.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.56.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
EOF

# 创建 Vite 配置
cat > apps/frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:33037',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
EOF

# 创建 TypeScript 配置
cat > apps/frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > apps/frontend/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
EOF

# 创建基础 React 应用
cat > apps/frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > apps/frontend/src/App.tsx << 'EOF'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import './styles/App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav>
          <ul>
            <li><Link to="/">首页</Link></li>
            <li><Link to="/about">关于</Link></li>
          </ul>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
EOF

# 创建基础页面
cat > apps/frontend/src/pages/HomePage.tsx << 'EOF'
export default function HomePage() {
  return (
    <div>
      <h1>欢迎来到 P007 项目</h1>
      <p>这是一个新的项目，正在开发中...</p>
    </div>
  )
}
EOF

cat > apps/frontend/src/pages/AboutPage.tsx << 'EOF'
export default function AboutPage() {
  return (
    <div>
      <h1>关于 P007 项目</h1>
      <p>项目类型: [待定]</p>
      <p>创建时间: 2026-04-21</p>
      <p>技术栈: React + Fastify + PostgreSQL</p>
    </div>
  )
}
EOF

# 创建样式文件
cat > apps/frontend/src/styles/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

cat > apps/frontend/src/styles/App.css << 'EOF'
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

nav ul {
  display: flex;
  list-style: none;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

nav a:hover {
  color: #007bff;
}

main {
  padding: 40px 0;
}
EOF

# 创建后端基础服务器
cat > apps/backend/src/index.js << 'EOF'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const fastify = Fastify({
  logger: true
})

// 注册 CORS
await fastify.register(cors, {
  origin: ['http://localhost:5177'],
  credentials: true
})

// 健康检查端点
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'p007-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  }
})

// API 路由
fastify.get('/api/hello', async () => {
  return {
    message: 'Hello from P007 API!',
    timestamp: new Date().toISOString()
  }
})

// 启动服务器
const start = async () => {
  try {
    const port = process.env.PORT || 33037
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 P007 后端服务器启动成功: http://localhost:${port}`)
    console.log(`📊 健康检查: http://localhost:${port}/health`)
    console.log(`👋 API示例: http://localhost:${port}/api/hello`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
EOF

# 创建环境变量示例
cat > apps/backend/.env.example << 'EOF'
# 服务器配置
PORT=33037
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/p007_db"

# JWT 配置
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# 其他配置
API_PREFIX="/api"
EOF

# 创建 README
cat > README.md << 'EOF'
# P007 项目

## 项目状态
🚧 **开发中** - 项目初始化完成

## 快速开始

### 前端开发
```bash
cd apps/frontend
npm install
npm run dev
```
访问: http://localhost:5177

### 后端开发
```bash
cd apps/backend
npm install
npm run dev
```
API地址: http://localhost:33037

## 项目结构
- `apps/frontend/` - 前端 React 应用
- `apps/backend/` - 后端 Fastify API
- `docs/` - 项目文档
- `scripts/` - 工具脚本

## 技术栈
- **前端**: React 19 + TypeScript + Vite
- **后端**: Fastify + Node.js
- **数据库**: PostgreSQL + Prisma
- **开发工具**: ESLint + Prettier + Vitest

## 开发规范
1. 代码提交使用 Conventional Commits
2. 所有功能必须有测试用例
3. API 必须有文档说明
4. 遵循 ESLint 代码规范

## 下一步
1. 确定项目具体需求和功能
2. 设计数据库 schema
3. 开发核心业务功能
4. 完善测试和文档
EOF

# 创建启动脚本
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 启动 P007 开发环境..."

# 启动后端服务器
echo "🔧 启动后端服务器 (端口: 33037)..."
cd apps/backend
npm install 2>/dev/null || echo "后端依赖安装中..."
node src/index.js &
BACKEND_PID=$!
cd ../..

# 等待后端启动
sleep 3

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口: 5177)..."
cd apps/frontend
npm install 2>/dev/null || echo "前端依赖安装中..."
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ 开发环境启动完成!"
echo "🌐 前端: http://localhost:5177"
echo "🔧 后端: http://localhost:33037"
echo "📊 健康检查: http://localhost:33037/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 等待
wait
EOF

chmod +x start-dev.sh

# 创建项目信息文件
cat > project-info.json << 'EOF'
{
  "id": "P007",
  "name": "待定项目",
  "codename": "P007",
  "version": "0.1.0",
  "status": "initialized",
  "type": "待定",
  "path": "/home/admin/projects/P007",
  "description": "P007项目，正在初始化中",
  "services": [
    {
      "name": "前端开发服务器",
      "url": "http://localhost:5177/",
      "port": 5177,
      "status": "ready"
    },
    {
      "name": "后端API服务器",
      "url": "http://localhost:33037/",
      "port": 33037,
      "status": "ready"
    }
  ],
  "owner": "潘哥",
  "created": "2026-04-21",
  "updated": "2026-04-21",
  "current_task": "项目初始化和需求确认"
}
EOF

echo ""
echo "✅ P007 项目初始化完成!"
echo ""
echo "📁 项目目录: $PROJECT_DIR"
echo "📄 项目文档: $PROJECT_DIR/PROJECT.md"
echo "🚀 启动开发环境: bash start-dev.sh"
echo ""
echo "下一步:"
echo "1. 确定项目具体需求和功能"
echo "2. 运行 'bash start-dev.sh' 启动开发环境"
echo "3. 访问 http://localhost:5177 查看前端"
echo "4. 访问 http://localhost:33037/health 检查后端"
echo ""
echo "💡 提示: 请先确定项目类型和具体需求，然后开始开发核心功能。"