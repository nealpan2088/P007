// 聊天服务 - 基于文件的轻量级客服聊天系统
// 支持多会话、消息存储、SSE 实时推送、自动 AI 回复

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/chat');

// SSE 订阅者（按 sessionId 分组）
const subscribers = new Map();

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 获取会话文件路径
function getSessionFile(sessionId) {
  return path.join(DATA_DIR, `${sessionId}.json`);
}

// 获取会话消息列表
function getMessages(sessionId) {
  ensureDataDir();
  const filePath = getSessionFile(sessionId);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 保存消息到文件
function saveMessages(sessionId, messages) {
  ensureDataDir();
  const filePath = getSessionFile(sessionId);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8');
}

// 通知所有 SSE 订阅者
function notifySubscribers(sessionId, message) {
  const subs = subscribers.get(sessionId);
  if (!subs) return;
  const data = JSON.stringify(message);
  for (const res of subs) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // 忽略断开的连接
    }
  }
}

// 清理断开的 SSE 订阅者
function cleanupSubscribers(sessionId) {
  const subs = subscribers.get(sessionId);
  if (!subs) return;
  const alive = [];
  for (const res of subs) {
    if (!res.destroyed) alive.push(res);
  }
  if (alive.length > 0) {
    subscribers.set(sessionId, alive);
  } else {
    subscribers.delete(sessionId);
  }
}

const ChatService = {
  /**
   * 发送用户消息
   */
  async sendMessage({ sessionId, name, content, contact }) {
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    const messages = getMessages(sessionId);
    const message = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'user',
      name: name || '访客',
      content,
      contact: contact || '',
      createdAt: new Date().toISOString(),
    };
    messages.push(message);
    saveMessages(sessionId, messages);

    // 推送给 SSE 订阅者
    notifySubscribers(sessionId, message);

    // 异步触发 AI 自动回复（不阻塞）
    triggerAutoReply(sessionId, content, name, messages).catch(() => {});

    return { sessionId, message };
  },

  /**
   * 客服回复（由 OpenClaw 或其他客服调用）
   */
  async replyMessage({ sessionId, content }) {
    const messages = getMessages(sessionId);
    const message = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'assistant',
      name: '花花',
      content,
      createdAt: new Date().toISOString(),
    };
    messages.push(message);
    saveMessages(sessionId, messages);

    // 推送给 SSE 订阅者
    notifySubscribers(sessionId, message);

    return message;
  },

  /**
   * 获取会话消息（since 可选，只返回之后的消息）
   */
  async getMessages({ sessionId, since }) {
    const messages = getMessages(sessionId);
    if (since) {
      const sinceDate = new Date(since).getTime();
      return messages.filter(m => new Date(m.createdAt).getTime() > sinceDate);
    }
    return messages;
  },

  /**
   * 注册 SSE 订阅
   */
  subscribe(sessionId, response) {
    if (!subscribers.has(sessionId)) {
      subscribers.set(sessionId, []);
    }
    subscribers.get(sessionId).push(response);

    // 连接断开时自动清理
    response.on('close', () => {
      cleanupSubscribers(sessionId);
    });
  },

  /**
   * 获取所有活跃会话列表
   */
  async getSessions() {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const sessions = [];
    for (const file of files) {
      const sessionId = file.replace('.json', '');
      const messages = getMessages(sessionId);
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        sessions.push({
          sessionId,
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1],
          lastActivity: lastMsg.createdAt,
          unread: messages.filter(m => m.role === 'user'),
        });
      }
    }
    // 按最后活动时间倒序
    sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    return sessions;
  },
};

// ==================== AI 自动回复 ====================

const GATEWAY_URL = 'http://127.0.0.1:18771/v1/chat/completions';
const GATEWAY_TOKEN = '057fb8f60e5c186caadb7150e5fcbc40';
const SYSTEM_PROMPT = [
  '你是花花，麒麟云点餐的在线客服。',
  '',
  '## 身份设定',
  '- 名字：花花',
  '- 性别：女（但你不需要特别强调）',
  '- 语气：亲切、耐心、接地气，偶尔用点小表情 🌸',
  '- 职责：只做业务咨询，不碰服务器、不执行代码、不改配置',
  '',
  '## 产品信息（以本手册为准，禁止自行编造）',
  '产品名：麒麟云点餐（麒麟云点餐 SaaS 平台）',
  '官网：https://saas.openyun.xin',
  '',
  '### 套餐价格',
  '| 套餐 | 价格 | 门店数 | 打印机 | 说明 |',
  '|------|------|--------|--------|------|',
  '| 免费体验版 | ¥0 | 1家 | 用户自购 | 14天体验期 |',
  '| 单店版 | ¥38/月 | 1家 | 用户自购 | 正式版，适合单店 |',
  '| 专业版 | ¥199/月 | 最多5家 | 用户自购 | 适合多店连锁 |',
  '| 企业版 | ¥499/月 | 不限 | 用户自购 | 全部功能+品牌定制+API对接 |',
  '',
  '- 免费版14天体验，到期后需付费',
  '- 按月付费，无年付要求',
  '',
  '### 打印机',
  '- 支持品牌：商鹏云打印机',
  '- 价格：200-400元（用户自行购买）',
  '- 购买渠道：京东、淘宝等电商平台，也可联系我们代购',
  '- **套餐不包含打印机**，系统只提供绑定管理功能',
  '',
  '### 支付方式',
  '- 默认到店支付（顾客扫码下单 → 到店结账）',
  '- 线上支付对接请联系业务经理',
  '',
  '### 业务范围',
  '核心：扫码点餐 → 后厨自动出单',
  '解决的问题：',
  '- 避免客人排队拥挤',
  '- 减少客人等待时间',
  '- 提升运营效率',
  '- 多店统一管理',
  '- 各类餐饮门店通用（中餐、快餐、火锅、奶茶等）',
  '',
  '### 联系与支持',
  '- **业务咨询/购买/合作**：引导加业务微信 cattlesoft',
  '- **技术支持**：引导留联系方式，转给技术同事',
  '- 常用话术："您加我们业务同事微信 cattlesoft 详细沟通吧，会给您最准确的答复 😊"',
  '',
  '### 技术',
  '- 无需安装APP，扫码即用',
  '- 阿里云服务器，数据加密，定期备份',
  '',
  '## 约束（严格遵守）',
  '- **不确定的事情绝对不能瞎说，要说"这个我不确定，您留个联系方式，我让同事联系您"**',
  '- 以本手册为准，手册没有的内容一律引导留联系方式',
  '- 涉及服务器、代码、数据库的技术问题，礼貌拒绝并转给管理员',
  '- 每轮回复尽量简洁（100字以内）',
  '- **宁可说"我不确定"，也不能瞎承诺，否则会有商业纠纷**',
].join('\n');

// 最近5分钟内的消息去重（防止重复触发回复）
const recentReplies = new Map();

async function triggerAutoReply(sessionId, userContent, userName, existingMessages) {
  // 防重复：同会话5秒内不重复触发
  const dedupKey = `${sessionId}:reply`;
  const now = Date.now();
  if (recentReplies.has(dedupKey) && now - recentReplies.get(dedupKey) < 5000) {
    return;
  }
  recentReplies.set(dedupKey, now);

  try {
    // 获取最近5条消息作为上下文
    const recent = existingMessages.slice(-5).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: `${m.role === 'user' ? (m.name || '访客') : '花花'}: ${m.content}`
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recent.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: `${userName || '访客'}: ${userContent}` }
    ];

    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'default',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`🤖 AI 回复失败: ${response.status}`);
      return;
    }

    const data = await response.json();
    const replyContent = data?.choices?.[0]?.message?.content;

    if (!replyContent || replyContent.trim().length === 0) {
      console.error('🤖 AI 回复为空');
      return;
    }

    // 自动保存回复
    const replyMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'assistant',
      name: '花花',
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    const allMsgs = getMessages(sessionId);
    allMsgs.push(replyMessage);
    saveMessages(sessionId, allMsgs);
    notifySubscribers(sessionId, replyMessage);

    console.log(`🌸 花花已自动回复会话 ${sessionId.slice(0, 8)}...`);
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error(`🤖 AI 自动回复出错: ${error.message}`);
  }
}

export default ChatService;
