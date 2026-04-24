#!/usr/bin/env python3
"""Resolve merge conflicts in MenuSection.tsx - keep HEAD (dev branch, horizontal tabs)"""
import re, sys

files_to_fix = {
    'apps/frontend/src/pages/scan-order/components/MenuSection.tsx': [
        # Conflict block 1: parent div + left navigation section
        ("""<<<<<<< HEAD
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* 顶部横向分类标签 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
=======
    <div className="flex h-[calc(100vh-48px)]">
      {/* 左侧分类导航 */}
      <div ref={sidebarRef} className="w-20 shrink-0 bg-white overflow-y-auto scrollbar-hide pt-1 border-r border-gray-100">
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
>>>>>>> bug/fix-code-bug-v0.2.6""",
         """    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* 顶部横向分类标签 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">"""),

        # Conflict block 2: button section (all vs category buttons)
        ("""<<<<<<< HEAD
          <button
            onClick={() => onSelectCategory('')}
            className={`
              shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
              ${!selectedCategory
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            全部 {totalItems}
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                ${selectedCategory === category.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span>{getCategoryIcon(category.name)}</span>
              <span>{category.name}</span>
              <span className="text-[10px] opacity-70">({category.items.length})</span>
            </button>
          ))}
        </div>
        {/* 当前分类名（仅筛选时显示） */}
        {selectedCategory && (
          <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-50">
            {currentCatName} · {filteredCategories[0]?.items.length || 0} 道菜
          </div>
        )}
=======
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
>>>>>>> bug/fix-code-bug-v0.2.6""",
         """          <button
            onClick={() => onSelectCategory('')}
            className={`
              shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
              ${!selectedCategory
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            全部 {totalItems}
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                ${selectedCategory === category.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span>{getCategoryIcon(category.name)}</span>
              <span>{category.name}</span>
              <span className="text-[10px] opacity-70">({category.items.length})</span>
            </button>
          ))}
        </div>
        {/* 当前分类名（仅筛选时显示） */}
        {selectedCategory && (
          <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-50">
            {currentCatName} · {filteredCategories[0]?.items.length || 0} 道菜
          </div>
        )}"""),
    ],
    'apps/frontend/src/pages/scan-order/components/ItemDetailModal.tsx': [
        ("""<<<<<<< HEAD
          <div className="relative h-52 bg-gray-100 shrink-0">
            {!imgError ? (
              <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" 
                onError={() => setImgError(true)}
              />
=======
          <div className={`relative h-52 shrink-0 bg-gradient-to-br ${getGradientClass(item.name)}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
>>>>>>> bug/fix-code-bug-v0.2.6""",
         """          <div className="relative h-52 bg-gray-100 shrink-0">
            {!imgError ? (
              <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" 
                onError={() => setImgError(true)}
              />"""),
    ],
}

for filepath, replacements in files_to_fix.items():
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"Fixed conflict in {filepath}")
        else:
            print(f"WARNING: Conflict block not found in {filepath}", file=sys.stderr)
    
    with open(filepath, 'w') as f:
        f.write(content)

# Verify no merge markers remain
import subprocess
r = subprocess.run(['grep', '-rn', '<<<<<<<\\|=======\\|>>>>>>>', 'apps/frontend/src/pages/scan-order/components/', '--include=*.tsx'], capture_output=True, text=True)
if r.stdout:
    print(f"WARNING: Remaining conflicts: {r.stdout}", file=sys.stderr)
    sys.exit(1)
else:
    print("All conflicts resolved, no markers remaining!")
