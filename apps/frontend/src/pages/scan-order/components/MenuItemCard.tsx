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

  return (
    <div
      className="flex bg-white mb-2.5 rounded-xl overflow-hidden cursor-pointer active:bg-gray-50 shadow-sm border border-gray-50"
      onClick={() => onViewDetails?.(item)}
    >
      {/* 左侧图片 */}
      <div className="w-[88px] h-[88px] shrink-0 relative">
        {item.imageUrl ? (
          <>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {item.isAvailable === false && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-gray-800 bg-opacity-70 px-2 py-0.5 rounded">已售罄</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 右侧信息 */}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h3>
            <span className="text-sm font-bold text-orange-600 shrink-0 whitespace-nowrap">¥{item.price.toFixed(2)}</span>
          </div>
          {item.description && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-end mt-1">
          <button
            onClick={handleAddToCart}
            disabled={item.isAvailable === false}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-orange-500 text-white text-base leading-none hover:bg-orange-600 active:scale-90 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
