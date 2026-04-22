// 购物车工具函数
import { CartItem, MenuItem } from '../types';

/**
 * 添加菜品到购物车
 */
export function addItemToCart(
  cartItems: CartItem[],
  menuItem: MenuItem,
  quantity: number = 1,
): CartItem[] {
  const existingItemIndex = cartItems.findIndex(
    item => item.menuItemId === menuItem.id,
  );

  if (existingItemIndex >= 0) {
    // 如果已存在，增加数量
    const updatedItems = [...cartItems];
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      quantity: updatedItems[existingItemIndex].quantity + quantity,
    };
    return updatedItems;
  } else {
    // 如果不存在，添加新项
    return [
      ...cartItems,
      {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        imageUrl: menuItem.imageUrl,
      },
    ];
  }
}

/**
 * 更新购物车项数量
 */
export function updateCartItemQuantity(
  cartItems: CartItem[],
  menuItemId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    // 如果数量为0或负数，移除该项
    return cartItems.filter(item => item.menuItemId !== menuItemId);
  }

  return cartItems.map(item =>
    item.menuItemId === menuItemId
      ? { ...item, quantity }
      : item,
  );
}

/**
 * 从购物车移除项
 */
export function removeItemFromCart(
  cartItems: CartItem[],
  menuItemId: string,
): CartItem[] {
  return cartItems.filter(item => item.menuItemId !== menuItemId);
}

/**
 * 计算购物车总金额
 */
export function calculateCartTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * 计算购物车总数量
 */
export function calculateCartItemCount(cartItems: CartItem[]): number {
  return cartItems.reduce((count, item) => count + item.quantity, 0);
}

/**
 * 格式化价格（保留两位小数）
 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

/**
 * 保存购物车到本地存储
 */
export function saveCartToLocalStorage(
  storeSlug: string,
  tableId: string,
  cartItems: CartItem[],
): void {
  try {
    const key = `qilin_cart_${storeSlug}_${tableId}`;
    localStorage.setItem(key, JSON.stringify(cartItems));
  } catch (error) {
    console.error('保存购物车到本地存储失败:', error);
  }
}

/**
 * 从本地存储加载购物车
 */
export function loadCartFromLocalStorage(
  storeSlug: string,
  tableId: string,
): CartItem[] {
  try {
    const key = `qilin_cart_${storeSlug}_${tableId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('从本地存储加载购物车失败:', error);
    return [];
  }
}

/**
 * 清空本地存储的购物车
 */
export function clearCartFromLocalStorage(
  storeSlug: string,
  tableId: string,
): void {
  try {
    const key = `qilin_cart_${storeSlug}_${tableId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清空本地存储购物车失败:', error);
  }
}