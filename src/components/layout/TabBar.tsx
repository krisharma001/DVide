import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Scale, MessageCircle, Plus, Users } from 'lucide-react';
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
  const tabRefs = useRef<Record<ActiveTab, HTMLButtonElement | null>>({
    overview: null,
    expenses: null,
    settle: null,
    chat: null,
    people: null,
  });

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const updateIndicator = () => {
    const activeEl = tabRefs.current[activeTab];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    // Re-calculate on window resize or layout shift
    window.addEventListener('resize', updateIndicator);
    const timer = setTimeout(updateIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, [activeTab]);

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
      {/* iOS 27 Liquid Glass Floating Capsule Dock with Dynamic Spring Slider */}
      <nav
        ref={navRef}
        role="navigation"
        aria-label="Bottom Navigation"
        className="pointer-events-auto glass-dock rounded-full px-2 py-1.5 flex items-center justify-between gap-1 w-full max-w-md shadow-2xl relative"
      >
        {/* Physical Liquid Glass Sliding Indicator */}
        <div
          className="glass-slider-pill"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* Tab 1: Overview */}
        <button
          ref={(el) => { tabRefs.current.overview = el; }}
          type="button"
          onClick={() => onChangeTab('overview')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-300 ios-touch',
            activeTab === 'overview'
              ? 'text-white scale-105'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <LayoutDashboard
            size={19}
            strokeWidth={activeTab === 'overview' ? 2.4 : 1.8}
            className={activeTab === 'overview' ? 'text-[#0A84FF] filter drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]' : ''}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Summary</span>
        </button>

        {/* Tab 2: Expenses */}
        <button
          ref={(el) => { tabRefs.current.expenses = el; }}
          type="button"
          onClick={() => onChangeTab('expenses')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-300 ios-touch',
            activeTab === 'expenses'
              ? 'text-white scale-105'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Receipt
            size={19}
            strokeWidth={activeTab === 'expenses' ? 2.4 : 1.8}
            className={activeTab === 'expenses' ? 'text-[#0A84FF] filter drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]' : ''}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Bills</span>
        </button>

        {/* CENTER ACTION: Perfectly Aligned Luminous Liquid Glass + Button */}
        <div className="px-1 flex items-center justify-center relative z-10">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-11 h-11 rounded-full bg-gradient-to-b from-[#0A84FF] to-[#0066D6] hover:from-[#007AFF] hover:to-[#0055B8] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(10,132,255,0.55),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/35 transition-all duration-200 ios-touch hover:scale-105 active:scale-95"
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
          onClick={() => onChangeTab('settle')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-300 ios-touch',
            activeTab === 'settle'
              ? 'text-white scale-105'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Scale
            size={19}
            strokeWidth={activeTab === 'settle' ? 2.4 : 1.8}
            className={activeTab === 'settle' ? 'text-[#0A84FF] filter drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]' : ''}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Settle</span>
        </button>

        {/* Tab 4: Chat */}
        <button
          ref={(el) => { tabRefs.current.chat = el; }}
          type="button"
          onClick={() => onChangeTab('chat')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-300 ios-touch',
            activeTab === 'chat'
              ? 'text-white scale-105'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="relative">
            <MessageCircle
              size={19}
              strokeWidth={activeTab === 'chat' ? 2.4 : 1.8}
              className={activeTab === 'chat' ? 'text-[#0A84FF] filter drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]' : ''}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-[#121214] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Chat</span>
        </button>

        {/* Tab 5: People */}
        <button
          ref={(el) => { tabRefs.current.people = el; }}
          type="button"
          onClick={() => onChangeTab('people')}
          className={clsx(
            'relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-300 ios-touch',
            activeTab === 'people'
              ? 'text-white scale-105'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Users
            size={19}
            strokeWidth={activeTab === 'people' ? 2.4 : 1.8}
            className={activeTab === 'people' ? 'text-[#0A84FF] filter drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]' : ''}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">People</span>
        </button>
      </nav>
    </div>
  );
};
