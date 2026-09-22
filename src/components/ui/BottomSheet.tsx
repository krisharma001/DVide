import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actionButton,
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Dimmed Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90dvh] transition-transform duration-300 ease-out">
        {/* iOS Grabber Pill */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[#8E8E93] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors ios-touch"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Action Button Footer (if provided) */}
        {actionButton && (
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#161618]/90 backdrop-blur-md pb-safe">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};
