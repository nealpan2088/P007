import React, { useEffect } from 'react';
import { MenuItem } from '../types';
import { getFoodImageUrl } from '../../../utils/image.utils';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (menuItemId: string) => void;
}

// 菜品名称 → 美食emoji映射
const foodEmojiMap: Record<string, string> = {
  '麒麟红烧肉': '🥩', '红烧肉': '🥩', '红烧': '🥩',
  '清蒸鲈鱼': '🐟', '鲈鱼': '🐟', '鱼': '🐟',
  '宫保鸡丁': '🍗', '鸡丁': '🍗', '鸡': '🍗',
  '鱼香肉丝': '🥓', '肉丝': '🥓', '回锅肉': '🥓',
  '麻婆豆腐': '🫘', '豆腐': '🫘',
  '糖醋排骨': '🍖', '排骨': '🍖',
  '干煸四季豆': '🫛', '四季豆': '🫛',
  '凉拌黄瓜': '🥒', '黄瓜': '🥒',
  '口水鸡': '🐔',
  '皮蛋豆腐': '🥚', '皮蛋': '🥚',
  '米饭': '🍚', '蛋炒饭': '🍚', '炒饭': '🍚',
  '手工面条': '🍜', '面条': '🍜', '面': '🍜',
  '可乐': '🥤', '橙汁': '🧃', '啤酒': '🍺', '青岛啤酒': '🍺',
  '茶': '🍵', '清茶': '🍵',
  '紫菜蛋花汤': '🥣', '蛋花汤': '🥣',
  '番茄蛋汤': '🍅', '酸辣汤': '🌶️',
};

// 菜品名称 → 渐变背景色
const foodGradientMap: Record<string, string> = {
  '红烧肉': 'from-red-400 to-red-600',
  '清蒸鲈鱼': 'from-blue-300 to-blue-500',
  '宫保鸡丁': 'from-orange-300 to-red-500',
  '鱼香肉丝': 'from-rose-300 to-rose-500',
  '麻婆豆腐': 'from-red-300 to-orange-500',
  '糖醋排骨': 'from-amber-300 to-amber-600',
  '干煸四季豆': 'from-green-300 to-green-500',
  '凉拌黄瓜': 'from-lime-300 to-green-400',
  '口水鸡': 'from-yellow-300 to-orange-500',
  '皮蛋豆腐': 'from-gray-200 to-gray-400',
  '米饭': 'from-white to-gray-200',
  '蛋炒饭': 'from-yellow-200 to-yellow-500',
  '手工面条': 'from-yellow-300 to-amber-500',
  '可乐': 'from-red-400 to-red-600',
  '橙汁': 'from-orange-200 to-orange-400',
  '青岛啤酒': 'from-yellow-200 to-yellow-400',
  '茶': 'from-green-200 to-green-400',
  '紫菜蛋花汤': 'from-purple-200 to-purple-400',
  '番茄蛋汤': 'from-red-200 to-red-400',
  '酸辣汤': 'from-orange-200 to-red-400',
};

function getFoodEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(foodEmojiMap)) {
    if (name.includes(key)) return emoji;
  }
  return '🍽️';
}

function getGradientClass(name: string): string {
  for (const [key, grad] of Object.entries(foodGradientMap)) {
    if (name.includes(key)) return grad;
  }
  return 'from-orange-200 to-orange-400';
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
          <div className={`relative h-64 shrink-0 bg-gradient-to-br ${getGradientClass(item.name)} flex items-center justify-center overflow-hidden`}>
            <img
              src={getFoodImageUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={e => { 
                const img = e.target as HTMLImageElement;
                img.style.objectFit = 'contain';
                img.style.padding = '30px';
                img.src = getFoodImageUrl(''); 
              }}
            />
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
          <div className="p-5 overflow-y-auto flex-1 min-h-0">
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
