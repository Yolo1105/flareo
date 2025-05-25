import React, { useState, useCallback } from 'react';
import { sanitizeFormData, validateInput, handleError } from '@/lib/security';

interface SecureFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onChange'> {
  onSubmit: (data: FormData) => Promise<void>;
  validateOnChange?: boolean;
  children: React.ReactNode;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  validateOnChange = true,
  children,
  ...props
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'email':
        if (!validateInput.email(value)) {
          error = '请输入有效的邮箱地址';
        }
        break;
      case 'password':
        if (value.length < 8) {
          error = '密码长度至少需要8个字符';
        }
        break;
      case 'phone':
        if (!validateInput.phone(value)) {
          error = '请输入有效的电话号码';
        }
        break;
      case 'url':
        if (!validateInput.url(value)) {
          error = '请输入有效的URL';
        }
        break;
      default:
        if (value.trim() === '') {
          error = '此字段不能为空';
        }
    }

    return error;
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (validateOnChange) {
      const { name, value } = e.target;
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateOnChange, validateField]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // 验证所有字段
      const newErrors: Record<string, string> = {};
      for (const [name, value] of formData.entries()) {
        if (typeof value === 'string') {
          const error = validateField(name, value);
          if (error) {
            newErrors[name] = error;
          }
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // 清理表单数据
      const sanitizedData = sanitizeFormData(formData);
      
      // 提交表单
      await onSubmit(sanitizedData);
      
      // 重置表单和错误状态
      form.reset();
      setErrors({});
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      {...props}
      onSubmit={handleSubmit}
      noValidate
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const name = child.props.name;
          const isInputLike = ['input', 'textarea', 'select'].includes(child.type as string);
          return React.cloneElement(child, {
            ...child.props,
            'aria-invalid': errors[name] ? 'true' : 'false',
            'aria-describedby': errors[name] ? `${name}-error` : undefined,
            ...(isInputLike ? { onChange: handleChange } : {}),
          });
        }
        return child;
      })}
      
      {Object.entries(errors).map(([name, error]) => (
        <div
          key={name}
          id={`${name}-error`}
          className="text-red-500 text-sm mt-1"
          role="alert"
        >
          {error}
        </div>
      ))}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  );
}; 