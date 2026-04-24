import React, { useState } from 'react';
import { CartItem as CartItemType } from '../types';
import CartItemComponent from './CartItem';
import DigitVerify from './DigitVerify';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItemType[];
  totalAmount: number;
  itemCount: number;
  onClose: () => void;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onSubmitOrder: (data: { specialRequest?: string; phone?: string }) => Promise<void>;
  formatPrice: (price: number) => string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  totalAmount,
  itemCount,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  formatPrice,
}) => {
  const [specialRequest, setSpecialRequest] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);

  const handleSubmitOrder = () => {
    if (items.length === 0) {
      setError('购物车为空，请先添加菜品');
      return;
    }
    // 先弹验证码
    setShowVerify(true);
  };

  const handleVerifiedSubmit = async () => {
    setShowVerify(false);
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitOrder({
        specialRequest: specialRequest.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSpecialRequest('');
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交订单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCancel = () => {
    setShowVerify(false);
    setError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* 购物车侧边栏 */}
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">购物车</h2>
            <p className="text-sm text-gray-500">
              共 {itemCount} 件商品
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭购物车"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 购物车内容 */}
        <div className="flex-grow overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-24 h-24 mb-4 text-gray-300">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                购物车空空如也
              </h3>
              <p className="text-gray-500 mb-6">
                快去添加喜欢的菜品吧
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                继续点餐
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemComponent
                  key={item.menuItemId}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部结算区域 */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            {/* 特殊要求输入 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特殊要求（可选）
              </label>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="例如：不要辣、少盐、打包等"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={2}
                maxLength={200}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {specialRequest.length}/200
              </div>
            </div>

            {/* 手机号输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-gray-400 font-normal">（方便取餐联系，选填）</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 总计 */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-800">总计</span>
              <div>
                <span className="text-2xl font-bold text-orange-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className={`
                w-full py-3 rounded-lg font-semibold text-lg transition-colors
                ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
          }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  提交中...
                </span>
              ) : (
                `提交订单 (${formatPrice(totalAmount)})`
              )}
            </button>

            {/* 提示信息 */}
            <p className="text-xs text-gray-500 text-center mt-3">
              提交订单后，后厨将开始制作您的菜品
            </p>
          </div>
        )}

        {/* 数字验证码弹窗 */}
        <DigitVerify
          isOpen={showVerify}
          onVerify={handleVerifiedSubmit}
          onCancel={handleVerifyCancel}
        />
      </div>
    </>
  );
};

export default CartDrawer;