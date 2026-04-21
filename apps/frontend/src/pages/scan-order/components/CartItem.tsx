import React from 'react';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const handleIncrease = () => {
    onUpdateQuantity(item.menuItemId, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.menuItemId, item.quantity - 1);
    } else {
      onRemove(item.menuItemId);
    }
  };

  const handleRemove = () => {
    onRemove(item.menuItemId);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* 菜品图片 */}
      <div className="flex-shrink-0 w-16 h-16 mr-4">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">无图</span>
          </div>
        )}
      </div>

      {/* 菜品信息 */}
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-gray-800">{item.name}</h4>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="删除"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex justify-between items-center">
          {/* 价格 */}
          <div className="text-orange-600 font-semibold">
            ¥{item.price.toFixed(2)}
          </div>

          {/* 数量控制 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDecrease}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="减少数量"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>

            <span className="w-8 text-center font-medium">{item.quantity}</span>

            <button
              onClick={handleIncrease}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="增加数量"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* 小计 */}
          <div className="text-gray-800 font-semibold">
            ¥{itemTotal.toFixed(2)}
          </div>
        </div>

        {/* 特殊要求 */}
        {item.specialRequest && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <span className="font-medium">备注：</span>
            {item.specialRequest}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;