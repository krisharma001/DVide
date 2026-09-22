import type { MemberBalance, SettlementTransfer } from '../types/index.ts';
import { toMinorUnits, fromMinorUnits } from './calculations.ts';

/**
 * Simplifies group debts into the minimum number of direct transactions.
 * Uses a greedy debt resolution algorithm.
 */
export function generateSettlementTransfers(balances: MemberBalance[]): SettlementTransfer[] {
  // Minor units ledger
  const creditors: { userId: string; name: string; amount: number }[] = [];
  const debtors: { userId: string; name: string; amount: number }[] = [];

  balances.forEach((b) => {
    const netMinor = toMinorUnits(b.net_balance);
    if (netMinor > 0) {
      creditors.push({ userId: b.user_id, name: b.display_name, amount: netMinor });
    } else if (netMinor < 0) {
      debtors.push({ userId: b.user_id, name: b.display_name, amount: Math.abs(netMinor) });
    }
  });

  // Sort descending by amount to maximize greedy reduction
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // Transfer is the smaller of what debtor owes vs what creditor is owed
    const transferMinor = Math.min(debtor.amount, creditor.amount);

    if (transferMinor > 0) {
      transfers.push({
        from_user_id: debtor.userId,
        from_name: debtor.name,
        to_user_id: creditor.userId,
        to_name: creditor.name,
        amount: fromMinorUnits(transferMinor),
      });
    }

    debtor.amount -= transferMinor;
    creditor.amount -= transferMinor;

    if (debtor.amount === 0) {
      i++;
    }
    if (creditor.amount === 0) {
      j++;
    }
  }

  return transfers;
}
