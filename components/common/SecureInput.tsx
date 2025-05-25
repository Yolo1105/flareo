import React, { useState, useCallback } from 'react';
import { sanitizeHTML } from '@/lib/security';

interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  onValidation?: (isValid: boolean) => void;
  validateOnChange?: boolean;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  onChange,
  onValidation,
  validateOnChange = true,
  maxLength = 1000,
  pattern,
  errorMessage,
  className = '',
  ...props
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((inputValue: string) => {
    if (pattern) {
      const regex = new RegExp(pattern);
      return regex.test(inputValue);
    }
    return true;
  }, [pattern]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 限制长度
    if (inputValue.length > maxLength) {
      return;
    }

    // 清理输入
    const sanitizedValue = sanitizeHTML(inputValue);
    setValue(sanitizedValue);

    // 验证输入
    if (validateOnChange) {
      const valid = validate(sanitizedValue);
      setIsValid(valid);
      onValidation?.(valid);
    }

    // 触发 onChange
    onChange?.(sanitizedValue);
  }, [maxLength, onChange, onValidation, validate, validateOnChange]);

  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        pattern={pattern}
        className={`
          w-full px-3 py-2 border rounded-md
          ${!isValid ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${className}
        `}
        aria-invalid={!isValid}
        aria-describedby={!isValid ? `${props.id}-error` : undefined}
      />
      {!isValid && errorMessage && (
        <div
          id={`${props.id}-error`}
          className="text-red-500 text-sm mt-1"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}; 