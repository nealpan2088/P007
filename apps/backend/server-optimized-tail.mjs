const start = async () => {
  try {
    const port = process.env.PORT || 33038;
    
    // 测试数据库连接
    console.log('测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 优化后端启动成功！`);
    console.log(`📡 地址: http://localhost:${port}`);
    console.log(`📋 健康检查: http://localhost:${port}/api/health`);
    console.log(`👥 真实租户数据: http://localhost:${port}/api/test/tenants`);
    console.log(`🏪 店铺列表: http://localhost:${port}/api/stores`);
    console.log(`🍽️  扫码点餐: http://localhost:${port}/api/public/stores/phoenix-main/menu`);
    console.log(`💾 数据库: ${process.env.DATABASE_URL?.split('@')[1] || '未知'}`);
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到关闭信号，正在清理...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

start();