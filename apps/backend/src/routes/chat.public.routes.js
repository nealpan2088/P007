// 在线客服聊天 - 公开路由
// 访客发送消息 / 轮询消息 / SSE实时推送（均在 /api/public 下）

import chatService from '../services/chat.service.js';
import { PUBLIC_ROUTES } from '../config/routes.js';

// 限频配置
const rateLimits = new Map();
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(key, maxCount) {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    rateLimits.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  if (record.count >= maxCount) {
    return { allowed: false, remainingMs: RATE_WINDOW_MS - (now - record.windowStart) };
  }
  record.count++;
  return { allowed: true };
}

function rateLimit(maxRequests, name = '') {
  return (request, reply, done) => {
    const ip = request.ip;
    const key = name ? `chat:${name}:${ip}` : `chat:${ip}`;
    const result = checkRateLimit(key, maxRequests);
    if (!result.allowed) {
      reply.code(429).send({
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMITED'
      });
      return;
    }
    done();
  };
}

async function chatPublicRoutes(fastify) {
  // 发送消息（公开）
  fastify.post(PUBLIC_ROUTES.SCAN.CHAT.SEND, {
    preHandler: rateLimit(30, 'chat-send'),
  }, async (request, reply) => {
    try {
      const { sessionId, name, content, contact } = request.body || {};
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return reply.code(400).send({ success: false, error: '消息内容不能为空', code: 'INVALID_CONTENT' });
      }
      if (content.length > 2000) {
        return reply.code(400).send({ success: false, error: '消息内容不能超过2000个字符', code: 'CONTENT_TOO_LONG' });
      }
      if (name && name.length > 50) {
        return reply.code(400).send({ success: false, error: '昵称不能超过50个字符', code: 'NAME_TOO_LONG' });
      }
      if (contact && contact.length > 100) {
        return reply.code(400).send({ success: false, error: '联系方式不能超过100个字符', code: 'CONTACT_TOO_LONG' });
      }

      const result = await chatService.sendMessage({ 
        sessionId, 
        name: name || '访客', 
        content: content.trim(),
        contact: contact || ''
      });

      return reply.code(200).send({
        success: true,
        data: { sessionId: result.sessionId, message: result.message }
      });
    } catch (error) {
      return reply.code(500).send({ success: false, error: '发送消息失败', code: 'CHAT_SEND_ERROR' });
    }
  });

  // 轮询新消息（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.CHAT.MESSAGES, {
    preHandler: rateLimit(60, 'chat-messages'),
  }, async (request, reply) => {
    try {
      const { sessionId, since } = request.query;
      if (!sessionId) {
        return reply.code(400).send({ success: false, error: '缺少 sessionId 参数', code: 'MISSING_SESSION_ID' });
      }
      const messages = await chatService.getMessages({ sessionId, since });
      return reply.code(200).send({ success: true, data: messages });
    } catch (error) {
      return reply.code(500).send({ success: false, error: '获取消息失败', code: 'CHAT_MESSAGES_ERROR' });
    }
  });

  // SSE 实时推送（公开）
  fastify.get(PUBLIC_ROUTES.SCAN.CHAT.STREAM, {
    preHandler: rateLimit(30, 'chat-stream'),
  }, async (request, reply) => {
    const { sessionId } = request.query;
    if (!sessionId) {
      return reply.code(400).send({ success: false, error: '缺少 sessionId 参数', code: 'MISSING_SESSION_ID' });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    chatService.subscribe(sessionId, reply.raw);

    const heartbeat = setInterval(() => {
      try { reply.raw.write(`:heartbeat\n\n`); } catch { clearInterval(heartbeat); }
    }, 30000);

    reply.raw.on('close', () => {
      clearInterval(heartbeat);
      console.log(`🔌 SSE 连接关闭: ${sessionId}`);
    });
  });
}

export default chatPublicRoutes;
