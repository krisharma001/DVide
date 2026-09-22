import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative flex items-center p-1 bg-[#1C1C1E] border border-white/[0.08] rounded-xl overflow-hidden',
          size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm',
          className
        )
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg font-medium transition-all duration-150 ios-touch select-none z-10',
              isSelected
                ? 'bg-[#3A3A3C] text-white shadow-sm font-semibold'
                : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            )}
          >
            {option.icon && <span className="opacity-80">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
