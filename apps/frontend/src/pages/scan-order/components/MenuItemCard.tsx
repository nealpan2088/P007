import React from 'react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (itemId: string) => void;
  onViewDetails?: (item: MenuItem) => void;
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
  '口水鸡': '🐔', '白切鸡': '🐔',
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
  '麒麟红烧肉': 'from-red-400 to-red-600',
  '红烧肉': 'from-red-400 to-red-600',
  '清蒸鲈鱼': 'from-blue-300 to-blue-500',
  '鲈鱼': 'from-blue-300 to-blue-500',
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
  '啤酒': 'from-yellow-200 to-yellow-400',
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

function getFoodGradient(name: string): string {
  for (const [key, grad] of Object.entries(foodGradientMap)) {
    if (name.includes(key)) return grad;
  }
  return 'from-orange-200 to-orange-400';
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
          <div className={`w-full h-full bg-gradient-to-br ${getFoodGradient(item.name)} flex items-center justify-center`}>
            <span className="text-2xl">{getFoodEmoji(item.name)}</span>
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
