// 扫码点餐页面类型定义

// 菜品项
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 菜单分类
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  items: MenuItem[];
}

// 购物车项
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  specialRequest?: string;
}

// 订单状态
export interface OrderStatus {
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  estimatedTime?: number; // 预计完成时间（分钟）
  createdAt: string;
  updatedAt: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  specialRequest?: string;
}

// 店铺信息
export interface StoreInfo {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  themeColor?: string;
  address?: string;
  phone?: string;
  businessHours?: {
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  };
}

// 餐桌信息
export interface TableInfo {
  id: string;
  name: string;
  code: string; // 餐桌编码，如 A01
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

// 页面状态
export interface ScanOrderState {
  storeSlug: string;
  tableId: string;
  storeInfo: StoreInfo | null;
  tableInfo: TableInfo | null;
  categories: MenuCategory[];
  selectedCategory: string | null;
  cartItems: CartItem[];
  isCartOpen: boolean;
  orderStatus: OrderStatus | null;
  isLoading: boolean;
  error: string | null;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: any;
  };
}

// 提交订单请求
export interface SubmitOrderRequest {
  store_id: string;
  table_code: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
  }>;
  notes?: string;
  customer_phone?: string;
}