import React, { useState } from 'react';
import { useDVideStore } from './lib/store';
import { NavigationBar } from './components/layout/NavigationBar';
import { TabBar, ActiveTab } from './components/layout/TabBar';
import { BalanceCard } from './components/room/BalanceCard';
import { ExpenseCard } from './components/expense/ExpenseCard';
import { AddExpenseSheet } from './components/expense/AddExpenseSheet';
import { SettlementMatrix } from './components/settlement/SettlementMatrix';
import { ChatThread } from './components/chat/ChatThread';
import { RoomMemberList } from './components/room/RoomMemberList';
import { RoomSwitcherModal } from './components/room/RoomSwitcherModal';
import { InviteSheet } from './components/room/InviteSheet';
import { SettingsModal } from './components/layout/SettingsModal';
import { GlassCard } from './components/ui/GlassCard';
import { formatCurrency } from './lib/calculations';
import {
  Plus,
  ArrowUpRight,
  Share2,
  Receipt,
  Search,
  Users,
  MessageCircle,
  Scale,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ExpenseCategory } from './types';

export function App() {
  const store = useDVideStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Expense tab filter & search
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredExpenses = store.expenses.filter((e) => {
    const matchesCategory = expenseFilter === 'all' || e.category === expenseFilter;
    const matchesSearch =
      searchQuery === '' ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F7] flex flex-col selection:bg-ios-blue/30 selection:text-white">
      {/* Top Header */}
      <NavigationBar
        currentRoom={store.currentRoom}
        members={store.members}
        currentUser={store.currentUser}
        onOpenRoomSwitcher={() => setIsRoomSwitcherOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-28">
        {/* TAB 1: OVERVIEW / SUMMARY */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Apple Cash Style Personal Balance Card */}
            <BalanceCard
              myBalance={store.myBalance}
              roomSummary={store.roomSummary}
              currency={store.currentRoom.currency}
              onSettleClick={() => setActiveTab('settle')}
            />

            {/* Quick Actions Trio */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all ios-touch"
              >
                <div className="w-9 h-9 rounded-full bg-ios-blue/20 text-ios-blue flex items-center justify-center mb-1.5">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-semibold text-white">Add Bill</span>
                <span className="text-[10px] text-[#8E8E93]">Split evenly</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settle')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all ios-touch"
              >
                <div className="w-9 h-9 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center mb-1.5">
                  <Scale size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Settle Up</span>
                <span className="text-[10px] text-[#8E8E93]">
                  {store.settlementTransfers.length} transfers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all ios-touch"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center mb-1.5">
                  <Share2 size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Invite</span>
                <span className="text-[10px] text-[#8E8E93]">Room Code</span>
              </button>
            </div>

            {/* Recent Expenses List Header */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Recent Expenses
                </span>
                {store.expenses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('expenses')}
                    className="text-xs font-medium text-ios-blue hover:text-white transition-colors"
                  >
                    View All ({store.expenses.length})
                  </button>
                )}
              </div>

              {store.expenses.length === 0 ? (
                <GlassCard variant="surface" className="p-8 text-center border-dashed border-white/10">
                  <Receipt size={32} className="text-[#8E8E93] mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-semibold text-white">No expenses yet</h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Add your first bill and DVide will calculate everyone's share automatically.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-ios-blue text-xs font-semibold text-white transition-colors ios-touch"
                  >
                    + Add Expense
                  </button>
                </GlassCard>
              ) : (
                <div className="space-y-2.5">
                  {store.expenses.slice(0, 4).map((exp) => (
                    <ExpenseCard
                      key={exp.id}
                      expense={exp}
                      members={store.members}
                      currentUserId={store.currentUser.id}
                      currency={store.currentRoom.currency}
                      onDelete={store.deleteExpense}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Settlement Sneak Peek */}
            {store.settlementTransfers.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                    Next Payment to Settle
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settle')}
                    className="text-xs font-medium text-ios-blue hover:underline"
                  >
                    All plans →
                  </button>
                </div>
                <GlassCard
                  variant="elevated"
                  className="p-3.5 px-4 flex items-center justify-between border-ios-blue/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8E8E93]">
                      <strong className="text-white font-medium">
                        {store.settlementTransfers[0].from_name}
                      </strong>{' '}
                      owes{' '}
                      <strong className="text-white font-medium">
                        {store.settlementTransfers[0].to_name}
                      </strong>
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white tnum">
                    {formatCurrency(
                      store.settlementTransfers[0].amount,
                      store.currentRoom.currency
                    )}
                  </span>
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-1 pt-1">
              <h2 className="text-xl font-bold tracking-tight text-white">Expenses</h2>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ios-blue text-xs font-semibold text-white transition-colors ios-touch"
              >
                <Plus size={14} />
                <span>Add Bill</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]"
              />
              <input
                type="text"
                placeholder="Search expenses by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl glass-input text-xs text-white placeholder:text-[#636366]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'food', label: 'Food' },
                { id: 'transport', label: 'Ride' },
                { id: 'groceries', label: 'Groceries' },
                { id: 'hotel', label: 'Stay' },
                { id: 'entertainment', label: 'Fun' },
                { id: 'other', label: 'Other' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setExpenseFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium ${
                    expenseFilter === pill.id
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-white/[0.05] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
              <GlassCard variant="surface" className="p-8 text-center">
                <p className="text-xs text-[#8E8E93]">No matching expenses found.</p>
              </GlassCard>
            ) : (
              <div className="space-y-2.5">
                {filteredExpenses.map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    members={store.members}
                    currentUserId={store.currentUser.id}
                    currency={store.currentRoom.currency}
                    onDelete={store.deleteExpense}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTLEMENT ENGINE */}
        {activeTab === 'settle' && (
          <div className="animate-in fade-in duration-200">
            <SettlementMatrix
              transfers={store.settlementTransfers}
              settlements={store.settlements}
              memberBalances={store.memberBalances}
              currency={store.currentRoom.currency}
              currentUserId={store.currentUser.id}
              onRecordSettlement={store.recordSettlement}
            />
          </div>
        )}

        {/* TAB 4: REAL-TIME ROOM CHAT */}
        {activeTab === 'chat' && (
          <div className="animate-in fade-in duration-200 -mx-4 -mt-4">
            <ChatThread
              chats={store.chats}
              members={store.members}
              currentUser={store.currentUser}
              onSendMessage={store.sendChatMessage}
            />
          </div>
        )}

        {/* TAB 5: ROOM MEMBERS & PEOPLE */}
        {activeTab === 'people' && (
          <div className="animate-in fade-in duration-200">
            <RoomMemberList
              members={store.members}
              balances={store.memberBalances}
              currentUser={store.currentUser}
              currency={store.currentRoom.currency}
              onAddMember={store.addMemberToRoom}
              onSwitchUser={store.switchUser}
            />
          </div>
        )}
      </main>

      {/* Floating / Sticky iOS Bottom Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* MODALS */}
      <AddExpenseSheet
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        members={store.members}
        currentUserId={store.currentUser.id}
        currency={store.currentRoom.currency}
        onAddExpense={store.addExpense}
      />

      <RoomSwitcherModal
        isOpen={isRoomSwitcherOpen}
        onClose={() => setIsRoomSwitcherOpen(false)}
        currentRoom={store.currentRoom}
        rooms={store.rooms}
        onSelectRoom={store.switchRoom}
        onCreateRoom={store.createRoom}
        onJoinRoom={store.joinRoomByCode}
        onResetDemo={store.resetToDemo}
      />

      <InviteSheet
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        room={store.currentRoom}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={store.currentUser}
        onResetDemo={store.resetToDemo}
      />
    </div>
  );
}

export default App;
