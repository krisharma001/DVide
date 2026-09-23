import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import { ArrowRight, CheckCircle2, Sparkles, Send, ShieldCheck, History, Crown } from 'lucide-react';
import { SettlementTransfer, SettlementRecord, MemberBalance } from '../../types';
import confetti from 'canvas-confetti';

interface SettlementMatrixProps {
  transfers: SettlementTransfer[];
  settlements: SettlementRecord[];
  memberBalances: MemberBalance[];
  currency: string;
  currentUserId: string;
  adminUserId?: string;
  onRecordSettlement: (transfer: { from_user_id: string; to_user_id: string; amount: number }) => void;
}

import { cleanMemberName } from '../../lib/store';

export const SettlementMatrix: React.FC<SettlementMatrixProps> = ({
  transfers,
  settlements,
  memberBalances,
  currency,
  currentUserId,
  adminUserId,
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
    <div className="space-y-6 pb-28">
      {/* Header Summary */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Settle Up</h2>
        <p className="text-xs text-[#8E8E93] mt-1 max-w-xs mx-auto">
          Optimized with minimal transactions so everyone gets squared away simply.
        </p>
      </div>

      {/* Suggested Payment Route Capsules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
            Recommended Transfers ({transfers.length})
          </span>
          <Badge variant="glass" size="sm" icon={<Sparkles size={11} className="text-ios-blue" />}>
            Auto-Simplified
          </Badge>
        </div>

        {transfers.length === 0 ? (
          <GlassCard variant="sunken" className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#30D158]/15 border border-[#30D158]/20 flex items-center justify-center mx-auto text-[#30D158]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">All Settled Up!</h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                No one owes anyone money in this room right now.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t, idx) => {
              const isDebtorMe = t.from_user_id === currentUserId;
              const isCreditorMe = t.to_user_id === currentUserId;
              const fromClean = cleanMemberName(t.from_name);
              const toClean = cleanMemberName(t.to_name);

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
                          {fromClean} {isDebtorMe && <span className="text-[#8E8E93] font-normal">(You)</span>}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">Payer</span>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="text-ios-blue" />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white truncate">
                          {toClean} {isCreditorMe && <span className="text-[#8E8E93] font-normal">(You)</span>}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">Recipient</span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-base font-bold text-white tnum">
                        {formatCurrency(t.amount, currency)}
                      </span>

                      {/* 1-Tap UPI Payment Deep Link (for India ₹ currency) */}
                      {currency === '₹' && isDebtorMe && (
                        <a
                          href={`upi://pay?pn=${encodeURIComponent(
                            toClean
                          )}&am=${t.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
                            'DVide Settlement'
                          )}`}
                          className="px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white border border-white/[0.12] transition-colors ios-touch flex items-center gap-1"
                        >
                          <span>UPI</span>
                        </a>
                      )}

                      {/* Settle Action Button */}
                      {(isDebtorMe || isCreditorMe) && (
                        <button
                          type="button"
                          onClick={() => setSettlingTransfer(t)}
                          className="px-3 py-1.5 rounded-xl bg-ios-blue hover:bg-[#0071EB] text-xs font-semibold text-white transition-colors ios-touch flex items-center gap-1 shadow-sm"
                        >
                          <Send size={12} />
                          <span>Settle</span>
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Net Position Breakdown by Member */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
          Net Position by Member
        </span>
        <div className="space-y-2">
          {memberBalances.map((m) => {
            const isMe = m.user_id === currentUserId;
            const isPos = m.net_balance > 0.009;
            const isNeg = m.net_balance < -0.009;
            const cleanName = cleanMemberName(m.display_name);

                  const isCreatorAdmin = Boolean(adminUserId && m.user_id === adminUserId);

                  return (
                    <GlassCard
                      key={m.user_id}
                      variant="sunken"
                      className="p-3 px-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0 border ${
                          isCreatorAdmin ? 'border-amber-400/40 ring-1 ring-amber-400/20' : 'border-white/10'
                        }`}>
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-white font-bold flex items-center justify-center h-full">
                              {cleanName[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{cleanName}</span>
                            {isCreatorAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30">
                                <Crown size={8} className="text-amber-400 fill-amber-400/30" />
                                Admin
                              </span>
                            )}
                            {isMe && <span className="text-[#8E8E93] font-normal text-[11px]">(You)</span>}
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
