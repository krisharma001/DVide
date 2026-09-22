import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import {
  calculateExpenseTotals,
  calculateSplits,
  formatCurrency,
} from '../../lib/calculations';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  Ticket,
  ShoppingCart,
  Receipt,
  Percent,
  Calculator,
  Users,
  ChevronDown,
} from 'lucide-react';
import {
  Expense,
  RoomMember,
  ExpenseCategory,
  SplitMethod,
  TaxSplitMethod,
  TaxType,
} from '../../types';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  members: RoomMember[];
  currentUserId: string;
  currency: string;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
}

export const AddExpenseSheet: React.FC<AddExpenseSheetProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  currency,
  onAddExpense,
}) => {
  // Form State
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidByUserId, setPaidByUserId] = useState<string>(currentUserId);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    members.map((m) => m.user_id)
  );

  // Split Method
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [customValues, setCustomValues] = useState<Record<string, number>>({});

  // Tax Divider State
  const [hasTax, setHasTax] = useState(false);
  const [taxRateStr, setTaxRateStr] = useState('18');
  const [taxType, setTaxType] = useState<TaxType>('added');
  const [taxSplitMethod, setTaxSplitMethod] = useState<TaxSplitMethod>('equal');
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [serviceChargeStr, setServiceChargeStr] = useState('0');
  const [tipStr, setTipStr] = useState('0');
  const [discountStr, setDiscountStr] = useState('0');

  const categories: { id: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'food', label: 'Food', icon: <Utensils size={14} /> },
    { id: 'transport', label: 'Ride', icon: <Car size={14} /> },
    { id: 'groceries', label: 'Groceries', icon: <ShoppingCart size={14} /> },
    { id: 'hotel', label: 'Stay', icon: <Home size={14} /> },
    { id: 'entertainment', label: 'Fun', icon: <Film size={14} /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket size={14} /> },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag size={14} /> },
    { id: 'other', label: 'Other', icon: <Receipt size={14} /> },
  ];

  // Raw numeric parsing
  const rawAmount = parseFloat(amountStr) || 0;
  const rawTaxRate = hasTax ? parseFloat(taxRateStr) || 0 : 0;
  const rawServiceCharge = parseFloat(serviceChargeStr) || 0;
  const rawTip = parseFloat(tipStr) || 0;
  const rawDiscount = parseFloat(discountStr) || 0;

  // Live calculated financial totals
  const totals = useMemo(() => {
    return calculateExpenseTotals({
      amount: rawAmount,
      taxRate: rawTaxRate,
      taxType,
      serviceCharge: rawServiceCharge,
      tip: rawTip,
      discount: rawDiscount,
    });
  }, [rawAmount, rawTaxRate, taxType, rawServiceCharge, rawTip, rawDiscount]);

  // Live calculated split shares
  const calculatedSplits = useMemo(() => {
    if (selectedUserIds.length === 0 || totals.totalAmount <= 0) return [];

    const participantInputs = selectedUserIds.map((uid) => ({
      userId: uid,
      value: customValues[uid] ?? (splitMethod === 'equal' ? 1 : 0),
    }));

    return calculateSplits({
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      serviceCharge: totals.serviceCharge,
      tip: totals.tip,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      participants: participantInputs,
      splitMethod,
      taxSplitMethod,
    });
  }, [selectedUserIds, totals, splitMethod, taxSplitMethod, customValues]);

  // Member toggle
  const toggleMember = (uid: string) => {
    if (selectedUserIds.includes(uid)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== uid));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, uid]);
    }
  };

  const handleCustomValueChange = (uid: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomValues((prev) => ({ ...prev, [uid]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || rawAmount <= 0) return;

    onAddExpense({
      room_id: members[0]?.room_id || '',
      created_by: currentUserId,
      description: description.trim(),
      category,
      subtotal: totals.subtotal,
      tax_rate: rawTaxRate,
      tax_amount: totals.taxAmount,
      tax_type: taxType,
      tax_split_method: taxSplitMethod,
      service_charge: totals.serviceCharge,
      tip: totals.tip,
      discount: totals.discount,
      total_amount: totals.totalAmount,
      currency,
      paid_by_user_id: paidByUserId,
      split_method: splitMethod,
      splits: calculatedSplits,
    });

    // Reset Form
    setDescription('');
    setAmountStr('');
    setHasTax(false);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      subtitle="Split bills with automatic tax calculation"
      actionButton={
        <button
          type="button"
          disabled={!description.trim() || rawAmount <= 0}
          onClick={handleSubmit}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ios-touch shadow-lg text-sm"
        >
          Add {formatCurrency(totals.totalAmount, currency)} Expense
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-2">
        {/* Description & Amount Hero */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
              What was it?
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fisherman's Wharf Dinner, Uber"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl glass-input text-sm font-medium text-white placeholder:text-[#636366]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
              Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-semibold text-[#8E8E93]">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-13 pl-9 pr-3.5 rounded-xl glass-input text-2xl font-bold text-white tnum placeholder:text-[#636366]"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div>
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-2">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ios-touch ${
                    isSelected
                      ? 'bg-[#3A3A3C] border-white/30 text-white shadow-sm'
                      : 'bg-white/[0.04] border-white/[0.06] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <span className="mb-1">{cat.icon}</span>
                  <span className="text-[11px] truncate w-full text-center">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid By Selector */}
        <div>
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
            Paid by
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {members.map((m) => {
              const isPayer = paidByUserId === m.user_id;
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setPaidByUserId(m.user_id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 transition-all ios-touch ${
                    isPayer
                      ? 'bg-ios-blue text-white border-ios-blue shadow-sm'
                      : 'bg-white/[0.04] border-white/[0.08] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-white flex items-center justify-center h-full">
                        {m.display_name[0]}
                      </span>
                    )}
                  </div>
                  <span>{m.display_name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Between Multi-Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              Split between ({selectedUserIds.length} members)
            </label>
            <button
              type="button"
              onClick={() => setSelectedUserIds(members.map((m) => m.user_id))}
              className="text-[11px] text-ios-blue font-medium hover:underline"
            >
              Select All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => {
              const isSelected = selectedUserIds.includes(m.user_id);
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleMember(m.user_id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition-all ios-touch ${
                    isSelected
                      ? 'bg-white/[0.09] border-white/25 text-white font-medium'
                      : 'bg-white/[0.02] border-white/[0.05] text-[#636366]'
                  }`}
                >
                  <span className="truncate">{m.display_name}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                      isSelected
                        ? 'bg-ios-blue border-ios-blue text-white'
                        : 'border-white/20 bg-transparent'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Method Tabs */}
        <div>
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
            Split Method
          </label>
          <SegmentedControl
            options={[
              { value: 'equal', label: 'Equal' },
              { value: 'percentage', label: 'Percentage' },
              { value: 'shares', label: 'Shares' },
              { value: 'exact', label: 'Exact' },
            ]}
            value={splitMethod}
            onChange={(val) => setSplitMethod(val as SplitMethod)}
          />

          {/* Custom values inputs if not equal */}
          {splitMethod !== 'equal' && (
            <div className="mt-3 space-y-2 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
              {selectedUserIds.map((uid) => {
                const member = members.find((m) => m.user_id === uid);
                return (
                  <div key={uid} className="flex items-center justify-between text-xs">
                    <span className="text-[#D1D1D6] font-medium">{member?.display_name}</span>
                    <div className="flex items-center gap-1 w-28">
                      <input
                        type="number"
                        placeholder="0"
                        value={customValues[uid] ?? ''}
                        onChange={(e) => handleCustomValueChange(uid, e.target.value)}
                        className="w-full h-8 px-2 rounded-lg glass-input text-right text-xs tnum"
                      />
                      <span className="text-[#8E8E93] shrink-0 font-medium">
                        {splitMethod === 'percentage'
                          ? '%'
                          : splitMethod === 'shares'
                          ? 'sh'
                          : currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tax Divider Section */}
        <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-ios-green" />
              <div>
                <span className="text-xs font-semibold text-white block">Tax Divider</span>
                <span className="text-[11px] text-[#8E8E93] block">
                  Automatic GST/VAT calculation
                </span>
              </div>
            </div>
            <Switch checked={hasTax} onChange={setHasTax} id="tax-toggle" />
          </div>

          {hasTax && (
            <div className="space-y-3 pt-2 border-t border-white/[0.06] animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#8E8E93]">Tax Rate</span>
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    step="0.5"
                    value={taxRateStr}
                    onChange={(e) => setTaxRateStr(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg glass-input text-right text-xs tnum"
                  />
                  <span className="text-xs text-[#8E8E93] font-medium">%</span>
                </div>
              </div>

              {/* Tax Type: Added vs Included */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E8E93]">Tax Mode</span>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: 'added', label: 'Added' },
                    { value: 'included', label: 'Included' },
                  ]}
                  value={taxType}
                  onChange={(val) => setTaxType(val as TaxType)}
                  className="w-36"
                />
              </div>

              {/* Tax Split Method */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E8E93]">Tax Split</span>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: 'equal', label: 'Equal' },
                    { value: 'proportional', label: 'Proportional' },
                  ]}
                  value={taxSplitMethod}
                  onChange={(val) => setTaxSplitMethod(val as TaxSplitMethod)}
                  className="w-44"
                />
              </div>
            </div>
          )}

          {/* Surcharges Toggle Accordion */}
          <div className="pt-1 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => setShowAdditionalCharges(!showAdditionalCharges)}
              className="flex items-center justify-between w-full text-xs text-[#8E8E93] hover:text-white transition-colors"
            >
              <span>Tip, Service Charge & Discount</span>
              <ChevronDown
                size={14}
                className={`transform transition-transform ${
                  showAdditionalCharges ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdditionalCharges && (
              <div className="mt-3 space-y-2 pt-2 border-t border-white/[0.04] animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Tip Amount</span>
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-[#8E8E93]">{currency}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={tipStr}
                      onChange={(e) => setTipStr(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg glass-input text-right text-xs tnum"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Service Charge</span>
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-[#8E8E93]">{currency}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={serviceChargeStr}
                      onChange={(e) => setServiceChargeStr(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg glass-input text-right text-xs tnum"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Discount</span>
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-[#8E8E93]">{currency}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg glass-input text-right text-xs tnum"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Calculation Summary Ticket */}
        {rawAmount > 0 && (
          <div className="bg-black/50 p-3.5 rounded-xl border border-white/[0.08] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#8E8E93]">
              <span>Subtotal</span>
              <span className="tnum font-medium text-white">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Tax ({rawTaxRate}%)</span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(totals.taxAmount, currency)}
                </span>
              </div>
            )}
            {totals.tip > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Tip</span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(totals.tip, currency)}
                </span>
              </div>
            )}
            {totals.serviceCharge > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Service Charge</span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(totals.serviceCharge, currency)}
                </span>
              </div>
            )}
            {totals.discount > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Discount</span>
                <span className="tnum font-medium text-ios-green">
                  -{formatCurrency(totals.discount, currency)}
                </span>
              </div>
            )}

            <div className="h-[0.5px] bg-white/[0.1] my-1" />

            <div className="flex justify-between font-semibold text-white text-sm">
              <span>Total to Split</span>
              <span className="tnum">{formatCurrency(totals.totalAmount, currency)}</span>
            </div>

            {calculatedSplits.length > 0 && splitMethod === 'equal' && (
              <div className="text-[11px] text-[#8E8E93] text-right pt-0.5">
                ≈ {formatCurrency(calculatedSplits[0]?.total_share || 0, currency)} per person
              </div>
            )}
          </div>
        )}
      </form>
    </BottomSheet>
  );
};
