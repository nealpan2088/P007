// 简单图形验证码组件
import React, { useRef, useCallback, useEffect, useState } from 'react';

interface ImageCaptchaProps {
  onChange: (valid: boolean) => void;
}

/**
 * 生成随机颜色
 */
function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 40);
  const l = 30 + Math.floor(Math.random() * 30);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * 生成验证码文本（4位数字）
 */
function generateCode(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * 图形验证码
 * 在 canvas 上绘制包含噪点/干扰线的数字，防止机器人
 */
const ImageCaptcha: React.FC<ImageCaptchaProps> = ({ onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, w, h);

    // 干扰线
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.strokeStyle = randomColor();
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 噪点
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = randomColor();
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 数字
    const chars = text.split('');
    const charWidth = w / chars.length;
    chars.forEach((char, i) => {
      const x = charWidth * i + charWidth / 2;
      const y = h / 2 + Math.random() * 8 - 4;
      ctx.font = `${20 + Math.random() * 6}px "Courier New", monospace`;
      ctx.fillStyle = randomColor();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, []);

  const refresh = useCallback(() => {
    const newCode = generateCode();
    setCode(newCode);
    setInput('');
    setError(false);
    onChange(false);
    // 等待 DOM 更新后绘制
    requestAnimationFrame(() => drawCaptcha(newCode));
  }, [drawCaptcha, onChange]);

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setInput(val);
    setError(false);

    if (val.length === 4) {
      const valid = val === code;
      setError(!valid);
      onChange(valid);
    } else {
      onChange(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <canvas
        ref={canvasRef}
        width={100}
        height={40}
        className={`rounded border ${error ? 'border-red-400' : 'border-gray-300'}`}
        style={{ cursor: 'pointer' }}
        onClick={refresh}
        title="点击刷新验证码"
      />
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="验证码"
        maxLength={4}
        autoComplete="off"
        className={`w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      <button
        type="button"
        onClick={refresh}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="刷新验证码"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default ImageCaptcha;
