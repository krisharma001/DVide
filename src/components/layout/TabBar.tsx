import React from 'react';
import { LayoutDashboard, Receipt, Scale, MessageCircle, Users, Plus } from 'lucide-react';
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
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Summary', icon: <LayoutDashboard size={20} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
    { id: 'settle', label: 'Settle', icon: <Scale size={20} /> },
    { id: 'chat', label: 'Chat', icon: <MessageCircle size={20} /> },
    { id: 'people', label: 'People', icon: <Users size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-tabbar pb-safe">
      <div className="max-w-xl mx-auto px-3 h-16 flex items-center justify-around relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 ios-touch relative',
                isActive ? 'text-ios-blue' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
              )}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ios-red ring-2 ring-[#121214]" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Floating Quick Action Button: Add Expense */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="absolute -top-6 right-6 sm:right-8 w-13 h-13 p-3.5 rounded-full bg-ios-blue hover:bg-[#0071EB] text-white shadow-ios-float border border-white/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ios-touch"
          aria-label="Add Expense"
          title="Add Expense"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
};
