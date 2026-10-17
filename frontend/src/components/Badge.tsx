import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
    neutral: { bg: 'bg-slate-100', text: 'text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
    danger: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
    info: { bg: 'bg-sky-50', text: 'text-sky-700 border-sky-200', dotColor: 'bg-sky-500' },
    primary: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dotColor: 'bg-blue-600' },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${style.bg} ${style.text} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />}
      {children}
    </span>
  );
};
