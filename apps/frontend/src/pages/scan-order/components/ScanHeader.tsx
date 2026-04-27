import React from 'react';

interface ScanHeaderProps {
  storeName: string;
  storeDescription?: string;
  storeAddress?: string;
  tableCode: string;
  cartItemCount: number;
  onCartClick: () => void;
  onBack?: () => void;
  /** 店铺主题色，默认 #ff6b35（美团暖橙） */
  themeColor?: string;
  /** 店铺 Logo URL */
  logoUrl?: string;
  /** 装修模板: gradient | minimal */
  themeTemplate?: string;
  /** 店头背景图 URL */
  headerImageUrl?: string;
  /** 就餐模式: dine-in | takeaway */
  mode?: 'dine-in' | 'takeaway';
}

/**
 * 根据主题色生成淡雅渐变（比原色更浅、饱和度更低）
 */
function buildGradient(hex: string): string {
  // 把颜色混合白色，降低饱和度
  const light1 = mixWhite(hex, 20);
  const light2 = mixWhite(hex, 40);
  return `linear-gradient(135deg, ${light1} 0%, ${light2} 100%)`;
}

/**
 * 颜色混合白色，percent=0~100
 */
function mixWhite(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * percent / 100));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * percent / 100));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * percent / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * 简单颜色变暗
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const ScanHeader: React.FC<ScanHeaderProps> = ({
  storeName,
  storeDescription,
  storeAddress,
  tableCode,
  cartItemCount,
  onCartClick,
  onBack,
  themeColor = '#ff6b35',
  logoUrl,
  themeTemplate = 'gradient',
  headerImageUrl,
  mode = 'dine-in',
}) => {
  const isMinimal = themeTemplate === 'minimal';
  const bannerGradient = buildGradient(themeColor);
  const hasHeaderImage = !!headerImageUrl;

  let headerContent;
  if (isMinimal) {
    headerContent = (
      /* 极简白模板 */
      <div style={{
        position: 'relative',
        background: 'white',
        borderBottom: '1px solid #fef0e8',
      }}>
        {/* 顶部操作栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}>
          {onBack ? (
            <button onClick={onBack} style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: '#fff5f0',
              border: '1px solid #ffe8dc',
              color: '#ff8a4c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} aria-label="返回">
              <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : <div />}
          <button onClick={onCartClick} style={{
            position: 'relative',
            width: 36, height: 36,
            borderRadius: '50%',
            background: '#fff5f0',
            border: '1px solid #ffe8dc',
            color: '#ff8a4c',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }} aria-label="购物车">
            <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ff8a4c',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '50%',
                padding: '0 4px',
              }}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* 店铺信息 — 白色简洁风格 */}
        <div style={{ padding: '4px 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 12,
              background: '#fff5f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              flexShrink: 0,
              overflow: 'hidden',
              border: '1px solid #ffe8dc',
            }}>
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = '🏪'; }} />
              ) : (
                '🏪'
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#2d2d2d',
                margin: 0,
              }}>{storeName}</h1>
              {storeAddress && (
                <div style={{ fontSize: 12, color: '#c0a090', marginTop: 4 }}>📍 {storeAddress}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    headerContent = (
      /* 渐变模板（默认） */
      <div
        style={{
          position: 'relative',
          height: 160,
          background: hasHeaderImage ? `center/cover no-repeat url(${headerImageUrl})` : bannerGradient,
          overflow: 'hidden',
        }}
      >
        {/* 装饰圆 — 有背景图时不显示 */}
        {!hasHeaderImage && (<div style={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />)}
        {/* 装饰圆 2 — 有背景图时不显示 */}
        {!hasHeaderImage && (<div style={{
          position: 'absolute',
          bottom: -60,
          left: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />)}

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
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} aria-label="返回">
              <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : <div />}
          <button onClick={onCartClick} style={{
            position: 'relative',
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }} aria-label="购物车">
            <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ff4757',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '50%',
                padding: '0 4px',
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
              overflow: 'hidden',
            }}>
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = '🏪'; }} />
              ) : (
                '🏪'
              )}
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
    );
  }

  return (
    <div style={{ position: 'relative', marginBottom: 0 }}>
      {/* 封面图区 — 根据模板渲染 */}
      {headerContent}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'white',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'takeaway' ? (
            <span style={{ fontSize: 13, color: '#ff9a5c', fontWeight: 600 }}>📦 外卖/打包</span>
          ) : (
            <span style={{ fontSize: 13, color: '#ff9a5c', fontWeight: 600 }}>🏠 {tableCode}号桌</span>
          )}
          <span style={{ fontSize: 11, color: '#8bc7a0', background: '#f0faf4', padding: '2px 8px', borderRadius: 10 }}>
            营业中
          </span>
        </div>
        {storeDescription && (
          <span style={{ fontSize: 11, color: '#c0a090', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storeDescription}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScanHeader;
