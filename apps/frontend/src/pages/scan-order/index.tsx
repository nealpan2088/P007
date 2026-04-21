import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScanHeader from './components/ScanHeader';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import { useScanOrder } from './hooks/useScanOrder';

const ScanOrderPage: React.FC = () => {
  // 从URL参数获取店铺ID和餐桌ID
  const { storeId = 'test-store', tableId = 'A01' } = useParams<{
    storeId?: string;
    tableId?: string;
  }>();
  
  const navigate = useNavigate();
  
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
    currentCategory,
    
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
    formatPrice,
  } = useScanOrder(storeId, tableId);

  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };

  // 处理查看菜品详情
  const handleViewDetails = (item: any) => {
    // TODO: 实现菜品详情弹窗
    console.log('查看菜品详情:', item);
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
          tableCode={tableInfo?.code || tableId}
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
                           orderStatus.status === 'READY' ? '100%' : '0%'
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
                    ¥{orderStatus.totalAmount.toFixed(2)}
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
      {/* 顶部导航 */}
      <ScanHeader
        storeName={storeInfo?.name || '加载中...'}
        tableCode={tableInfo?.code || tableId}
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

      {/* 底部浮动购物车按钮（移动端） */}
      {cartItemCount > 0 && !isCartOpen && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-6 md:hidden z-30 px-6 py-3 bg-orange-500 text-white rounded-full shadow-lg flex items-center space-x-2 hover:bg-orange-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>购物车 ({cartItemCount})</span>
          <span className="font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}
    </div>
  );
};

export default ScanOrderPage;