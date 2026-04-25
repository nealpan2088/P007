/**
 * 动态注入全局样式
 * 绕过所有 CSS 加载机制，直接注入到 <head> 中
 */
export function injectScanHeaderStyle(): void {
  const styleId = 'injected-scan-header-style';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .scan-header-global {
      position: sticky !important;
      top: 0 !important;
      z-index: 9999 !important;
      background: linear-gradient(to right, #f97316, #ea580c) !important;
      color: white !important;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
    }
  `;
  document.head.appendChild(style);
}
