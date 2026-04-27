import React, { useRef, useEffect } from 'react';
import { MenuCategory, MenuItem } from '../types';
import MenuItemCard from './MenuItemCard';

interface MenuSectionProps {
  categories: MenuCategory[];
  filteredCategories: MenuCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onAddToCart: (menuItemId: string) => void;
  onViewDetails?: (item: MenuItem) => void;
  isLoading?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  filteredCategories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onViewDetails,
  isLoading = false,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  // 选中分类时自动滚动到可见区域
  useEffect(() => {
    if (sidebarRef.current && selectedCategory) {
      const btn = sidebarRef.current.querySelector(`[data-cat-id="${selectedCategory}"]`);
      if (btn) {
        btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0">
        <div className="w-20 shrink-0 bg-gray-50 p-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex mb-2.5 bg-white rounded-xl overflow-hidden">
              <div className="w-[88px] h-[88px] bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 p-2.5">
                <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">暂无菜品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* 左侧分类导航 */}
      <div ref={sidebarRef} className="w-20 shrink-0 bg-white overflow-y-auto scrollbar-hide pt-1 border-r border-gray-100">
        {/* "全部"按钮 - 默认选中 */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`
            w-full py-2.5 px-1 text-center border-l-[3px] transition-all duration-200
            ${!selectedCategory
              ? 'bg-orange-50 text-orange-600 border-orange-500 font-bold'
              : 'text-gray-700 border-transparent hover:bg-orange-50'
            }
          `}
        >
          <div className="text-lg mb-0.5">🍽️</div>
          <div className="text-[11px] leading-tight font-medium">全部</div>
        </button>
        {categories.map((category, idx) => {
          // 分类图标映射
          const iconMap: Record<string, string> = {
            '招牌菜': '⭐',
            '热菜': '🔥',
            '凉菜': '🥗',
            '主食': '🍚',
            '饮品': '🥤',
            '汤品': '🍲',
            '甜品': '🍰',
            '小吃': '🍟',
            '早餐': '🌅',
            '午餐': '☀️',
            '晚餐': '🌙',
          };
          const name = category.name;
          const icon = iconMap[name] || '🍽️';
          return (
          <button
            key={category.id}
            data-cat-id={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`
              w-full py-2.5 px-1 text-center border-l-[3px] transition-all duration-200
              ${selectedCategory === category.id
                ? 'bg-orange-50 text-orange-600 border-orange-500 font-bold'
                : 'text-gray-700 border-transparent hover:bg-orange-50'
              }
            `}
          >
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="text-[11px] leading-tight font-medium">
              {name.slice(0, 4)}
            </div>
          </button>
          );
        })}
      </div>

      {/* 右侧菜品列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50" id="menu-items-scroll">
        <div className="px-3 py-3">
          {/* 分类标题 */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-bold text-gray-700">
              {filteredCategories.length === 1
                ? filteredCategories[0].name
                : '全部菜单'
              }
            </h2>
            <span className="text-[11px] text-gray-400">
              {filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)}道菜
            </span>
          </div>

          {/* 菜品列表 - 遍历所有显示的分类 */}
          {filteredCategories.map(category => (
            <div key={category.id}>
              {/* 多分类时显示分类名 */}
              {filteredCategories.length > 1 && (
                <div className="text-xs font-medium text-gray-500 mt-3 mb-1.5 px-1">
                  {category.name} <span className="text-gray-300">({category.items.length}道)</span>
                </div>
              )}
              {category.items.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          ))}

          {/* 空状态 */}
          {filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0) === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">暂无菜品</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuSection;
