import React from 'react';

interface ScanHeaderProps {
  storeName: string;
  storeDescription?: string;
  storeAddress?: string;
  tableCode: string;
  cartItemCount: number;
  onCartClick: () => void;
  onBack?: () => void;
}

// 美团风格暖色渐变
const BANNER_GRADIENT = 'linear-gradient(135deg, #ff6b35 0%, #f7c948 100%)';

const ScanHeader: React.FC<ScanHeaderProps> = ({
  storeName,
  storeDescription,
  storeAddress,
  tableCode,
  cartItemCount,
  onCartClick,
  onBack,
}) => {
  return (
    <div style={{ position: 'relative', marginBottom: 0 }}>
      {/* 封面图区 — 暖色渐变 */}
      <div
        style={{
          position: 'relative',
          height: 160,
          background: BANNER_GRADIENT,
          overflow: 'hidden',
        }}
      >
        {/* 装饰圆 */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />

        {/* 顶部操作栏 */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}>
          {onBack ? (
            <button onClick={onBack} style={{
              width: 30, height: 30,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} aria-label="返回">
              <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : <div />}
          <button onClick={onCartClick} style={{
            position: 'relative',
            width: 30, height: 30,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }} aria-label="购物车">
            <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 15,
                height: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ff4757',
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                borderRadius: '50%',
                padding: '0 3px',
              }}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* 店铺信息 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: '36px 16px 14px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.25))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 48, height: 48,
              borderRadius: 10,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}>
              🏪
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'white',
                margin: 0,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{storeName}</h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                {storeAddress && <span>📍 {storeAddress}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 桌号 + 营业状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'white',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#ff6b35', fontWeight: 600 }}>🏠 {tableCode}号桌</span>
          <span style={{ fontSize: 11, color: '#52c41a', background: '#f6ffed', padding: '2px 8px', borderRadius: 10 }}>
            营业中
          </span>
        </div>
        {storeDescription && (
          <span style={{ fontSize: 11, color: '#999', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storeDescription}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScanHeader;
