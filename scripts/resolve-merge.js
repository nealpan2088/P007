const fs = require('fs');
const path = require('path');

const files = {
  'apps/frontend/src/pages/scan-order/components/MenuSection.tsx': [
    {
      start: '<<<<<<< HEAD',
      end: '>>>>>>> bug/fix-code-bug-v0.2.6',
      replacement: `              shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
              \${!selectedCategory
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            \`
          >
            全部 {totalItems}
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={\`
                shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                \${selectedCategory === category.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              \`}
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
        )}`,
    },
  ],
  'apps/frontend/src/pages/scan-order/components/ItemDetailModal.tsx': [
    {
      start: '<<<<<<< HEAD',
      end: '>>>>>>> bug/fix-code-bug-v0.2.6',
      replacement: `          <div className="relative h-52 bg-gray-100 shrink-0">
            {!imgError ? (
              <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" 
                onError={() => setImgError(true)}
              />`,
    },
  ],
};

for (const [filepath, blocks] of Object.entries(files)) {
  const fullPath = path.resolve(filepath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  for (const { start, end, replacement } of blocks) {
    // Find the conflict block from start marker to end marker (inclusive)
    const startIdx = content.indexOf(start);
    if (startIdx === -1) {
      console.log(`WARNING: Start marker '${start}' not found in ${filepath}`);
      continue;
    }
    const endIdx = content.indexOf(end, startIdx);
    if (endIdx === -1) {
      console.log(`WARNING: End marker '${end}' not found in ${filepath}`);
      continue;
    }
    const blockLength = endIdx + end.length - startIdx;
    const conflictBlock = content.substring(startIdx, startIdx + blockLength);
    
    content = content.replace(conflictBlock, replacement);
    console.log(`Fixed conflict in ${filepath}`);
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  
  // Verify no markers remain
  if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
    console.log(`ERROR: Markers still remain in ${filepath}`);
    process.exit(1);
  }
}

console.log('All conflicts resolved successfully!');
