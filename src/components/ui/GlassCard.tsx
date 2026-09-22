import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'sunken' | 'wallet';
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'surface',
  interactive = false,
  ...props
}) => {
  const variantStyles = {
    surface: 'bg-[#18181B]/80 backdrop-blur-liquid border border-white/[0.08] shadow-glass-sm',
    elevated: 'bg-[#202024]/90 backdrop-blur-liquid border border-white/[0.12] shadow-glass-lg',
    sunken: 'bg-black/30 backdrop-blur-md border border-white/[0.05]',
    wallet: 'bg-gradient-to-b from-[#242428]/95 to-[#161619]/95 backdrop-blur-liquid border border-white/[0.14] shadow-ios-float',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl transition-all duration-150',
          variantStyles[variant],
          interactive && 'ios-touch cursor-pointer hover:border-white/20 active:border-white/25',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
