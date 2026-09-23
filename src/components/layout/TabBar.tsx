import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Receipt, Scale, MessageCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export type ActiveTab = 'overview' | 'expenses' | 'settle' | 'chat' | 'people';

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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({
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

  type DockTab = 'overview' | 'expenses' | 'settle' | 'chat';
  const TABS: DockTab[] = ['overview', 'expenses', 'settle', 'chat'];

  const [isDragging, setIsDragging] = useState(false);
  const [dragTab, setDragTab] = useState<DockTab | null>(null);

  // Calculate indicator position matching the active button's exact bounding box
  const updateIndicatorToTab = useCallback((tab: ActiveTab) => {
    const activeEl = tabRefs.current[tab];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setIndicatorStyle({
        left: Math.round(activeRect.left - navRect.left),
        top: Math.round(activeRect.top - navRect.top),
        width: Math.round(activeRect.width),
        height: Math.round(activeRect.height),
        opacity: tab === 'people' ? 0 : 1,
      });
    }
  }, []);

  useEffect(() => {
    if (!isDragging) {
      updateIndicatorToTab(activeTab);
    }
    const handleResize = () => updateIndicatorToTab(activeTab);
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => updateIndicatorToTab(activeTab), 40);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTab, isDragging, updateIndicatorToTab]);

  // Find the closest tab to a given screen clientX
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

  // --- Real-time Liquid Glass Drag / Slide Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Ignore if clicked on the center + button
    const target = e.target as HTMLElement;
    if (target.closest('[data-center-action]')) return;

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    setIsDragging(true);
    const initialTab = getClosestTab(e.clientX);
    setDragTab(initialTab);
    updateDragPosition(e.clientX, initialTab);
  };

  const updateDragPosition = (clientX: number, targetTab: ActiveTab) => {
    const navEl = navRef.current;
    const tabEl = tabRefs.current[targetTab];
    if (!navEl || !tabEl) return;

    const navRect = navEl.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();

    const idealCenterX = tabRect.left - navRect.left + tabRect.width / 2;
    const currentPointerX = clientX - navRect.left;
    const delta = currentPointerX - idealCenterX;

    // Viscous liquid stretch physics
    const stretch = Math.min(22, Math.abs(delta) * 0.28);
    const stretchLeftOffset = delta > 0 ? 0 : stretch;

    setIndicatorStyle({
      left: Math.round(tabRect.left - navRect.left + delta * 0.4 - stretchLeftOffset),
      top: Math.round(tabRect.top - navRect.top),
      width: Math.round(tabRect.width + stretch),
      height: Math.round(tabRect.height),
      opacity: 1,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    const closest = getClosestTab(e.clientX);
    setDragTab(closest);
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
    setDragTab(null);
    onChangeTab(finalTab);
    updateIndicatorToTab(finalTab);
  };

  const displayedTab = isDragging ? dragTab || activeTab : activeTab;

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
        {/* Physical Liquid Glass Sliding Indicator */}
        <div
          className={clsx('glass-slider-pill', isDragging && 'is-dragging')}
          style={{
            transform: `translateX(${indicatorStyle.left}px) translateY(${indicatorStyle.top}px)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* LEFT WING: Summary & Bills (50% of left space) */}
        <div className="flex-1 flex items-center justify-around gap-1">
          {/* Tab 1: Overview */}
          <button
            ref={(el) => { tabRefs.current.overview = el; }}
            type="button"
            onClick={() => onChangeTab('overview')}
            className={clsx(
              'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
              displayedTab === 'overview' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            )}
          >
            <div className="flex flex-col items-center justify-center -space-y-0.5">
              <LayoutDashboard
                size={18}
                strokeWidth={displayedTab === 'overview' ? 2.5 : 1.8}
                className={clsx(
                  'transition-all duration-300',
                  displayedTab === 'overview'
                    ? 'text-[#0A84FF] filter drop-shadow-[0_0_10px_rgba(10,132,255,0.8)] scale-110'
                    : ''
                )}
              />
              <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
                Summary
              </span>
            </div>
          </button>

          {/* Tab 2: Expenses */}
          <button
            ref={(el) => { tabRefs.current.expenses = el; }}
            type="button"
            onClick={() => onChangeTab('expenses')}
            className={clsx(
              'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
              displayedTab === 'expenses' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            )}
          >
            <div className="flex flex-col items-center justify-center -space-y-0.5">
              <Receipt
                size={18}
                strokeWidth={displayedTab === 'expenses' ? 2.5 : 1.8}
                className={clsx(
                  'transition-all duration-300',
                  displayedTab === 'expenses'
                    ? 'text-[#0A84FF] filter drop-shadow-[0_0_10px_rgba(10,132,255,0.8)] scale-110'
                    : ''
                )}
              />
              <span className="text-[10px] font-semibold tracking-tight mt-1 leading-tight">
                Bills
              </span>
            </div>
          </button>
        </div>

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

        {/* RIGHT WING: Settle & Chat (50% of right space) */}
        <div className="flex-1 flex items-center justify-around gap-1">
          {/* Tab 3: Settle */}
          <button
            ref={(el) => { tabRefs.current.settle = el; }}
            type="button"
            onClick={() => onChangeTab('settle')}
            className={clsx(
              'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
              displayedTab === 'settle' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            )}
          >
            <div className="flex flex-col items-center justify-center -space-y-0.5">
              <Scale
                size={18}
                strokeWidth={displayedTab === 'settle' ? 2.5 : 1.8}
                className={clsx(
                  'transition-all duration-300',
                  displayedTab === 'settle'
                    ? 'text-[#0A84FF] filter drop-shadow-[0_0_10px_rgba(10,132,255,0.8)] scale-110'
                    : ''
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
            onClick={() => onChangeTab('chat')}
            className={clsx(
              'relative z-10 flex-1 flex flex-col items-center justify-center h-12 px-2 rounded-full transition-all duration-300 ios-touch cursor-pointer',
              displayedTab === 'chat' ? 'text-white' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            )}
          >
            <div className="flex flex-col items-center justify-center -space-y-0.5">
              <div className="relative">
                <MessageCircle
                  size={18}
                  strokeWidth={displayedTab === 'chat' ? 2.5 : 1.8}
                  className={clsx(
                    'transition-all duration-300',
                    displayedTab === 'chat'
                      ? 'text-[#0A84FF] filter drop-shadow-[0_0_10px_rgba(10,132,255,0.8)] scale-110'
                      : ''
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
        </div>
      </nav>
    </div>
  );
};
