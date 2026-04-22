import React from 'react';

interface ScanHeaderProps {
  storeName: string;
  tableCode: string;
  cartItemCount: number;
  onCartClick: () => void;
  onBack?: () => void;
}

const ScanHeader: React.FC<ScanHeaderProps> = ({
  storeName,
  tableCode,
  cartItemCount,
  onCartClick,
  onBack,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-12">
        {/* 左侧 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button onClick={onBack} className="shrink-0" aria-label="返回">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">{storeName}</h1>
            <p className="text-[10px] text-orange-100">桌号 {tableCode}</p>
          </div>
        </div>

        {/* 右侧购物车 */}
        <button onClick={onCartClick} className="relative p-1.5 shrink-0" aria-label="购物车">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-white text-orange-600 text-[10px] font-bold rounded-full px-1 shadow">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default ScanHeader;
