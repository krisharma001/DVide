import type { SplitMethod, TaxSplitMethod, TaxType, Expense, ExpenseSplit, MemberBalance, RoomSummary, RoomMember } from '../types/index.ts';

/**
 * Converts a floating currency number to integer minor units (e.g., 24.50 -> 2450 paise/cents)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts integer minor units back to standard 2-decimal currency number
 */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Formats a currency amount nicely with system symbol (defaults to ₹)
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${currency}${formatted}`;
}

/**
 * Calculates total and tax breakdown based on subtotal, tax rate, and additional charges.
 */
export function calculateExpenseTotals(params: {
  amount: number; // raw input amount
  taxRate: number; // e.g. 18 for 18%
  taxType: TaxType; // 'added' | 'included'
  serviceCharge: number;
  tip: number;
  discount: number;
}): {
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  tip: number;
  discount: number;
  totalAmount: number;
} {
  const taxRatePercent = Math.max(0, params.taxRate);
  const discountMinor = toMinorUnits(Math.max(0, params.discount));
  const serviceChargeMinor = toMinorUnits(Math.max(0, params.serviceCharge));
  const tipMinor = toMinorUnits(Math.max(0, params.tip));

  if (params.taxType === 'included') {
    // Input amount is the total of subtotal + tax
    const grossMinor = toMinorUnits(Math.max(0, params.amount));
    const subtotalMinor = Math.round(grossMinor / (1 + taxRatePercent / 100));
    const taxMinor = grossMinor - subtotalMinor;
    const finalTotalMinor = grossMinor - discountMinor + serviceChargeMinor + tipMinor;

    return {
      subtotal: fromMinorUnits(subtotalMinor),
      taxAmount: fromMinorUnits(taxMinor),
      serviceCharge: fromMinorUnits(serviceChargeMinor),
      tip: fromMinorUnits(tipMinor),
      discount: fromMinorUnits(discountMinor),
      totalAmount: fromMinorUnits(Math.max(0, finalTotalMinor)),
    };
  } else {
    // Tax added on top of subtotal
    const subtotalMinor = toMinorUnits(Math.max(0, params.amount));
    const taxMinor = Math.round((subtotalMinor * taxRatePercent) / 100);
    const finalTotalMinor = subtotalMinor - discountMinor + taxMinor + serviceChargeMinor + tipMinor;

    return {
      subtotal: fromMinorUnits(subtotalMinor),
      taxAmount: fromMinorUnits(taxMinor),
      serviceCharge: fromMinorUnits(serviceChargeMinor),
      tip: fromMinorUnits(tipMinor),
      discount: fromMinorUnits(discountMinor),
      totalAmount: fromMinorUnits(Math.max(0, finalTotalMinor)),
    };
  }
}

/**
 * Distributes an integer amount in minor units among N participants with deterministic residual distribution.
 * E.g., 10000 paise / 3 -> [3334, 3333, 3333]
 */
export function distributeMinorUnitsEqually(totalMinor: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalMinor / count);
  const remainder = totalMinor % count;

  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(base + (i < remainder ? 1 : 0));
  }
  return result;
}

export interface SplitParticipantInput {
  userId: string;
  value?: number; // percentage, exact amount, or shares depending on method
}

/**
 * Calculates individual splits with exact reconciliation down to the minor unit.
 */
export function calculateSplits(params: {
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  tip: number;
  discount: number;
  totalAmount: number;
  participants: SplitParticipantInput[];
  splitMethod: SplitMethod;
  taxSplitMethod: TaxSplitMethod;
}): ExpenseSplit[] {
  const { participants, splitMethod, taxSplitMethod } = params;
  if (!participants.length) return [];

  // Base net amount being split (subtotal - discount + serviceCharge + tip)
  // Tax is calculated separately per taxSplitMethod, or bundled
  const totalMinor = toMinorUnits(params.totalAmount);
  const taxMinor = toMinorUnits(params.taxAmount);
  const baseSplitTargetMinor = totalMinor - taxMinor;

  const splits: ExpenseSplit[] = [];

  if (splitMethod === 'equal') {
    const baseShares = distributeMinorUnitsEqually(baseSplitTargetMinor, participants.length);
    const taxShares =
      taxSplitMethod === 'equal'
        ? distributeMinorUnitsEqually(taxMinor, participants.length)
        : distributeMinorUnitsEqually(taxMinor, participants.length); // For equal split, proportional = equal

    participants.forEach((p, idx) => {
      const baseShare = baseShares[idx];
      const taxShare = taxShares[idx];
      splits.push({
        id: `split_${p.userId}_${Date.now()}`,
        expense_id: '',
        user_id: p.userId,
        amount: fromMinorUnits(baseShare),
        tax_amount: fromMinorUnits(taxShare),
        total_share: fromMinorUnits(baseShare + taxShare),
      });
    });
  } else if (splitMethod === 'percentage') {
    // Percentages: scale by percentage
    let accumulatedBaseMinor = 0;
    const baseShares: number[] = [];

    participants.forEach((p, idx) => {
      if (idx === participants.length - 1) {
        // Last person receives the exact remaining cents
        baseShares.push(baseSplitTargetMinor - accumulatedBaseMinor);
      } else {
        const pct = (p.value || 0) / 100;
        const share = Math.round(baseSplitTargetMinor * pct);
        baseShares.push(share);
        accumulatedBaseMinor += share;
      }
    });

    // Tax distribution
    let accumulatedTaxMinor = 0;
    const taxShares: number[] = [];

    if (taxSplitMethod === 'equal') {
      taxShares.push(...distributeMinorUnitsEqually(taxMinor, participants.length));
    } else {
      // Proportional to base share
      participants.forEach((p, idx) => {
        if (idx === participants.length - 1) {
          taxShares.push(taxMinor - accumulatedTaxMinor);
        } else {
          const ratio = baseSplitTargetMinor > 0 ? baseShares[idx] / baseSplitTargetMinor : 1 / participants.length;
          const share = Math.round(taxMinor * ratio);
          taxShares.push(share);
          accumulatedTaxMinor += share;
        }
      });
    }

    participants.forEach((p, idx) => {
      splits.push({
        id: `split_${p.userId}_${Date.now()}`,
        expense_id: '',
        user_id: p.userId,
        amount: fromMinorUnits(baseShares[idx]),
        tax_amount: fromMinorUnits(taxShares[idx]),
        total_share: fromMinorUnits(baseShares[idx] + taxShares[idx]),
      });
    });
  } else if (splitMethod === 'shares') {
    const totalWeight = participants.reduce((sum, p) => sum + (p.value || 1), 0) || 1;
    let accumulatedBaseMinor = 0;
    const baseShares: number[] = [];

    participants.forEach((p, idx) => {
      if (idx === participants.length - 1) {
        baseShares.push(baseSplitTargetMinor - accumulatedBaseMinor);
      } else {
        const weight = p.value || 1;
        const share = Math.round((baseSplitTargetMinor * weight) / totalWeight);
        baseShares.push(share);
        accumulatedBaseMinor += share;
      }
    });

    let accumulatedTaxMinor = 0;
    const taxShares: number[] = [];

    if (taxSplitMethod === 'equal') {
      taxShares.push(...distributeMinorUnitsEqually(taxMinor, participants.length));
    } else {
      participants.forEach((p, idx) => {
        if (idx === participants.length - 1) {
          taxShares.push(taxMinor - accumulatedTaxMinor);
        } else {
          const ratio = baseSplitTargetMinor > 0 ? baseShares[idx] / baseSplitTargetMinor : 1 / participants.length;
          const share = Math.round(taxMinor * ratio);
          taxShares.push(share);
          accumulatedTaxMinor += share;
        }
      });
    }

    participants.forEach((p, idx) => {
      splits.push({
        id: `split_${p.userId}_${Date.now()}`,
        expense_id: '',
        user_id: p.userId,
        amount: fromMinorUnits(baseShares[idx]),
        tax_amount: fromMinorUnits(taxShares[idx]),
        total_share: fromMinorUnits(baseShares[idx] + taxShares[idx]),
      });
    });
  } else {
    // Exact amounts
    const taxShares = distributeMinorUnitsEqually(taxMinor, participants.length);
    participants.forEach((p, idx) => {
      const baseMinor = toMinorUnits(p.value || 0);
      const taxShare = taxShares[idx];
      splits.push({
        id: `split_${p.userId}_${Date.now()}`,
        expense_id: '',
        user_id: p.userId,
        amount: fromMinorUnits(baseMinor),
        tax_amount: fromMinorUnits(taxShare),
        total_share: fromMinorUnits(baseMinor + taxShare),
      });
    });
  }

  return splits;
}

/**
 * Calculates personal balances for all members across all room expenses.
 */
export function calculateMemberBalances(
  members: RoomMember[],
  expenses: Expense[]
): MemberBalance[] {
  // Map of userId -> { paid: minorUnits, owed: minorUnits }
  const ledger = new Map<string, { paid: number; owed: number }>();

  members.forEach((m) => {
    ledger.set(m.user_id, { paid: 0, owed: 0 });
  });

  expenses.forEach((exp) => {
    const totalMinor = toMinorUnits(exp.total_amount);

    // Credit payer
    if (ledger.has(exp.paid_by_user_id)) {
      ledger.get(exp.paid_by_user_id)!.paid += totalMinor;
    } else {
      ledger.set(exp.paid_by_user_id, { paid: totalMinor, owed: 0 });
    }

    // Debit debtors according to splits
    if (exp.splits && exp.splits.length > 0) {
      exp.splits.forEach((s) => {
        const shareMinor = toMinorUnits(s.total_share);
        if (ledger.has(s.user_id)) {
          ledger.get(s.user_id)!.owed += shareMinor;
        } else {
          ledger.set(s.user_id, { paid: 0, owed: shareMinor });
        }
      });
    }
  });

  return members.map((m) => {
    const entry = ledger.get(m.user_id) || { paid: 0, owed: 0 };
    const netMinor = entry.paid - entry.owed;
    return {
      user_id: m.user_id,
      display_name: m.display_name,
      avatar_url: m.avatar_url,
      amount_paid: fromMinorUnits(entry.paid),
      amount_owed: fromMinorUnits(entry.owed),
      net_balance: fromMinorUnits(netMinor),
    };
  });
}

/**
 * Computes high-level aggregated room summary.
 */
export function calculateRoomSummary(members: RoomMember[], expenses: Expense[]): RoomSummary {
  let totalSpentMinor = 0;
  let totalTaxMinor = 0;
  let totalServiceMinor = 0;
  let totalTipsMinor = 0;
  let totalDiscountMinor = 0;

  expenses.forEach((exp) => {
    totalSpentMinor += toMinorUnits(exp.total_amount);
    totalTaxMinor += toMinorUnits(exp.tax_amount);
    totalServiceMinor += toMinorUnits(exp.service_charge);
    totalTipsMinor += toMinorUnits(exp.tip);
    totalDiscountMinor += toMinorUnits(exp.discount);
  });

  return {
    total_spent: fromMinorUnits(totalSpentMinor),
    total_tax: fromMinorUnits(totalTaxMinor),
    total_service_charges: fromMinorUnits(totalServiceMinor),
    total_tips: fromMinorUnits(totalTipsMinor),
    total_discounts: fromMinorUnits(totalDiscountMinor),
    expense_count: expenses.length,
    member_count: members.length,
  };
}

export interface MemberSpending {
  userId: string;
  displayName: string;
  spending: number;
}

export interface TableTaxResult {
  totalPersonalSpending: number;
  taxAmount: number;
  serviceChargeAmount: number;
  tipAmount: number;
  grandTotal: number;
  memberBreakdown: {
    userId: string;
    displayName: string;
    personalSpending: number;
    allocatedTax: number;
    allocatedServiceCharge: number;
    allocatedTip: number;
    totalShare: number;
  }[];
}

/**
 * Calculates Table Tax & Surcharges distribution over group members' individual personal orders.
 */
export function calculateTableTaxDistribution(params: {
  membersSpending: MemberSpending[];
  taxRatePercent: number;
  flatTaxAmount?: number;
  serviceChargePercent: number;
  flatServiceCharge?: number;
  tipAmount: number;
  splitMethod: 'proportional' | 'equal';
}): TableTaxResult {
  const { membersSpending, splitMethod } = params;
  const count = membersSpending.length;

  if (count === 0) {
    return {
      totalPersonalSpending: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      tipAmount: 0,
      grandTotal: 0,
      memberBreakdown: [],
    };
  }

  const totalPersonalMinor = membersSpending.reduce(
    (sum, m) => sum + toMinorUnits(Math.max(0, m.spending)),
    0
  );

  // Determine tax amount (flat amount if provided > 0, else percentage)
  const taxMinor =
    params.flatTaxAmount && params.flatTaxAmount > 0
      ? toMinorUnits(params.flatTaxAmount)
      : Math.round((totalPersonalMinor * Math.max(0, params.taxRatePercent)) / 100);

  // Determine service charge amount
  const serviceChargeMinor =
    params.flatServiceCharge && params.flatServiceCharge > 0
      ? toMinorUnits(params.flatServiceCharge)
      : Math.round((totalPersonalMinor * Math.max(0, params.serviceChargePercent)) / 100);

  const tipMinor = toMinorUnits(Math.max(0, params.tipAmount));
  const grandTotalMinor = totalPersonalMinor + taxMinor + serviceChargeMinor + tipMinor;

  // Distribute tax, service charge, and tip
  const allocatedTaxList: number[] = [];
  const allocatedServiceList: number[] = [];
  const allocatedTipList: number[] = [];

  if (splitMethod === 'equal' || totalPersonalMinor === 0) {
    allocatedTaxList.push(...distributeMinorUnitsEqually(taxMinor, count));
    allocatedServiceList.push(...distributeMinorUnitsEqually(serviceChargeMinor, count));
    allocatedTipList.push(...distributeMinorUnitsEqually(tipMinor, count));
  } else {
    // Proportional to personal spending
    let accTax = 0;
    let accService = 0;
    let accTip = 0;

    membersSpending.forEach((m, idx) => {
      if (idx === count - 1) {
        allocatedTaxList.push(taxMinor - accTax);
        allocatedServiceList.push(serviceChargeMinor - accService);
        allocatedTipList.push(tipMinor - accTip);
      } else {
        const mMinor = toMinorUnits(Math.max(0, m.spending));
        const ratio = mMinor / totalPersonalMinor;

        const tShare = Math.round(taxMinor * ratio);
        allocatedTaxList.push(tShare);
        accTax += tShare;

        const sShare = Math.round(serviceChargeMinor * ratio);
        allocatedServiceList.push(sShare);
        accService += sShare;

        const tipShare = Math.round(tipMinor * ratio);
        allocatedTipList.push(tipShare);
        accTip += tipShare;
      }
    });
  }

  const breakdown = membersSpending.map((m, idx) => {
    const personalMinor = toMinorUnits(Math.max(0, m.spending));
    const tMinor = allocatedTaxList[idx] || 0;
    const sMinor = allocatedServiceList[idx] || 0;
    const tipM = allocatedTipList[idx] || 0;
    const totalM = personalMinor + tMinor + sMinor + tipM;

    return {
      userId: m.userId,
      displayName: m.displayName,
      personalSpending: fromMinorUnits(personalMinor),
      allocatedTax: fromMinorUnits(tMinor),
      allocatedServiceCharge: fromMinorUnits(sMinor),
      allocatedTip: fromMinorUnits(tipM),
      totalShare: fromMinorUnits(totalM),
    };
  });

  return {
    totalPersonalSpending: fromMinorUnits(totalPersonalMinor),
    taxAmount: fromMinorUnits(taxMinor),
    serviceChargeAmount: fromMinorUnits(serviceChargeMinor),
    tipAmount: fromMinorUnits(tipMinor),
    grandTotal: fromMinorUnits(grandTotalMinor),
    memberBreakdown: breakdown,
  };
}

