// 在线客服聊天 - 管理路由
// 客服回复 / 查看会话列表（需超管Token，在 /api/admin 下）

import chatService from '../services/chat.service.js';
import { ADMIN_ROUTES } from '../config/routes.js';

const jwt = await import('jsonwebtoken');

// 超管 Token 验证
async function adminAuth(request, reply) {
  try {
    const config = (await import('../config/index.js')).default;
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ success: false, error: '未认证，请先登录' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.default.verify(token, config.auth.jwtSecret);
    if (decoded.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ success: false, error: '无权限，仅超管可操作客服' });
    }
    request.admin = decoded;
  } catch (err) {
    return reply.code(401).send({ success: false, error: 'Token 无效或已过期' });
  }
}

async function chatAdminRoutes(fastify) {
  // 所有管理路由需超管认证
  fastify.addHook('preHandler', adminAuth);

  // 客服回复消息
  fastify.post(ADMIN_ROUTES.CHAT.REPLY, async (request, reply) => {
    try {
      const { sessionId, content } = request.body || {};
      if (!sessionId) return reply.code(400).send({ success: false, error: '缺少 sessionId', code: 'MISSING_SESSION_ID' });
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return reply.code(400).send({ success: false, error: '回复内容不能为空', code: 'INVALID_CONTENT' });
      }
      if (content.length > 5000) return reply.code(400).send({ success: false, error: '回复内容不能超过5000个字符', code: 'CONTENT_TOO_LONG' });

      const message = await chatService.replyMessage({ sessionId, content: content.trim() });
      return reply.code(200).send({ success: true, data: message });
    } catch (error) {
      return reply.code(500).send({ success: false, error: '回复消息失败', code: 'CHAT_REPLY_ERROR' });
    }
  });

  // 获取所有会话列表
  fastify.get(ADMIN_ROUTES.CHAT.SESSIONS, async (request, reply) => {
    try {
      const sessions = await chatService.getSessions();
      return reply.code(200).send({ success: true, data: sessions });
    } catch (error) {
      return reply.code(500).send({ success: false, error: '获取会话列表失败', code: 'CHAT_SESSIONS_ERROR' });
    }
  });

  // 获取指定会话的完整消息记录
  fastify.get(ADMIN_ROUTES.CHAT.MESSAGES, async (request, reply) => {
    try {
      const { sessionId } = request.query;
      if (!sessionId) return reply.code(400).send({ success: false, error: '缺少 sessionId 参数', code: 'MISSING_SESSION_ID' });
      const messages = await chatService.getMessages({ sessionId });
      return reply.code(200).send({ success: true, data: messages });
    } catch (error) {
      return reply.code(500).send({ success: false, error: '获取消息记录失败', code: 'CHAT_MESSAGES_ERROR' });
    }
  });
}

export default chatAdminRoutes;
