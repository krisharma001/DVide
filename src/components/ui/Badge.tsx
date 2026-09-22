import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'glass';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  icon,
}) => {
  const variantStyles = {
    neutral: 'bg-white/[0.08] text-[#D1D1D6] border border-white/[0.08]',
    success: 'bg-[#34C759]/15 text-[#30D158] border border-[#34C759]/30',
    danger: 'bg-[#FF3B30]/15 text-[#FF453A] border border-[#FF3B30]/30',
    warning: 'bg-[#FF9500]/15 text-[#FF9F0A] border border-[#FF9500]/30',
    info: 'bg-[#007AFF]/15 text-[#0A84FF] border border-[#007AFF]/30',
    glass: 'bg-white/[0.05] backdrop-blur-md text-white border border-white/[0.12]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 shrink-0 select-none tracking-tight',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
