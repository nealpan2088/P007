/**
 * 测试 Header - 使用最原始的方式验证渐变是否生效
 */
export default function TestScanHeader() {
  // 直接在组件挂载时操作 DOM
  if (typeof document !== 'undefined' && !document.getElementById('test-header-style')) {
    const style = document.createElement('style');
    style.id = 'test-header-style';
    style.textContent = `
      .test-red-bg {
        background: red !important;
        color: yellow !important;
        font-size: 24px !important;
        padding: 20px !important;
        text-align: center !important;
        min-height: 60px !important;
        line-height: 60px !important;
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div className="test-red-bg">
      🧪 测试 Header - 如果看到红色背景表示 CSS 生效！
    </div>
  );
}
