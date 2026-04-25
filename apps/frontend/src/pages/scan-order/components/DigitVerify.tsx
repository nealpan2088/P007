import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DigitVerifyProps {
  isOpen: boolean;
  onVerify: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
}

/**
 * 数字点选验证码组件
 * 生成4位随机数字，用户需按正确顺序点击
 * 点错后重置并刷新数字，防止暴力尝试
 */
const DigitVerify: React.FC<DigitVerifyProps> = ({ isOpen, onVerify, onCancel, errorMessage }) => {
  const [codeDigits, setCodeDigits] = useState<number[]>([]);
  const [shuffledDigits, setShuffledDigits] = useState<number[]>([]);
  const [clickedIndexes, setClickedIndexes] = useState<number[]>([]);
  const [phase, setPhase] = useState<'show' | 'input' | 'success' | 'error'>('show');
  const [errorMsg, setErrorMsg] = useState('');
  const inputTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // 生成一组新的验证码
  const generateCode = useCallback(() => {
    const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    setCodeDigits(digits);
    // 打乱顺序
    setShuffledDigits([...digits].sort(() => Math.random() - 0.5));
    setClickedIndexes([]);
    setPhase('show');
    setErrorMsg('');
  }, []);

  // 打开时生成验证码
  useEffect(() => {
    if (isOpen) {
      generateCode();
    }
    return () => {
      if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
    };
  }, [isOpen, generateCode]);

  // 显示阶段：显示数字让用户记住
  const handleShowDone = () => {
    setPhase('input');
  };

  // 输入阶段：点击数字按钮
  const handleDigitClick = (digit: number) => {
    if (phase !== 'input') return;

    // 获取当前按钮在 shuffled 中的索引
    const btnIndex = shuffledDigits.indexOf(digit);
    // 找出这个 digit 在 shuffled 中的所有出现位置（可能重复）
    const allIndexes = shuffledDigits.reduce<number[]>((acc, d, i) => {
      if (d === digit && !clickedIndexes.includes(i)) acc.push(i);
      return acc;
    }, []);

    if (allIndexes.length === 0) return; // 所有实例都已点击

    const idx = allIndexes[0]; // 取第一个未点击的
    const expectedDigit = codeDigits[clickedIndexes.length];

    if (digit === expectedDigit) {
      // 正确
      const newClicked = [...clickedIndexes, idx];
      setClickedIndexes(newClicked);

      if (newClicked.length === 4) {
        // 全部正确
        setPhase('success');
        // 延迟500ms后回调
        setTimeout(() => {
          onVerify();
        }, 500);
      }
    } else {
      // 错误
      setPhase('error');
      setErrorMsg('顺序不对，请重新验证');
      inputTimeoutRef.current = setTimeout(() => {
        generateCode();
      }, 1500);
    }
  };

  // 关闭
  const handleCancel = () => {
    if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
    generateCode();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[320px] p-6 mx-4">
        {/* 标题 */}
        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">安全验证</h3>
        <p className="text-xs text-gray-500 text-center mb-2">
          请按顺序点击数字，防止恶意下单
        </p>

        {/* 后端限频错误提示 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
            <p className="text-orange-600 text-sm font-medium">{errorMessage}</p>
            <p className="text-gray-400 text-xs mt-1">请稍后再试</p>
          </div>
        )}

        {phase === 'show' && (
          <>
            {/* 显示数字（让用户记住） */}
            <div className="flex justify-center gap-3 mb-6">
              {codeDigits.map((digit, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-xl bg-orange-500 text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-orange-200"
                >
                  {digit}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">请记住以上数字的顺序</p>
            <button
              onClick={handleShowDone}
              className="w-full py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              记住了，开始输入
            </button>
          </>
        )}

        {phase === 'input' && (
          <>
            {/* 已点位数提示 */}
            <div className="flex justify-center gap-1 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < clickedIndexes.length
                      ? 'bg-orange-500 scale-110'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* 数字按钮（打乱顺序） */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {shuffledDigits.map((digit, i) => {
                const isUsed = clickedIndexes.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleDigitClick(digit)}
                    disabled={isUsed}
                    className={`
                      w-full aspect-square rounded-xl text-xl font-bold transition-all active:scale-95
                      ${isUsed
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                      }
                    `}
                  >
                    {isUsed ? '✓' : digit}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCancel}
              className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消点餐
            </button>
          </>
        )}

        {phase === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-500 font-medium text-sm">{errorMsg}</p>
            <p className="text-gray-400 text-xs mt-2">自动刷新验证码...</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium text-sm">验证通过，正在提交订单...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitVerify;
