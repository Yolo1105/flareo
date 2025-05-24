import React from 'react';
import { ButtonProps } from '@/types/button';

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  asChild = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus-visible:ring-blue-500",
    ghost: "hover:bg-gray-100 text-gray-700 focus-visible:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500"
  };
  
  const sizeStyles = {
    default: "h-10 py-2 px-4 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base"
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  if (asChild) {
    return (
      <span className={combinedClassName}>
        {children}
      </span>
    );
  }
  
  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export { Button };
