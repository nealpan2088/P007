/**
 * API端点常量配置
 * 所有后端API路径统一在 api-routes.ts 中定义，此文件仅为兼容旧引用
 *
 * 废弃说明：
 * 请统一使用 api-routes.ts 中的 PUBLIC_API_ROUTES / TENANT_API_ROUTES 常量
 * 或通过 apiBuilders 便捷函数构建API URL
 */

export { API_ENDPOINTS as default, API_ENDPOINTS } from './api-routes';
