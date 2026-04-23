import React from 'react';
import { Container, Typography, Button } from '@mui/material';

const TestSimplePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🧪 简单测试页面
      </Typography>
      <Typography variant="body1" paragraph>
        如果这个页面能显示，说明路由和React基本功能正常。
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        当前时间: {new Date().toLocaleString()}
      </Typography>
      <Button variant="contained" onClick={() => alert('测试按钮点击')}>
        测试按钮
      </Button>
    </Container>
  );
};

export default TestSimplePage;
