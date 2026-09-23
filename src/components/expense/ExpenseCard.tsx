import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  Ticket,
  ShoppingCart,
  Receipt,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Expense, RoomMember } from '../../types';
import { cleanMemberName } from '../../lib/store';

interface ExpenseCardProps {
  expense: Expense;
  members: RoomMember[];
  currentUserId: string;
  currency: string;
  onDelete?: (id: string) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  members,
  currentUserId,
  currency,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Utensils size={18} className="text-ios-orange" />;
      case 'transport':
        return <Car size={18} className="text-ios-blue" />;
      case 'hotel':
        return <Home size={18} className="text-ios-purple" />;
      case 'shopping':
        return <ShoppingBag size={18} className="text-[#FF2D55]" />;
      case 'entertainment':
        return <Film size={18} className="text-ios-yellow" />;
      case 'tickets':
        return <Ticket size={18} className="text-ios-teal" />;
      case 'groceries':
        return <ShoppingCart size={18} className="text-ios-green" />;
      default:
        return <Receipt size={18} className="text-[#8E8E93]" />;
    }
  };

  const payer = members.find((m) => m.user_id === expense.paid_by_user_id);
  const isPayerMe = expense.paid_by_user_id === currentUserId;

  // Find my personal split share in this expense
  const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
  const myShareAmount = mySplit ? mySplit.total_share : 0;

  // Date formatting
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(expense.created_at));

  return (
    <GlassCard
      variant="surface"
      className="p-4 border border-white/[0.08] hover:border-white/[0.14] transition-all"
    >
      {/* Top Header Row */}
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Category Squircle Icon */}
          <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            {getCategoryIcon(expense.category)}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight">
              {expense.description}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8E8E93]">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>Paid by {isPayerMe ? 'You' : payer?.display_name || 'Member'}</span>
            </div>
          </div>
        </div>

        {/* Right Amount & Badge */}
        <div className="text-right shrink-0">
          <span className="text-base font-bold text-white tnum block">
            {formatCurrency(expense.total_amount, currency)}
          </span>

          <div className="mt-1">
            {isPayerMe ? (
              <Badge variant="success" size="sm">
                You paid
              </Badge>
            ) : myShareAmount > 0 ? (
              <Badge variant="danger" size="sm">
                You owe {formatCurrency(myShareAmount, currency)}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Not involved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Breakdown Drawer */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-3 text-xs animate-in fade-in duration-200">
          {/* Tax & Subtotal details */}
          <div className="bg-black/30 p-3 rounded-xl space-y-1.5 border border-white/[0.04]">
            <div className="flex justify-between text-[#8E8E93]">
              <span>Subtotal</span>
              <span className="tnum font-medium text-white">
                {formatCurrency(expense.subtotal, currency)}
              </span>
            </div>

            {expense.tax_amount > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>
                  Tax ({expense.tax_rate}%, {expense.tax_split_method} split)
                </span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(expense.tax_amount, currency)}
                </span>
              </div>
            )}

            {expense.service_charge > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Service Charge</span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(expense.service_charge, currency)}
                </span>
              </div>
            )}

            {expense.tip > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Tip</span>
                <span className="tnum font-medium text-white">
                  +{formatCurrency(expense.tip, currency)}
                </span>
              </div>
            )}

            {expense.discount > 0 && (
              <div className="flex justify-between text-[#8E8E93]">
                <span>Discount</span>
                <span className="tnum font-medium text-[#30D158]">
                  -{formatCurrency(expense.discount, currency)}
                </span>
              </div>
            )}

            <div className="h-[0.5px] bg-white/[0.08] my-1" />

            <div className="flex justify-between font-semibold text-white">
              <span>Total</span>
              <span className="tnum text-sm">
                {formatCurrency(expense.total_amount, currency)}
              </span>
            </div>
          </div>

          {/* Participant Split Breakdown */}
          {expense.splits && expense.splits.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-2">
                Split Distribution ({expense.split_method})
              </span>
              <div className="space-y-1.5">
                {expense.splits.map((s) => {
                  const m = members.find((mem) => mem.user_id === s.user_id);
                  const isMe = s.user_id === currentUserId;
                  const cleanName = cleanMemberName(m?.display_name);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/[0.03]"
                    >
                      <span className={isMe ? 'text-white font-medium' : 'text-[#D1D1D6]'}>
                        {cleanName} {isMe && <span className="text-[#8E8E93] font-normal">(You)</span>}
                      </span>
                      <span className="tnum font-semibold text-white">
                        {formatCurrency(s.total_share, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delete Action */}
          {onDelete && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(expense.id);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-[#FF453A] hover:text-[#FF6961] p-1.5 rounded-md hover:bg-[#FF453A]/10 transition-colors ios-touch"
              >
                <Trash2 size={13} />
                <span>Delete Expense</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tiny expand hint chevron */}
      <div
        className="mt-1 flex justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDown
          size={14}
          className={`transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
    </GlassCard>
  );
};
