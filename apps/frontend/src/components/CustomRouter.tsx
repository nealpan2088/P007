// 自定义Router组件
// 添加React Router v7的未来标志以消除控制台警告

import { BrowserRouter, BrowserRouterProps } from 'react-router-dom';
import { ReactNode } from 'react';

interface CustomRouterProps extends BrowserRouterProps {
  children: ReactNode;
}

/**
 * 自定义Router组件
 * 添加React Router v7的未来标志：
 * 1. v7_startTransition - 启用React.startTransition包装状态更新
 * 2. v7_relativeSplatPath - 启用新的相对Splat路径解析
 * 
 * 这些标志可以提前体验v7的行为，并消除控制台警告
 */
export function CustomRouter({ children, ...props }: CustomRouterProps) {
  return (
    <BrowserRouter
      {...props}
      future={{
        // 启用v7_startTransition标志
        // 这将使用React.startTransition包装状态更新
        // 提高大型应用的状态更新性能
        v7_startTransition: true,
        
        // 启用v7_relativeSplatPath标志
        // 这将改变Splat路由中的相对路由解析方式
        // 提供更一致和可预测的行为
        v7_relativeSplatPath: true,
        
        // 其他可选的未来标志（根据需要启用）
        // v7_fetcherPersist: true,      // 启用fetcher持久化
        // v7_normalizeFormMethod: true,  // 规范化表单方法
        // v7_partialHydration: true,     // 启用部分水合
        // v7_skipActionErrorRevalidation: true, // 跳过动作错误重新验证
      }}
    >
      {children}
    </BrowserRouter>
  );
}

/**
 * 替代方案：使用createBrowserRouter和RouterProvider
 * 如果需要更细粒度的控制，可以使用这种方式
 */
// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import { routes } from '../config/routes';

// const router = createBrowserRouter(routes, {
//   future: {
//     v7_startTransition: true,
//     v7_relativeSplatPath: true,
//     v7_fetcherPersist: true,
//     v7_normalizeFormMethod: true,
//   },
// });

// export function CustomRouterProvider() {
//   return <RouterProvider router={router} />;
// }

export default CustomRouter;