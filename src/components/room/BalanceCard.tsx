import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { MemberBalance, RoomSummary } from '../../types';

interface BalanceCardProps {
  myBalance: MemberBalance;
  roomSummary: RoomSummary;
  currency: string;
  onSettleClick: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  myBalance,
  roomSummary,
  currency,
  onSettleClick,
}) => {
  const isCreditor = myBalance.net_balance > 0.009;
  const isDebtor = myBalance.net_balance < -0.009;
  const isSettled = !isCreditor && !isDebtor;

  return (
    <div className="relative w-full">
      {/* Apple Cash / Titanium Wallet Card */}
      <GlassCard
        variant="wallet"
        className="p-6 relative overflow-hidden rounded-[26px] border border-white/[0.14]"
      >
        {/* Subtle Titanium Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] via-transparent to-white/[0.08] pointer-events-none" />

        <div className="relative z-10">
          {/* Card Top Row: Label & Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles size={13} className="text-white/80" />
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#8E8E93]">
                Your Balance
              </span>
            </div>

            {isCreditor && (
              <Badge variant="success" size="sm" icon={<ArrowUpRight size={12} />}>
                You receive
              </Badge>
            )}
            {isDebtor && (
              <Badge variant="danger" size="sm" icon={<ArrowDownLeft size={12} />}>
                You owe
              </Badge>
            )}
            {isSettled && (
              <Badge variant="neutral" size="sm" icon={<CheckCircle2 size={12} />}>
                Settled Up
              </Badge>
            )}
          </div>

          {/* Large Hero Amount */}
          <div className="mt-4 mb-5">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl sm:text-5xl font-bold tracking-tight tnum ${
                  isCreditor
                    ? 'text-[#30D158]'
                    : isDebtor
                    ? 'text-[#FF453A]'
                    : 'text-[#F2F2F7]'
                }`}
              >
                {formatCurrency(myBalance.net_balance, currency)}
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-1 font-normal">
              {isCreditor
                ? 'Total amount group members owe back to you'
                : isDebtor
                ? 'Your outstanding balance across all group expenses'
                : 'All your expenses in this room are completely balanced'}
            </p>
          </div>

          {/* Divider */}
          <div className="h-[0.5px] bg-white/[0.08] my-4" />

          {/* Sub-metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Paid */}
            <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
              <span className="text-[11px] text-[#8E8E93] block">You Paid</span>
              <span className="text-sm font-semibold text-white tnum mt-0.5 block truncate">
                {formatCurrency(myBalance.amount_paid, currency)}
              </span>
            </div>

            {/* Your Share */}
            <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
              <span className="text-[11px] text-[#8E8E93] block">Your Share</span>
              <span className="text-sm font-semibold text-white tnum mt-0.5 block truncate">
                {formatCurrency(myBalance.amount_owed, currency)}
              </span>
            </div>

            {/* Room Total */}
            <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
              <span className="text-[11px] text-[#8E8E93] block">Total Spent</span>
              <span className="text-sm font-semibold text-white tnum mt-0.5 block truncate">
                {formatCurrency(roomSummary.total_spent, currency)}
              </span>
            </div>
          </div>

          {/* Direct Settlement Action */}
          <div className="mt-4 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
              <TrendingUp size={13} className="text-ios-blue" />
              <span>{roomSummary.expense_count} expenses logged</span>
            </div>

            <button
              type="button"
              onClick={onSettleClick}
              className="text-xs font-semibold text-ios-blue hover:text-white px-3 py-1.5 rounded-lg bg-ios-blue/10 hover:bg-ios-blue/20 transition-colors ios-touch flex items-center gap-1"
            >
              <span>Settlement Plan</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
