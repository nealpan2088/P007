import React, { useEffect } from 'react';
import { MenuItem } from '../types';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (menuItemId: string) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  // 禁止背景滚动
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item.id);
    onClose();
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity" onClick={onClose} />
      
      {/* 弹窗 - 底部弹出 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl overflow-hidden shadow-xl max-h-[80vh] flex flex-col">
          {/* 图片 */}
          <div className="relative h-52 bg-gray-100 shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 bg-black bg-opacity-40 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* 价格标签浮在图片上 */}
            <div className="absolute left-4 bottom-3">
              <span className="text-2xl font-bold text-white drop-shadow-lg">¥{item.price.toFixed(2)}</span>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-5 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h2>
            
            {item.description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.description}</p>
            )}

            {item.isAvailable === false && (
              <div className="mb-4 py-2 px-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-500 font-medium">已售罄</p>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-5 pb-5 pt-2 shrink-0">
            <button
              onClick={handleAdd}
              disabled={item.isAvailable === false}
              className="w-full py-3 rounded-xl font-semibold text-white text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
            >
              {item.isAvailable === false ? '已售罄' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetailModal;
