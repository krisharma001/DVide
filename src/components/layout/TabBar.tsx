import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Receipt, Scale, MessageCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export type ActiveTab = 'overview' | 'expenses' | 'settle' | 'chat' | 'people';
type DockTab = 'overview' | 'expenses' | 'settle' | 'chat';

interface TabBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
  unreadCount?: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddExpense,
  unreadCount = 0,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<DockTab, HTMLButtonElement | null>>({
    overview: null,
    expenses: null,
    settle: null,
    chat: null,
  });

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [dragActiveTab, setDragActiveTab] = useState<DockTab | null>(null);

  const TABS: DockTab[] = ['overview', 'expenses', 'settle', 'chat'];

  // Smoothly position indicator over target tab's exact bounding box
  const updateIndicatorToTab = useCallback((tab: ActiveTab) => {
    if (tab === 'people') {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const activeEl = tabRefs.current[tab as DockTab];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setIndicatorStyle({
        left: Math.round(activeRect.left - navRect.left),
        top: Math.round(activeRect.top - navRect.top),
        width: Math.round(activeRect.width),
        height: Math.round(activeRect.height),
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    if (!isDragging) {
      updateIndicatorToTab(activeTab);
    }
    const handleResize = () => updateIndicatorToTab(activeTab);
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => updateIndicatorToTab(activeTab), 30);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTab, isDragging, updateIndicatorToTab]);

  // Find which tab is closest to a horizontal coordinate
  const getClosestTab = (clientX: number): DockTab => {
    let closestTab: DockTab = activeTab === 'people' ? 'overview' : (activeTab as DockTab);
    let minDistance = Infinity;

    for (const tab of TABS) {
      const el = tabRefs.current[tab];
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - centerX);
        if (dist < minDistance) {
          minDistance = dist;
          closestTab = tab;
        }
      }
    }
    return closestTab;
  };

  // --- Real-time Liquid Glass Drag & Sliding Gesture Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // If user clicked the center action (+) button, don't initiate tab drag
    const target = e.target as HTMLElement;
    if (target.closest('[data-center-action]')) return;

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    setIsDragging(true);
    setIsTouched(true);

    const initialTab = getClosestTab(e.clientX);
    setDragActiveTab(initialTab);
    updateDragPosition(e.clientX, initialTab);
  };

  const updateDragPosition = (clientX: number, targetTab: DockTab) => {
    const navEl = navRef.current;
    const tabEl = tabRefs.current[targetTab];
    if (!navEl || !tabEl) return;

    const navRect = navEl.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();

    const idealCenterX = tabRect.left - navRect.left + tabRect.width / 2;
    const currentPointerX = clientX - navRect.left;
    const delta = currentPointerX - idealCenterX;

    // Fluid Viscous Stretch: stretches dynamically in the direction of the drag
    const stretch = Math.min(26, Math.abs(delta) * 0.3);
    const stretchLeftOffset = delta > 0 ? 0 : stretch;

    setIndicatorStyle({
      left: Math.round(tabRect.left - navRect.left + delta * 0.45 - stretchLeftOffset),
      top: Math.round(tabRect.top - navRect.top),
      width: Math.round(tabRect.width + stretch),
      height: Math.round(tabRect.height),
      opacity: 1,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    const closest = getClosestTab(e.clientX);
    setDragActiveTab(closest);
    updateDragPosition(e.clientX, closest);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }

    setIsDragging(false);
    const finalTab = getClosestTab(e.clientX);
    setDragActiveTab(null);
    onChangeTab(finalTab);
    updateIndicatorToTab(finalTab);

    // Keep touched chromatic dispersion active briefly to allow smooth relaxation
    setTimeout(() => {
      setIsTouched(false);
    }, 280);
  };

  const handleTabClick = (tab: DockTab) => {
    // When clicked directly, trigger a brief touched bloom during the glide
    setIsTouched(true);
    onChangeTab(tab);
    updateIndicatorToTab(tab);
    setTimeout(() => {
      setIsTouched(false);
    }, 320);
  };

  const currentTab = isDragging ? dragActiveTab || activeTab : activeTab;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
      {/* iOS 27 Liquid Glass Floating Capsule Dock */}
      <nav
        ref={navRef}
        role="navigation"
        aria-label="Bottom Navigation"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pointer-events-auto glass-dock rounded-full p-1.5 flex items-center justify-between w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,122,255,0.15)] relative touch-none select-none"
      >
        {/* Physical Liquid Glass Lens (Resting: Image 1 | Touched/Sliding: Image 2 with Rainbow Caustics) */}
        <div
          className={clsx(
            'liquid-lens',
            (isDragging || isTouched) && 'is-active-touched',
            isDragging && 'is-dragging'
          )}
          style={{
            transform: `translateX(${indicatorStyle.left}px) translateY(${indicatorStyle.top}px)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* Tab 1: Overview / Summary */}
        <button
          ref={(el) => { tabRefs.current.overview = el; }}
          type="button"
          onClick={() => handleTabClick('overview')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
            currentTab === 'overview' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="flex flex-col items-center justify-center -space-y-0.5">
            <LayoutDashboard
              size={18}
              strokeWidth={currentTab === 'overview' ? 2.5 : 1.8}
              fill={currentTab === 'overview' ? 'currentColor' : 'none'}
              className={clsx(
                'transition-all duration-300',
                currentTab === 'overview'
                  ? 'text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-110'
                  : 'text-[#8E8E93]'
              )}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
              Summary
            </span>
          </div>
        </button>

        {/* Tab 2: Expenses / Bills */}
        <button
          ref={(el) => { tabRefs.current.expenses = el; }}
          type="button"
          onClick={() => handleTabClick('expenses')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
            currentTab === 'expenses' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="flex flex-col items-center justify-center -space-y-0.5">
            <Receipt
              size={18}
              strokeWidth={currentTab === 'expenses' ? 2.5 : 1.8}
              fill={currentTab === 'expenses' ? 'currentColor' : 'none'}
              className={clsx(
                'transition-all duration-300',
                currentTab === 'expenses'
                  ? 'text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-110'
                  : 'text-[#8E8E93]'
              )}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
              Bills
            </span>
          </div>
        </button>

        {/* CENTER ACTION: Symmetrically Centered Luminous Liquid Glass (+) Button */}
        <div data-center-action className="px-1.5 flex items-center justify-center relative z-20 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddExpense();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-11 h-11 rounded-full bg-gradient-to-b from-[#0A84FF] to-[#0066D6] hover:from-[#007AFF] hover:to-[#0055B8] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_22px_rgba(10,132,255,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.5)] border border-white/40 transition-all duration-200 ios-touch hover:scale-105"
            aria-label="Add Expense"
            title="Add Expense"
          >
            <Plus size={22} strokeWidth={2.8} />
          </button>
        </div>

        {/* Tab 3: Settle */}
        <button
          ref={(el) => { tabRefs.current.settle = el; }}
          type="button"
          onClick={() => handleTabClick('settle')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
            currentTab === 'settle' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="flex flex-col items-center justify-center -space-y-0.5">
            <Scale
              size={18}
              strokeWidth={currentTab === 'settle' ? 2.5 : 1.8}
              fill={currentTab === 'settle' ? 'currentColor' : 'none'}
              className={clsx(
                'transition-all duration-300',
                currentTab === 'settle'
                  ? 'text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-110'
                  : 'text-[#8E8E93]'
              )}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
              Settle
            </span>
          </div>
        </button>

        {/* Tab 4: Chat */}
        <button
          ref={(el) => { tabRefs.current.chat = el; }}
          type="button"
          onClick={() => handleTabClick('chat')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
            currentTab === 'chat' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="flex flex-col items-center justify-center -space-y-0.5">
            <div className="relative">
              <MessageCircle
                size={18}
                strokeWidth={currentTab === 'chat' ? 2.5 : 1.8}
                fill={currentTab === 'chat' ? 'currentColor' : 'none'}
                className={clsx(
                  'transition-all duration-300',
                  currentTab === 'chat'
                    ? 'text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-110'
                    : 'text-[#8E8E93]'
                )}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-[#121214] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
              Chat
            </span>
          </div>
        </button>
      </nav>
    </div>
  );
};
