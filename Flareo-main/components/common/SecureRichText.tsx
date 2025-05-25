import React, { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { sanitizeHTML } from '@/lib/security';

interface SecureRichTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
  className?: string;
}

export const SecureRichText: React.FC<SecureRichTextProps> = ({
  value,
  onChange,
  placeholder = '请输入内容...',
  maxLength = 5000,
  allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
  allowedAttributes = ['href', 'target', 'rel'],
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // 配置 DOMPurify
  const purifyConfig = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_URI_REGEXP: /^(https?|mailto|tel):/i,
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    
    // 检查长度
    if (content.length > maxLength) {
      return;
    }

    // 清理 HTML
    const sanitizedContent = DOMPurify.sanitize(content, purifyConfig);
    
    // 更新内容
    onChange(sanitizedContent);
  }, [maxLength, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // 获取纯文本
    const text = e.clipboardData.getData('text/plain');
    
    // 清理并插入文本
    const sanitizedText = sanitizeHTML(text);
    document.execCommand('insertText', false, sanitizedText);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 阻止特殊键组合
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (['c', 'v', 'x', 'a'].includes(key)) {
        return;
      }
      e.preventDefault();
    }
  }, []);

  return (
    <div className="relative">
      <div
        contentEditable
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value, purifyConfig) }}
        onInput={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          min-h-[100px] p-3 border rounded-md
          ${isFocused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
          focus:outline-none
          ${className}
        `}
        role="textbox"
        aria-multiline="true"
        aria-label="富文本编辑器"
      />
      {/* placeholder 展示 */}
      {!value && !isFocused && (
        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none select-none">
          {placeholder}
        </div>
      )}
      <div className="absolute bottom-2 right-2 text-sm text-gray-500">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}; 