import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScanHeader from './components/ScanHeader';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import ItemDetailModal from './components/ItemDetailModal';
import { useScanOrder } from './hooks/useScanOrder';
import { MenuItem } from './types';

const ScanOrderPage: React.FC = () => {
  // 同时支持新旧规范两种参数名
  const params = useParams<{
    storeSlug?: string;
    storeId?: string;
    tableId?: string;
  }>();

  const navigate = useNavigate();

  // 统一获取店铺标识符（支持新旧规范参数名）
  const storeIdentifier = params.storeSlug || params.storeId || '';
  const tableId = params.tableId || '';

  // 如果URL缺少店铺信息，显示错误
  if (!storeIdentifier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">参数错误</h2>
          <p className="text-gray-600">扫码点餐链接缺少店铺信息</p>
        </div>
      </div>
    );
  }

  // 没有桌号时默认为"A01"
  const effectiveTableId = tableId || 'A01';

  // 使用自定义Hook管理状态
  const {
    // 状态
    storeInfo,
    tableInfo,
    categories,
    selectedCategory,
    cartItems,
    isCartOpen,
    orderStatus,
    isLoading,
    error,
    cartTotal,
    cartItemCount,
    // 操作方法
    selectCategory,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    toggleCart,
    openCart,
    closeCart,
    submitOrder,
    reloadMenu,

    // 工具函数
    formatPrice,
  } = useScanOrder(storeIdentifier, effectiveTableId);

  // 菜品详情弹窗
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };

  // 处理查看菜品详情
  const handleViewDetails = (item: MenuItem) => {
    setDetailItem(item);
  };

  // 显示错误信息
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            加载失败
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={reloadMenu}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 如果正在加载订单状态，显示订单状态页面
  if (orderStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ScanHeader
          storeName={storeInfo?.name || '加载中...'}
          storeDescription={storeInfo?.description}
          storeAddress={storeInfo?.address}
          tableCode={tableInfo?.code || effectiveTableId}
          cartItemCount={cartItemCount}
          onCartClick={openCart}
          onBack={handleBack}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 text-green-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                订单提交成功！
              </h1>
              <p className="text-gray-600">
                订单号: {orderStatus.orderId}
              </p>
            </div>

            {/* 订单状态进度 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                订单状态
              </h2>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm ${orderStatus.status === 'PENDING' ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                  已提交
                </div>
                <div className={`text-sm ${orderStatus.status === 'CONFIRMED' ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                  已确认
                </div>
                <div className={`text-sm ${orderStatus.status === 'PREPARING' ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                  制作中
                </div>
                <div className={`text-sm ${orderStatus.status === 'READY' ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                  已完成
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{
                    width: orderStatus.status === 'PENDING' ? '25%' :
                      orderStatus.status === 'CONFIRMED' ? '50%' :
                        orderStatus.status === 'PREPARING' ? '75%' :
                          orderStatus.status === 'READY' ? '100%' : '0%',
                  }}
                />
              </div>
            </div>

            {/* 订单详情 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                订单详情
              </h2>
              <div className="space-y-3">
                {orderStatus.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-800">{item.name}</span>
                      <span className="text-gray-500 text-sm ml-2">×{item.quantity}</span>
                    </div>
                    <div className="text-gray-800">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">总计</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ¥{Number(orderStatus.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 特殊要求 */}
            {orderStatus.specialRequest && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  特殊要求
                </h2>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {orderStatus.specialRequest}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  // 清空订单状态，返回点餐页面
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                再来一单
              </button>
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主点餐页面
  return (
    <div className="min-h-screen bg-gray-50">

      {/* 店铺页头 */}
      <ScanHeader
        storeName={storeInfo?.name || '加载中...'}
        storeDescription={storeInfo?.description}
          storeAddress={storeInfo?.address}
        tableCode={tableInfo?.code || effectiveTableId}
        cartItemCount={cartItemCount}
        onCartClick={toggleCart}
        onBack={handleBack}
      />

      {/* 菜单区域 */}
      <MenuSection
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={selectCategory}
        onAddToCart={addToCart}
        onViewDetails={handleViewDetails}
        isLoading={isLoading}
      />

      {/* 购物车侧边栏 */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        totalAmount={cartTotal}
        itemCount={cartItemCount}
        onClose={closeCart}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        onSubmitOrder={submitOrder}
        formatPrice={formatPrice}
      />

      {/* 底部浮动购物车栏 */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              </div>
              <div>
                <div className="text-base font-bold text-gray-800">{formatPrice(cartTotal)}</div>
                <div className="text-[10px] text-gray-400">另需配送费 ¥0</div>
              </div>
            </div>
            <button
              onClick={openCart}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-full font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-200"
            >
              去结算
            </button>
          </div>
        </div>
      )}

      {/* 菜品详情弹窗 */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default ScanOrderPage;