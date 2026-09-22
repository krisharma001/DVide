import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import { ArrowRight, CheckCircle2, Sparkles, Send, ShieldCheck, History } from 'lucide-react';
import { SettlementTransfer, SettlementRecord, MemberBalance } from '../../types';
import confetti from 'canvas-confetti';

interface SettlementMatrixProps {
  transfers: SettlementTransfer[];
  settlements: SettlementRecord[];
  memberBalances: MemberBalance[];
  currency: string;
  currentUserId: string;
  onRecordSettlement: (transfer: { from_user_id: string; to_user_id: string; amount: number }) => void;
}

export const SettlementMatrix: React.FC<SettlementMatrixProps> = ({
  transfers,
  settlements,
  memberBalances,
  currency,
  currentUserId,
  onRecordSettlement,
}) => {
  const [settlingTransfer, setSettlingTransfer] = useState<SettlementTransfer | null>(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#30D158', '#0A84FF', '#FFD60A', '#FFFFFF'],
    });
  };

  const handleConfirmSettle = (transfer: SettlementTransfer) => {
    onRecordSettlement({
      from_user_id: transfer.from_user_id,
      to_user_id: transfer.to_user_id,
      amount: transfer.amount,
    });
    triggerConfetti();
    setSettlingTransfer(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Header */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Settle Up</h2>
        <p className="text-xs text-[#8E8E93] mt-1 max-w-sm mx-auto">
          Optimized with minimal transactions so everyone gets squared away simply.
        </p>
      </div>

      {/* Simplified Debts List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            Recommended Transfers ({transfers.length})
          </span>
          <Badge variant="glass" size="sm" icon={<Sparkles size={11} />}>
            Auto-Simplified
          </Badge>
        </div>

        {transfers.length === 0 ? (
          <GlassCard variant="surface" className="p-8 text-center border-dashed border-white/10">
            <div className="w-12 h-12 rounded-full bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-[#30D158]" />
            </div>
            <h3 className="text-base font-semibold text-white">All Settled Up!</h3>
            <p className="text-xs text-[#8E8E93] mt-1">
              No one owes anyone money in this room right now.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {transfers.map((t, idx) => {
              const isDebtorMe = t.from_user_id === currentUserId;
              const isCreditorMe = t.to_user_id === currentUserId;

              return (
                <GlassCard
                  key={`transfer_${idx}`}
                  variant="surface"
                  className="p-4 border border-white/[0.09] hover:border-white/[0.15] transition-all"
                >
                  <div className="flex items-center justify-between">
                    {/* Transfer Route */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white truncate">
                          {t.from_name} {isDebtorMe && '(You)'}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">Payer</span>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="text-ios-blue" />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white truncate">
                          {t.to_name} {isCreditorMe && '(You)'}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">Recipient</span>
                      </div>
                    </div>

                    {/* Amount & Settle Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold text-white tnum">
                        {formatCurrency(t.amount, currency)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleConfirmSettle(t)}
                        className="px-3 py-1.5 rounded-xl font-semibold text-xs text-white bg-ios-blue hover:bg-[#0071EB] transition-colors ios-touch flex items-center gap-1 shadow-sm"
                      >
                        <ShieldCheck size={13} />
                        <span>Settle</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances Breakdown Table */}
      <div>
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-3 px-1">
          Net Position by Member
        </span>
        <div className="space-y-2">
          {memberBalances.map((m) => {
            const isMe = m.user_id === currentUserId;
            const isPos = m.net_balance > 0.009;
            const isNeg = m.net_balance < -0.009;

            return (
              <GlassCard
                key={m.user_id}
                variant="sunken"
                className="p-3 px-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-white flex items-center justify-center h-full">
                        {m.display_name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {m.display_name} {isMe && '(You)'}
                    </span>
                    <span className="text-[11px] text-[#8E8E93] block">
                      Paid: {formatCurrency(m.amount_paid, currency)} • Share:{' '}
                      {formatCurrency(m.amount_owed, currency)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold tnum block ${
                      isPos ? 'text-[#30D158]' : isNeg ? 'text-[#FF453A]' : 'text-[#8E8E93]'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {formatCurrency(m.net_balance, currency)}
                  </span>
                  <span className="text-[10px] text-[#8E8E93] block">
                    {isPos ? 'Receives' : isNeg ? 'Owes' : 'Settled'}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Completed Settlements Log */}
      {settlements.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-1.5 mb-3 px-1 text-[#8E8E93]">
            <History size={13} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Settlement History ({settlements.length})
            </span>
          </div>

          <div className="space-y-2">
            {settlements.map((s) => (
              <GlassCard
                key={s.id}
                variant="sunken"
                className="p-3 px-4 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                  <span className="text-[#D1D1D6]">Payment completed</span>
                </div>
                <span className="font-semibold text-white tnum">
                  {formatCurrency(s.amount, currency)}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
