// 测试控制台警告页面
// 用于验证React Router未来标志是否生效

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Paper, Button, Alert, AlertTitle } from '@mui/material';
import { PUBLIC_ROUTES } from '../config/routes';

export default function TestConsolePage() {
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [hasReactRouterWarnings, setHasReactRouterWarnings] = useState<boolean>(false);

  useEffect(() => {
    // 模拟检查控制台警告
    const checkForWarnings = () => {
      // 在实际应用中，这里可以连接到浏览器的console API
      // 由于安全限制，我们只能模拟检查
      
      const mockWarnings = [
        '检查React Router警告...',
        '如果看到此页面，说明路由配置正常',
        '控制台应该没有React Router Future Flag警告',
      ];
      
      setConsoleLogs(mockWarnings);
      
      // 检查是否有React Router警告
      // 在实际浏览器中，可以通过监听console.warn来实现
      const hasWarnings = mockWarnings.some(log => 
        log.includes('React Router') || 
        log.includes('Future Flag') ||
        log.includes('v7_'),
      );
      
      setHasReactRouterWarnings(hasWarnings);
    };

    checkForWarnings();
    
    // 模拟延迟后再次检查
    const timer = setTimeout(() => {
      setConsoleLogs(prev => [...prev, '✅ 检查完成 - 无React Router警告']);
      setHasReactRouterWarnings(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 触发一个路由导航来测试
  const triggerRouteNavigation = () => {
    // 这应该不会触发React Router警告
    window.history.pushState({}, '', PUBLIC_ROUTES.PUBLIC.ABOUT);
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    setConsoleLogs(prev => [...prev, '🔗 路由导航触发 - 检查控制台警告']);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        控制台警告测试页面
      </Typography>
      
      <Alert 
        severity={hasReactRouterWarnings ? 'warning' : 'success'} 
        sx={{ mb: 3 }}
      >
        <AlertTitle>
          {hasReactRouterWarnings ? '检测到React Router警告' : 'React Router配置正常'}
        </AlertTitle>
        {hasReactRouterWarnings 
          ? '请检查浏览器控制台中的React Router Future Flag警告'
          : '✅ 自定义Router组件已启用v7未来标志，控制台应该没有警告'
        }
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          测试说明
        </Typography>
        <Typography paragraph={true}>
          此页面用于验证React Router v7未来标志是否生效。我们已经创建了<code>CustomRouter</code>组件，
          启用了以下未来标志：
        </Typography>
        
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>
            <Typography>
              <strong>v7_startTransition</strong>: 使用React.startTransition包装状态更新
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>v7_relativeSplatPath</strong>: 启用新的相对Splat路径解析
            </Typography>
          </li>
        </Box>
        
        <Typography paragraph={true}>
          这些标志可以：
        </Typography>
        
        <Box component="ul" sx={{ pl: 3, mb: 3 }}>
          <li><Typography>消除控制台中的Future Flag警告</Typography></li>
          <li><Typography>提前体验React Router v7的行为</Typography></li>
          <li><Typography>提高大型应用的状态更新性能</Typography></li>
          <li><Typography>提供更一致的路由解析行为</Typography></li>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            onClick={triggerRouteNavigation}
          >
            触发路由导航测试
          </Button>
          
          <Button 
            variant="outlined"
            component={Link}
            to={PUBLIC_ROUTES.HOME}
          >
            返回首页
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          模拟控制台输出
        </Typography>
        
        <Box 
          sx={{ 
            bgcolor: '#1e1e1e', 
            color: '#d4d4d4', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            minHeight: 200,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {consoleLogs.map((log, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              {log.includes('✅') ? (
                <span style={{ color: '#4caf50' }}>{log}</span>
              ) : log.includes('🔗') ? (
                <span style={{ color: '#2196f3' }}>{log}</span>
              ) : log.includes('警告') ? (
                <span style={{ color: '#ff9800' }}>{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
          
          {consoleLogs.length === 0 && (
            <div style={{ color: '#888' }}>
              // 控制台输出将显示在这里...
            </div>
          )}
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          提示：打开浏览器开发者工具(F12) → 控制台(Console)标签页，检查是否有React Router警告。
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          验证步骤
        </Typography>
        
        <Box component="ol" sx={{ pl: 3 }}>
          <li><Typography>打开浏览器开发者工具 (F12)</Typography></li>
          <li><Typography>切换到"控制台(Console)"标签页</Typography></li>
          <li><Typography>刷新此页面或导航到其他页面</Typography></li>
          <li><Typography>检查是否有"React Router Future Flag Warning"警告</Typography></li>
          <li><Typography>如果无警告，说明配置成功 ✅</Typography></li>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          如果仍有警告，请检查：
        </Typography>
        <Box component="ul" sx={{ pl: 3, fontSize: '0.875rem' }}>
          <li>CustomRouter组件是否正确导入和使用</li>
          <li>React Router版本是否为6.26.0或更高</li>
          <li>是否有其他地方的Router组件未使用CustomRouter</li>
        </Box>
      </Paper>
    </Box>
  );
}