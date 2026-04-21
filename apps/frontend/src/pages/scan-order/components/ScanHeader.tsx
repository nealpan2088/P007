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
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：返回按钮和店铺信息 */}
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="返回"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-800 line-clamp-1">
                {storeName}
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>餐桌 {tableCode}</span>
              </div>
            </div>
          </div>

          {/* 右侧：购物车按钮 */}
          <button
            onClick={onCartClick}
            className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors"
            aria-label="查看购物车"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>

            {/* 购物车数量徽章 */}
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* 营业状态提示 */}
        <div className="mt-2 flex items-center text-sm">
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>营业中</span>
          </div>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-gray-500">欢迎扫码点餐</span>
        </div>
      </div>
    </header>
  );
};

export default ScanHeader;