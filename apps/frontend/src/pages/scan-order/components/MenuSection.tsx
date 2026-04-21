import React from 'react';
import { MenuCategory, MenuItem } from '../types';
import MenuItemCard from './MenuItemCard';

interface MenuSectionProps {
  categories: MenuCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddToCart: (menuItemId: string) => void;
  onViewDetails?: (item: MenuItem) => void;
  isLoading?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onViewDetails,
  isLoading = false,
}) => {
  // 获取当前选中的分类
  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        {/* 分类标签骨架屏 */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>

        {/* 菜品网格骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          暂无菜品
        </h3>
        <p className="text-gray-500">
          该店铺暂时没有可点的菜品
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 分类标签 */}
      <div className="sticky top-16 z-20 bg-white pb-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-colors duration-200
                ${selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category.name}
              {category.items.length > 0 && (
                <span className="ml-2 text-xs opacity-80">
                  ({category.items.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 当前分类信息 */}
      {currentCategory && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentCategory.name}
          </h2>
          {currentCategory.description && (
            <p className="text-gray-600">
              {currentCategory.description}
            </p>
          )}
        </div>
      )}

      {/* 菜品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCategory?.items.map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* 空状态提示 */}
      {currentCategory && currentCategory.items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            该分类暂无菜品
          </h3>
          <p className="text-gray-500">
            请选择其他分类或稍后再来
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuSection;