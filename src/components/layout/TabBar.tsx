import React from 'react';
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
  return (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
      {/* iOS 27 Liquid Glass Floating Capsule Dock */}
      <nav
        role="navigation"
        aria-label="Bottom Navigation"
        className="pointer-events-auto glass-dock rounded-full px-3 py-1.5 flex items-center justify-between gap-1 w-full max-w-md shadow-2xl transition-all duration-300"
      >
        {/* Tab 1: Overview */}
        <button
          type="button"
          onClick={() => onChangeTab('overview')}
          className={clsx(
            'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ios-touch',
            activeTab === 'overview'
              ? 'text-[#007AFF] bg-white/[0.08]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <LayoutDashboard size={19} strokeWidth={activeTab === 'overview' ? 2.3 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Summary</span>
        </button>

        {/* Tab 2: Expenses */}
        <button
          type="button"
          onClick={() => onChangeTab('expenses')}
          className={clsx(
            'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ios-touch',
            activeTab === 'expenses'
              ? 'text-[#007AFF] bg-white/[0.08]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Receipt size={19} strokeWidth={activeTab === 'expenses' ? 2.3 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Bills</span>
        </button>

        {/* CENTER ACTION: Perfectly Aligned Luminous Liquid Glass + Button */}
        <div className="px-1 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-11 h-11 rounded-full bg-gradient-to-b from-[#0A84FF] to-[#0066D6] hover:from-[#007AFF] hover:to-[#0055B8] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,122,255,0.45)] border border-white/30 transition-all duration-200 ios-touch"
            aria-label="Add Expense"
            title="Add Expense"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>

        {/* Tab 3: Settle */}
        <button
          type="button"
          onClick={() => onChangeTab('settle')}
          className={clsx(
            'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ios-touch',
            activeTab === 'settle'
              ? 'text-[#007AFF] bg-white/[0.08]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Scale size={19} strokeWidth={activeTab === 'settle' ? 2.3 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Settle</span>
        </button>

        {/* Tab 4: Chat */}
        <button
          type="button"
          onClick={() => onChangeTab('chat')}
          className={clsx(
            'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ios-touch relative',
            activeTab === 'chat'
              ? 'text-[#007AFF] bg-white/[0.08]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <div className="relative">
            <MessageCircle size={19} strokeWidth={activeTab === 'chat' ? 2.3 : 1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-[#121214]" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Chat</span>
        </button>

        {/* Tab 5: People */}
        <button
          type="button"
          onClick={() => onChangeTab('people')}
          className={clsx(
            'flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ios-touch',
            activeTab === 'people'
              ? 'text-[#007AFF] bg-white/[0.08]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          )}
        >
          <Users size={19} strokeWidth={activeTab === 'people' ? 2.3 : 1.8} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">People</span>
        </button>
      </nav>
    </div>
  );
};
