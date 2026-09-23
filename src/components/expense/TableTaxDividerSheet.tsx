import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Badge } from '../ui/Badge';
import {
  calculateTableTaxDistribution,
  formatCurrency,
} from '../../lib/calculations';
import { Calculator, Receipt, Users, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { Expense, RoomMember, ExpenseSplit } from '../../types';

interface TableTaxDividerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  members: RoomMember[];
  expenses: Expense[];
  currentUserId: string;
  currency: string;
  onApplyTableTax: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
}

export const TableTaxDividerSheet: React.FC<TableTaxDividerSheetProps> = ({
  isOpen,
  onClose,
  members,
  expenses,
  currentUserId,
  currency,
  onApplyTableTax,
}) => {
  // Compute personal orders/expenses per member in this room
  const membersSpending = useMemo(() => {
    // Tally up expenses by paid_by or where someone has an itemized personal share
    const spendMap = new Map<string, number>();
    members.forEach((m) => spendMap.set(m.user_id, 0));

    expenses.forEach((e) => {
      // If it's a personal single-person item or expense
      if (e.splits && e.splits.length > 0) {
        e.splits.forEach((s) => {
          const current = spendMap.get(s.user_id) || 0;
          spendMap.set(s.user_id, current + s.amount);
        });
      } else {
        const current = spendMap.get(e.paid_by_user_id) || 0;
        spendMap.set(e.paid_by_user_id, current + e.subtotal);
      }
    });

    return members.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name,
      spending: spendMap.get(m.user_id) || 0,
    }));
  }, [members, expenses]);

  // Tax inputs
  const [taxMode, setTaxMode] = useState<'percent' | 'flat'>('percent');
  const [taxRateStr, setTaxRateStr] = useState('18');
  const [flatTaxStr, setFlatTaxStr] = useState('0');

  const [serviceChargeStr, setServiceChargeStr] = useState('0');
  const [tipStr, setTipStr] = useState('0');
  const [taxSplitMethod, setTaxSplitMethod] = useState<'proportional' | 'equal'>('proportional');
  const [billPayerId, setBillPayerId] = useState<string>(currentUserId);

  const rawTaxRate = taxMode === 'percent' ? parseFloat(taxRateStr) || 0 : 0;
  const rawFlatTax = taxMode === 'flat' ? parseFloat(flatTaxStr) || 0 : 0;
  const rawServiceCharge = parseFloat(serviceChargeStr) || 0;
  const rawTip = parseFloat(tipStr) || 0;

  // Live calculation
  const distribution = useMemo(() => {
    return calculateTableTaxDistribution({
      membersSpending,
      taxRatePercent: rawTaxRate,
      flatTaxAmount: rawFlatTax,
      serviceChargePercent: 0,
      flatServiceCharge: rawServiceCharge,
      tipAmount: rawTip,
      splitMethod: taxSplitMethod,
    });
  }, [membersSpending, rawTaxRate, rawFlatTax, rawServiceCharge, rawTip, taxSplitMethod]);

  const totalTaxAndCharges = distribution.taxAmount + distribution.serviceChargeAmount + distribution.tipAmount;

  const handleApply = () => {
    if (totalTaxAndCharges <= 0) return;

    // Create splits representing each person's tax & charge allocation
    const splits: ExpenseSplit[] = distribution.memberBreakdown.map((m) => {
      const extraCharges = m.allocatedTax + m.allocatedServiceCharge + m.allocatedTip;
      return {
        id: `split_tax_${m.userId}_${Date.now()}`,
        expense_id: '',
        user_id: m.userId,
        amount: 0,
        tax_amount: extraCharges,
        total_share: extraCharges,
      };
    });

    onApplyTableTax({
      room_id: members[0]?.room_id || '',
      created_by: currentUserId,
      description: `Table Tax & Surcharges (${taxMode === 'percent' ? `${rawTaxRate}%` : `${currency}${rawFlatTax}`}${rawTip > 0 ? ` + Tip` : ''})`,
      category: 'food',
      subtotal: 0,
      tax_rate: rawTaxRate,
      tax_amount: distribution.taxAmount,
      tax_type: 'added',
      tax_split_method: taxSplitMethod,
      service_charge: distribution.serviceChargeAmount,
      tip: distribution.tipAmount,
      discount: 0,
      total_amount: totalTaxAndCharges,
      currency,
      paid_by_user_id: billPayerId,
      split_method: taxSplitMethod === 'proportional' ? 'percentage' : 'equal',
      splits,
    });

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Table Bill & Tax Divider"
      subtitle="Auto-distribute the restaurant receipt tax across members"
      actionButton={
        <button
          type="button"
          disabled={totalTaxAndCharges <= 0}
          onClick={handleApply}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ios-touch shadow-lg text-sm flex items-center justify-center gap-1.5"
        >
          <ShieldCheck size={16} />
          <span>Apply {formatCurrency(totalTaxAndCharges, currency)} Table Tax to Room</span>
        </button>
      }
    >
      <div className="space-y-5 pb-2">
        {/* Concept Explanation Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#8E8E93] flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#30D158] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Members added their individual orders. Enter the restaurant's tax & tip from the final bill below.
            DVide will divide the tax fairly based on what each person ordered.
          </p>
        </div>

        {/* Members Personal Subtotals List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              Personal Spending ({membersSpending.length} members)
            </span>
            <span className="text-xs font-medium text-white tnum">
              Subtotal: {formatCurrency(distribution.totalPersonalSpending, currency)}
            </span>
          </div>

          <div className="space-y-1.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.06]">
            {membersSpending.map((m) => (
              <div key={m.userId} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/[0.03]">
                <span className="text-white font-medium">{m.displayName}</span>
                <span className="text-[#D1D1D6] font-semibold tnum">
                  {formatCurrency(m.spending, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Bill Tax Input */}
        <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-ios-blue" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Restaurant Bill Tax
              </span>
            </div>

            <SegmentedControl
              size="sm"
              options={[
                { value: 'percent', label: 'Rate %' },
                { value: 'flat', label: `Flat ${currency}` },
              ]}
              value={taxMode}
              onChange={(val) => setTaxMode(val as 'percent' | 'flat')}
              className="w-36"
            />
          </div>

          {taxMode === 'percent' ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#8E8E93]">Tax Rate (GST / VAT)</span>
              <div className="flex items-center gap-1 w-28">
                <input
                  type="number"
                  step="0.5"
                  value={taxRateStr}
                  onChange={(e) => setTaxRateStr(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg glass-input text-right text-xs tnum"
                />
                <span className="text-xs text-[#8E8E93] font-medium">%</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#8E8E93]">Tax Amount on Receipt</span>
              <div className="flex items-center gap-1 w-28">
                <span className="text-xs text-[#8E8E93] font-medium">{currency}</span>
                <input
                  type="number"
                  step="1"
                  value={flatTaxStr}
                  onChange={(e) => setFlatTaxStr(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg glass-input text-right text-xs tnum"
                />
              </div>
            </div>
          )}

          {/* Surcharge & Tip */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <div>
              <label className="text-[11px] text-[#8E8E93] block mb-1">Service Charge ({currency})</label>
              <input
                type="number"
                placeholder="0"
                value={serviceChargeStr}
                onChange={(e) => setServiceChargeStr(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg glass-input text-right text-xs tnum"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#8E8E93] block mb-1">Tip Amount ({currency})</label>
              <input
                type="number"
                placeholder="0"
                value={tipStr}
                onChange={(e) => setTipStr(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg glass-input text-right text-xs tnum"
              />
            </div>
          </div>

          {/* Split Mode: Proportional vs Equal */}
          <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
            <label className="text-[11px] text-[#8E8E93] block">Tax Split Method</label>
            <SegmentedControl
              size="sm"
              options={[
                { value: 'proportional', label: 'Proportional to spending (Fair)' },
                { value: 'equal', label: 'Equal across members' },
              ]}
              value={taxSplitMethod}
              onChange={(val) => setTaxSplitMethod(val as 'proportional' | 'equal')}
            />
          </div>

          {/* Who swiped / paid the restaurant bill */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="text-[11px] text-[#8E8E93] block mb-1.5">
              Who paid the restaurant receipt?
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {members.map((m) => {
                const isSelected = billPayerId === m.user_id;
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => setBillPayerId(m.user_id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition-all ${
                      isSelected
                        ? 'bg-ios-blue text-white border-ios-blue'
                        : 'bg-white/[0.04] text-[#8E8E93] border-white/[0.06]'
                    }`}
                  >
                    <span>{m.display_name}</span>
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Calculation Output Breakdown */}
        {totalTaxAndCharges > 0 && (
          <div className="bg-black/60 p-4 rounded-2xl border border-white/[0.1] space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.08]">
              <span className="text-[#8E8E93]">Total Bill to Reconcile</span>
              <span className="text-base font-bold text-white tnum">
                {formatCurrency(distribution.grandTotal, currency)}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Each Member's Final Share:
              </span>
              {distribution.memberBreakdown.map((m) => (
                <div key={m.userId} className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/[0.02]">
                  <div>
                    <span className="text-white font-medium block">{m.displayName}</span>
                    <span className="text-[10px] text-[#8E8E93]">
                      Personal: {formatCurrency(m.personalSpending, currency)} + Tax:{' '}
                      {formatCurrency(m.allocatedTax + m.allocatedServiceCharge + m.allocatedTip, currency)}
                    </span>
                  </div>
                  <span className="font-bold text-white tnum text-sm">
                    {formatCurrency(m.totalShare, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
