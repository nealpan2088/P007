/**
 * 短链重定向路由
 * GET /s/:code → 301 重定向到完整扫码URL
 */
import { publicDb } from '../db/index.js';

/**
 * 注册短链路由
 * @param {FastifyInstance} fastify
 */
export default async function registerShortLinkRoutes(fastify) {
  // 短链重定向：/s/{shortCode}
  fastify.get('/s/:code', async (request, reply) => {
    const { code } = request.params;

    if (!code || code.length < 3 || code.length > 10) {
      return reply.code(404).send({ error: 'Not Found' });
    }

    try {
      const table = await publicDb.table.findUnique({
        where: { shortCode: code },
        include: {
          store: {
            select: {
              slug: true,
              tenantId: true,
              tenant: {
                select: { subdomain: true },
              },
            },
          },
        },
      });

      if (!table || !table.store || !table.store.tenant) {
        return reply.code(404).type('text/html').send('<h1>404 链接无效</h1><p>该二维码已失效，请联系商家。</p>');
      }

      // 构造完整扫码URL → 重定向
      const targetUrl = `/t/${table.store.tenant.subdomain}/s/${table.store.slug}/scan/${table.tableNumber}`;

      return reply.code(302).header('Location', targetUrl).send();
    } catch (error) {
      request.log.error({ msg: '短链解析失败', code, error: error.message });
      return reply.code(500).type('text/html').send('<h1>服务器错误</h1>');
    }
  });
}
