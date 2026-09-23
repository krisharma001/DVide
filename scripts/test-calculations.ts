import { calculateExpenseTotals, calculateSplits, calculateMemberBalances } from '../src/lib/calculations.ts';
import { generateSettlementTransfers } from '../src/lib/settlementEngine.ts';
import type { RoomMember, Expense } from '../src/types/index.ts';

console.log("=== Testing DVide Financial Calculations ===");

// 1. Dinner Scenario from prompt Section 47
const dinnerTotals = calculateExpenseTotals({
  amount: 2400,
  taxRate: 18,
  taxType: 'added',
  serviceCharge: 0,
  tip: 0,
  discount: 0
});

console.log("Dinner Totals:", dinnerTotals);
if (dinnerTotals.subtotal !== 2400 || dinnerTotals.taxAmount !== 432 || dinnerTotals.totalAmount !== 2832) {
  throw new Error("Dinner totals mismatch!");
}

const members: RoomMember[] = [
  { id: '1', room_id: 'r1', user_id: 'u_krish', display_name: 'Krish', joined_at: '' },
  { id: '2', room_id: 'r1', user_id: 'u_rahul', display_name: 'Rahul', joined_at: '' },
  { id: '3', room_id: 'r1', user_id: 'u_aman', display_name: 'Aman', joined_at: '' },
  { id: '4', room_id: 'r1', user_id: 'u_riya', display_name: 'Riya', joined_at: '' }
];

const dinnerSplits = calculateSplits({
  subtotal: dinnerTotals.subtotal,
  taxAmount: dinnerTotals.taxAmount,
  serviceCharge: 0,
  tip: 0,
  discount: 0,
  totalAmount: dinnerTotals.totalAmount,
  participants: members.map(m => ({ userId: m.user_id })),
  splitMethod: 'equal',
  taxSplitMethod: 'equal'
});

console.log("Splits per person:", dinnerSplits.map(s => `${s.user_id}: ₹${s.total_share}`).join(', '));
dinnerSplits.forEach(s => {
  if (s.total_share !== 708) throw new Error(`Expected ₹708 share but got ₹${s.total_share}`);
});

const expenses: Expense[] = [
  {
    id: 'e1',
    room_id: 'r1',
    created_by: 'u_krish',
    description: 'Dinner',
    category: 'food',
    subtotal: dinnerTotals.subtotal,
    tax_rate: 18,
    tax_amount: dinnerTotals.taxAmount,
    tax_type: 'added',
    tax_split_method: 'equal',
    service_charge: 0,
    tip: 0,
    discount: 0,
    total_amount: dinnerTotals.totalAmount,
    currency: '₹',
    paid_by_user_id: 'u_krish',
    split_method: 'equal',
    splits: dinnerSplits,
    created_at: ''
  }
];

const balances = calculateMemberBalances(members, expenses);
console.log("Calculated balances:", balances.map(b => `${b.display_name}: net=${b.net_balance} (paid=${b.amount_paid}, owed=${b.amount_owed})`));

const krish = balances.find(b => b.user_id === 'u_krish')!;
if (krish.net_balance !== 2124) throw new Error(`Krish balance expected 2124, got ${krish.net_balance}`);

const settlements = generateSettlementTransfers(balances);
console.log("Settlement transfers:", settlements.map(t => `${t.from_name} -> ${t.to_name}: ₹${t.amount}`));
if (settlements.length !== 3) throw new Error(`Expected 3 settlement transfers, got ${settlements.length}`);

// 2. Test 3-way split with residual paise distribution (100 / 3)
const split3 = calculateSplits({
  subtotal: 100,
  taxAmount: 0,
  serviceCharge: 0,
  tip: 0,
  discount: 0,
  totalAmount: 100,
  participants: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }],
  splitMethod: 'equal',
  taxSplitMethod: 'equal'
});
console.log("3-way 100 split:", split3.map(s => s.total_share));
const sum3 = split3.reduce((acc, s) => acc + s.total_share, 0);
if (Math.round(sum3 * 100) !== 10000) throw new Error(`Sum was ${sum3}, expected 100.00 exactly!`);

// 3. Test Table Tax & Surcharge Distribution
import { calculateTableTaxDistribution } from '../src/lib/calculations.ts';

const tableTest = calculateTableTaxDistribution({
  membersSpending: [
    { userId: 'u_a', displayName: 'A', spending: 450 },
    { userId: 'u_b', displayName: 'B', spending: 650 },
    { userId: 'u_c', displayName: 'C', spending: 200 }
  ],
  taxRatePercent: 18,
  serviceChargePercent: 0,
  tipAmount: 0,
  splitMethod: 'proportional'
});

console.log("Table Tax Test Result:", tableTest);
if (tableTest.totalPersonalSpending !== 1300) throw new Error("Personal spending mismatch");
if (tableTest.taxAmount !== 234) throw new Error("Tax amount mismatch");
if (tableTest.grandTotal !== 1534) throw new Error("Grand total mismatch");
if (tableTest.memberBreakdown[0].allocatedTax !== 81) throw new Error("Member A tax mismatch");
if (tableTest.memberBreakdown[1].allocatedTax !== 117) throw new Error("Member B tax mismatch");
if (tableTest.memberBreakdown[2].allocatedTax !== 36) throw new Error("Member C tax mismatch");

console.log("All financial & Table Tax tests PASSED successfully!");

