import React, { useState } from 'react';

interface ContactInfoSectionProps {
  specialRequest: string;
  phone: string;
  onSpecialRequestChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  specialRequest,
  phone,
  onSpecialRequestChange,
  onPhoneChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3">
      {/* 折叠按钮 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          填写备注信息
          {!expanded && (phone || specialRequest) && (
            <span className="text-green-500 text-xs ml-1">已填写</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 伸缩内容区 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {/* 特殊要求 */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            特殊要求（可选）
          </label>
          <textarea
            value={specialRequest}
            onChange={(e) => onSpecialRequestChange(e.target.value)}
            placeholder="例如：不要辣、少盐、打包等"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
            rows={2}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-400 mt-0.5">
            {specialRequest.length}/200
          </div>
        </div>

        {/* 手机号 */}
        <div className="mb-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            手机号 <span className="text-gray-400 font-normal">（方便取餐联系，选填）</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="请输入手机号"
            maxLength={11}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;
