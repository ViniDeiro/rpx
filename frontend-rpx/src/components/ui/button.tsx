'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'link' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '',
    variant = 'default',
    size = 'md',
    asChild = false,
    loading = false,
    disabled,
    children,
    ...props
  }, ref) => {
    
    // Classes para variantes
    const variantClasses = {
      default: 'bg-primary hover:bg-primary-dark text-white shadow-sm',
      outline: 'border border-border hover:bg-card-hover',
      secondary: 'bg-secondary hover:bg-secondary-dark text-white shadow-sm',
      destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
      link: 'text-primary hover:underline',
      ghost: 'hover:bg-card-hover'
    };
    
    // Classes para tamanhos
    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 rounded-md',
      md: 'text-sm px-4 py-2 rounded-md',
      lg: 'text-base px-6 py-3 rounded-lg'
    };
    
    // Classes base e condicionais
    const buttonClasses = `
      font-medium transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-primary/30
      disabled:opacity-50 disabled:pointer-events-none
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `;
    
    // Se for para renderizar como filho
    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: buttonClasses,
        ref,
        disabled: disabled || loading,
        ...props
      });
    }
    
    return (
      <button
        className={buttonClasses}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            <span>{children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
); 