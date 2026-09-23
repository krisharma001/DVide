import React, { useState, useEffect } from 'react';
import { useDVideStore } from './lib/store';
import { NavigationBar } from './components/layout/NavigationBar';
import { TabBar, ActiveTab } from './components/layout/TabBar';
import { BalanceCard } from './components/room/BalanceCard';
import { ExpenseCard } from './components/expense/ExpenseCard';
import { AddExpenseSheet } from './components/expense/AddExpenseSheet';
import { TableTaxDividerSheet } from './components/expense/TableTaxDividerSheet';
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
  Calculator,
  QrCode,
  LogIn,
} from 'lucide-react';

export function App() {
  const store = useDVideStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isTableTaxOpen, setIsTableTaxOpen] = useState(false);
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-join room from URL invite (/join/:code or ?join=:code or ?room=:code or #join/:code)
  useEffect(() => {
    try {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/join\/([A-Za-z0-9]+)/i);
      let code = match ? match[1] : null;

      if (!code) {
        const searchParams = new URLSearchParams(window.location.search);
        code = searchParams.get('join') || searchParams.get('room');
      }
      if (!code && window.location.hash) {
        const hashMatch = window.location.hash.match(/#\/?join\/([A-Za-z0-9]+)/i);
        if (hashMatch) code = hashMatch[1];
      }

      if (code) {
        const clean = code.toUpperCase().trim();
        if (!store.currentRoom || store.currentRoom.invite_code.toUpperCase() !== clean) {
          console.log('[DVide App] Detected invite code in URL:', clean);
          store.joinRoomByCode(clean);
        }
      }
    } catch (e) {
      console.warn('URL auto-join parsing failed:', e);
    }
  }, []);

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
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] flex flex-col selection:bg-ios-blue/30 selection:text-white">
      {/* Top Navigation Bar */}
      <NavigationBar
        currentRoom={store.currentRoom}
        members={store.members}
        currentUser={store.currentUser}
        onOpenRoomSwitcher={() => setIsRoomSwitcherOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPeople={() => setActiveTab('people')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-28">
        {/* ZERO DATA / NO ROOM STATE: ONBOARDING */}
        {!store.currentRoom ? (
          <div className="pt-10 pb-16 space-y-6 text-center animate-in fade-in duration-300">
            {/* Liquid Glass App Icon */}
            <div className="w-20 h-20 rounded-[28px] mx-auto bg-gradient-to-b from-[#282834] to-[#121218] border border-white/[0.18] shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_16px_40px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-[#30D158] to-[#0A84FF]">
                ÷
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">DVide</h1>
              <p className="text-xs text-[#8E8E93] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Shared expense tracking, group bill splitting, and smart table tax dividing with iOS 27 Liquid Glass UI.
              </p>
            </div>

            {/* Quick Start Actions */}
            <div className="space-y-3 max-w-sm mx-auto pt-2">
              <button
                type="button"
                onClick={() => setIsRoomSwitcherOpen(true)}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-b from-[#0A84FF] to-[#0066D6] hover:from-[#007AFF] hover:to-[#0055B8] text-white font-semibold text-sm shadow-[0_8px_24px_rgba(0,122,255,0.4)] border border-white/20 transition-all ios-touch flex items-center justify-center gap-2"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Create Your First Room</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRoomSwitcherOpen(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-sm border border-white/[0.1] transition-all ios-touch flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                <span>Join with Room Code</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-6 text-left max-w-sm mx-auto">
              <GlassCard variant="surface" className="p-3.5">
                <Calculator size={18} className="text-[#30D158] mb-1.5" />
                <h4 className="text-xs font-semibold text-white">Table Tax Divider</h4>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Split restaurant tax & tip fairly across personal orders.
                </p>
              </GlassCard>

              <GlassCard variant="surface" className="p-3.5">
                <Scale size={18} className="text-[#0A84FF] mb-1.5" />
                <h4 className="text-xs font-semibold text-white">Debt Simplifier</h4>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Minimizes group transactions with 1-tap UPI settlements.
                </p>
              </GlassCard>
            </div>
          </div>
        ) : (
          <>
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

                {/* 4 iOS 27 Liquid Glass Quick Action Cards */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Action 1: Add Bill */}
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/[0.1] transition-all ios-touch"
                  >
                    <div className="w-8 h-8 rounded-full bg-ios-blue/20 text-ios-blue flex items-center justify-center mb-1">
                      <Plus size={18} />
                    </div>
                    <span className="text-[11px] font-semibold text-white">Add Bill</span>
                  </button>

                  {/* Action 2: Table Tax Divider */}
                  <button
                    type="button"
                    onClick={() => setIsTableTaxOpen(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/[0.1] transition-all ios-touch"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center mb-1">
                      <Calculator size={16} />
                    </div>
                    <span className="text-[11px] font-semibold text-white">Table Tax</span>
                  </button>

                  {/* Action 3: Settle Up */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('settle')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/[0.1] transition-all ios-touch"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FF9500]/20 text-[#FF9500] flex items-center justify-center mb-1">
                      <Scale size={16} />
                    </div>
                    <span className="text-[11px] font-semibold text-white">Settle</span>
                  </button>

                  {/* Action 4: Invite QR */}
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/[0.1] transition-all ios-touch"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center mb-1">
                      <QrCode size={16} />
                    </div>
                    <span className="text-[11px] font-semibold text-white">QR Invite</span>
                  </button>
                </div>

                {/* Table Tax Quick Tip Callout */}
                <div
                  onClick={() => setIsTableTaxOpen(true)}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-ios-blue/15 to-[#30D158]/15 border border-white/[0.1] flex items-center justify-between cursor-pointer ios-touch"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Calculator size={14} className="text-[#30D158]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Table Tax & Bill Divider</span>
                      <span className="text-[10px] text-[#8E8E93] block">
                        Apply restaurant receipt GST / Tip across individual orders
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={15} className="text-[#0A84FF]" />
                </div>

                {/* Recent Expenses List */}
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
                      <h3 className="text-sm font-semibold text-white">No expenses logged yet</h3>
                      <p className="text-xs text-[#8E8E93] mt-1">
                        Add your personal dishes or expenses, then use Table Tax to divide the bill tax.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-ios-blue text-xs font-semibold text-white transition-colors ios-touch"
                      >
                        + Add First Bill
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
                          currency={store.currentRoom?.currency || '₹'}
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
                        Settlement Recommendation
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('settle')}
                        className="text-xs font-medium text-ios-blue hover:underline"
                      >
                        Full view →
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTableTaxOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors ios-touch"
                    >
                      <Calculator size={13} className="text-[#30D158]" />
                      <span>Table Tax</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ios-blue text-xs font-semibold text-white transition-colors ios-touch"
                    >
                      <Plus size={14} />
                      <span>Add Bill</span>
                    </button>
                  </div>
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
                        currency={store.currentRoom?.currency || '₹'}
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
                  adminUserId={store.roomAdminUserId}
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
                  adminUserId={store.roomAdminUserId}
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
                  currentRoom={store.currentRoom}
                  currency={store.currentRoom.currency}
                  adminUserId={store.roomAdminUserId}
                  isCurrentUserAdmin={store.isCurrentUserAdmin}
                  onAddMember={store.addMemberToRoom}
                  onSwitchUser={store.switchUser}
                  onUpdateProfileName={store.updateProfileName}
                  onRemoveMember={store.removeMemberFromRoom}
                  onUpdateRoomDetails={store.updateRoomDetails}
                  onTransferAdmin={store.transferAdmin}
                  onResetRoomLedger={store.resetRoomLedger}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating iOS 27 Liquid Glass Capsule Dock */}
      {store.currentRoom && (
        <TabBar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* MODALS */}
      {store.currentRoom && (
        <>
          <AddExpenseSheet
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            members={store.members}
            currentUserId={store.currentUser.id}
            currency={store.currentRoom.currency}
            onAddExpense={store.addExpense}
          />

          <TableTaxDividerSheet
            isOpen={isTableTaxOpen}
            onClose={() => setIsTableTaxOpen(false)}
            members={store.members}
            expenses={store.expenses}
            currentUserId={store.currentUser.id}
            currency={store.currentRoom.currency}
            onApplyTableTax={store.addExpense}
          />

          <InviteSheet
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            room={store.currentRoom}
          />
        </>
      )}

      <RoomSwitcherModal
        isOpen={isRoomSwitcherOpen}
        onClose={() => setIsRoomSwitcherOpen(false)}
        currentRoom={store.currentRoom}
        rooms={store.rooms}
        onSelectRoom={store.switchRoom}
        onCreateRoom={store.createRoom}
        onJoinRoom={store.joinRoomByCode}
        onResetDemo={store.clearAllData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={store.currentUser}
        onUpdateProfileName={store.updateProfileName}
        onResetDemo={store.clearAllData}
      />
    </div>
  );
}

export default App;
