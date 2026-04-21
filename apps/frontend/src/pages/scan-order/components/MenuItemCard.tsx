import React from 'react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (itemId: string) => void;
  onViewDetails?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  onViewDetails,
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item.id);
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* 菜品图片 */}
      <div className="relative h-48 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">暂无图片</span>
          </div>
        )}
        
        {/* 可用性标签 */}
        {!item.isAvailable && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            已售罄
          </div>
        )}
      </div>

      {/* 菜品信息 */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
            {item.name}
          </h3>
          <span className="text-lg font-bold text-orange-600">
            ¥{item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors duration-200
              ${item.isAvailable
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {item.isAvailable ? '加入购物车' : '已售罄'}
          </button>

          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(item);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              查看详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;