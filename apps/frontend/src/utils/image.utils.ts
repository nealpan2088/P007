/**
 * 菜品图片工具
 * 统一的图片处理逻辑：格式校验、默认占位图
 */

// 允许的图片格式
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// 默认菜品占位图（内嵌 base64 SVG）
export const DEFAULT_FOOD_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect fill="#f3f4f6" width="400" height="400"/>
  <g transform="translate(140, 140)">
    <circle cx="60" cy="60" r="60" fill="#d1d5db"/>
    <path d="M60 80C30 80 0 95 0 140h120c0-45-30-60-60-60z" fill="#9ca3af"/>
    <line x1="20" y1="100" x2="100" y2="100" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
    <line x1="25" y1="110" x2="95" y2="110" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
    <line x1="30" y1="120" x2="90" y2="120" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4"/>
  </g>
  <text x="200" y="310" text-anchor="middle" fill="#9ca3af" font-size="14" font-family="sans-serif">暂无图片</text>
</svg>`);

/**
 * 获取菜品图片 URL，无图时返回默认占位图
 */
export function getFoodImageUrl(imageUrl: string | null | undefined): string {
  return imageUrl?.trim() || DEFAULT_FOOD_IMAGE;
}

/**
 * 校验图片文件
 * @returns 错误信息，为空表示通过
 */
export function validateImageFile(file: File): string {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return `不支持的图片格式: ${ext}。支持: JPG, PNG, GIF, WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `图片大小不能超过 2MB（当前: ${(file.size / 1024 / 1024).toFixed(1)}MB）`;
  }
  return '';
}

/**
 * 校验图片 URL 格式（基本校验）
 */
export function isValidImageUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/uploads/') ||
    url.startsWith('data:image/')
  );
}
