// 扫码点餐自定义Hook
import { useState, useEffect, useCallback } from 'react';
import { ScanOrderState } from '../types';
import * as apiUtils from '../utils/api.utils';
import * as cartUtils from '../utils/cart.utils';

export function useScanOrder(storeSlug: string, tableId: string, mode: string = 'dine-in') {
  // 初始状态
  const initialState: ScanOrderState = {
    storeSlug,
    tableId,
    storeInfo: null,
    tableInfo: null,
    categories: [],
    selectedCategory: null,
    cartItems: [],
    isCartOpen: false,
    orderStatus: null,
    isLoading: true,
    error: null,
  };

  const [state, setState] = useState<ScanOrderState>(initialState);

  // 加载初始数据
  useEffect(() => {
    loadInitialData();
  }, [storeSlug, tableId]);

  // 加载购物车数据
  useEffect(() => {
    if (storeSlug && tableId) {
      const savedCart = cartUtils.loadCartFromLocalStorage(storeSlug, tableId);
      setState(prev => ({
        ...prev,
        cartItems: savedCart,
      }));
    }
  }, [storeSlug, tableId]);

  // 保存购物车到本地存储
  useEffect(() => {
    if (storeSlug && tableId && state.cartItems.length > 0) {
      cartUtils.saveCartToLocalStorage(storeSlug, tableId, state.cartItems);
    }
  }, [state.cartItems, storeSlug, tableId]);

  // 加载初始数据函数
  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 并行加载数据
      const isTakeaway = mode === 'takeaway';
      const [storeInfo, categories] = await Promise.all([
        apiUtils.fetchStoreInfo(storeSlug),
        apiUtils.fetchStoreMenu(storeSlug),
      ]);

      // 打包模式不加载餐桌信息
      let tableInfo = null;
      if (!isTakeaway) {
        tableInfo = await apiUtils.fetchTableInfo(storeSlug, tableId);
      }

      // 过滤掉没有菜品的空分类
      const nonEmptyCategories = categories.filter(cat => (cat.itemCount ?? cat.items.length) > 0);

      setState(prev => ({
        ...prev,
        storeInfo,
        tableInfo,
        categories: nonEmptyCategories,
        selectedCategory: null, // 默认显示"全部"，不选中任何分类
        isLoading: false,
      }));
    } catch (error) {
      console.error('加载初始数据失败:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载数据失败',
      }));
    }
  };

  // 选择分类
  const selectCategory = useCallback((categoryId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCategory: categoryId,
    }));
  }, []);

  // 添加到购物车
  const addToCart = useCallback((menuItemId: string, quantity: number = 1) => {
    const menuItem = findMenuItem(menuItemId);
    if (!menuItem) {
      return;
    }

    const updatedCart = cartUtils.addItemToCart(state.cartItems, menuItem, quantity);
    
    setState(prev => ({
      ...prev,
      cartItems: updatedCart,
    }));
  }, [state.cartItems, state.categories]);

  // 更新购物车项数量
  const updateCartItemQuantity = useCallback((menuItemId: string, quantity: number) => {
    const updatedCart = cartUtils.updateCartItemQuantity(
      state.cartItems,
      menuItemId,
      quantity,
    );
    
    setState(prev => ({
      ...prev,
      cartItems: updatedCart,
    }));
  }, [state.cartItems]);

  // 从购物车移除项
  const removeFromCart = useCallback((menuItemId: string) => {
    const updatedCart = cartUtils.removeItemFromCart(state.cartItems, menuItemId);
    
    setState(prev => ({
      ...prev,
      cartItems: updatedCart,
    }));
  }, [state.cartItems]);

  // 清空购物车
  const clearCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      cartItems: [],
    }));
    cartUtils.clearCartFromLocalStorage(storeSlug, tableId);
  }, [storeSlug, tableId]);

  // 切换购物车显示状态
  const toggleCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCartOpen: !prev.isCartOpen,
    }));
  }, []);

  // 打开购物车
  const openCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCartOpen: true,
    }));
  }, []);

  // 关闭购物车
  const closeCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCartOpen: false,
    }));
  }, []);

  // 提交订单
  const submitOrder = useCallback(async (params?: { specialRequest?: string; phone?: string }): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 准备订单数据 - 使用后端驼峰命名
      const isTakeaway = mode === 'takeaway';
      const orderType = isTakeaway ? 'TAKEAWAY' : 'DINE_IN';
      const orderData: any = {
        storeId: state.storeInfo?.id || storeSlug,
        tableId: isTakeaway ? undefined : (state.tableInfo?.id || tableId),
        orderType,
        items: state.cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        customerNotes: params?.specialRequest,
        customerPhone: params?.phone,
      };

      // 提交订单
      const result = await apiUtils.submitOrder(orderData);

      // 清空购物车
      clearCart();

      // 获取订单状态（用 order_number）
      const orderStatus = await apiUtils.fetchOrderStatus(result.order_number);

      setState(prev => ({
        ...prev,
        orderStatus,
        verificationCode: result.verification_code,
        isCartOpen: false,
        isLoading: false,
      }));

      // 返回订单ID（如果需要）
      // return result.orderId;
    } catch (error) {
      // 429限频不打印错误日志（前端已做友好提示）
      const err = error as any;
      if (err.code !== 429) {
        console.error('提交订单失败:', error);
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '提交订单失败',
      }));
      throw error;
    }
  }, [storeSlug, tableId, state.cartItems, clearCart]);

  // 刷新订单状态
  const refreshOrderStatus = useCallback(async (orderId: string) => {
    try {
      const orderStatus = await apiUtils.fetchOrderStatus(orderId);
      setState(prev => ({
        ...prev,
        orderStatus,
      }));
      return orderStatus;
    } catch (error) {
      console.error('刷新订单状态失败:', error);
      throw error;
    }
  }, []);

  // 重新加载菜单
  const reloadMenu = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const categories = await apiUtils.fetchStoreMenu(storeSlug);
      setState(prev => ({
        ...prev,
        categories,
        isLoading: false,
      }));
    } catch (error) {
      console.error('重新加载菜单失败:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '重新加载菜单失败',
      }));
    }
  }, [storeSlug]);

  // 辅助函数：查找菜品
  const findMenuItem = (menuItemId: string) => {
    for (const category of state.categories) {
      const menuItem = category.items.find(item => item.id === menuItemId);
      if (menuItem) {
        return menuItem;
      }
    }
    return null;
  };

  // 计算购物车总金额
  const cartTotal = cartUtils.calculateCartTotal(state.cartItems);
  
  // 计算购物车总数量
  const cartItemCount = cartUtils.calculateCartItemCount(state.cartItems);

  // 获取当前选中的分类
  const currentCategory = state.categories.find(
    cat => cat.id === state.selectedCategory,
  );

  // 计算当前显示的分类列表（全部 or 选中）
  const filteredCategories = state.selectedCategory
    ? state.categories.filter(cat => cat.id === state.selectedCategory)
    : state.categories;

  return {
    // 状态
    ...state,
    cartTotal,
    cartItemCount,
    currentCategory,
    filteredCategories,
    
    // 操作方法
    selectCategory,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    submitOrder,
    refreshOrderStatus,
    reloadMenu,
    
    // 工具函数
    formatPrice: cartUtils.formatPrice,
  };
}