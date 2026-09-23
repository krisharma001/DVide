import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'sunken' | 'wallet' | 'liquid';
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
    surface:
      'bg-gradient-to-b from-[#202026]/85 to-[#141418]/85 backdrop-blur-liquid border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)]',
    elevated:
      'bg-gradient-to-b from-[#2a2a32]/90 to-[#181820]/90 backdrop-blur-liquid border border-white/[0.16] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),0_16px_40px_rgba(0,0,0,0.65)]',
    sunken:
      'bg-black/40 backdrop-blur-md border border-white/[0.06] shadow-inner',
    wallet:
      'bg-gradient-to-b from-[#25252e]/95 via-[#18181f]/95 to-[#101014]/95 backdrop-blur-liquid border border-white/[0.16] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_20px_48px_rgba(0,0,0,0.7)]',
    liquid:
      'bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-[36px] border border-white/[0.2] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35),0_12px_36px_rgba(0,0,0,0.45)]',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-[24px] transition-all duration-200',
          variantStyles[variant],
          interactive &&
            'ios-touch cursor-pointer hover:border-white/30 hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3),0_12px_36px_rgba(0,0,0,0.6)] active:scale-[0.98]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
