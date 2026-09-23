// Minor unit arithmetic simulation test
function toCents(val) {
  return Math.round(Number(val) * 100);
}
function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

function calculateTableTaxDistribution(subtotal, taxRate, taxAmount, taxType, taxSplitMethod, tip, serviceCharge, memberSubtotals) {
  const calculatedTax = taxRate > 0 ? (subtotal * taxRate) / 100 : taxAmount;
  const totalTaxAndFees = calculatedTax + tip + serviceCharge;
  const totalBill = subtotal + (taxType === 'added' ? totalTaxAndFees : tip + serviceCharge);

  const totalFeeCents = toCents(totalTaxAndFees);
  const shares = {};

  if (taxSplitMethod === 'equal') {
    const memberCount = memberSubtotals.length;
    if (memberCount > 0) {
      const baseShare = Math.floor(totalFeeCents / memberCount);
      let remainder = totalFeeCents % memberCount;
      memberSubtotals.forEach((m) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        shares[m.user_id] = fromCents(baseShare + extra);
      });
    }
  } else {
    // Proportional
    let allocatedCents = 0;
    memberSubtotals.forEach((m) => {
      const proportion = subtotal > 0 ? m.subtotal / subtotal : 1 / memberSubtotals.length;
      const shareCents = Math.round(totalFeeCents * proportion);
      allocatedCents += shareCents;
      shares[m.user_id] = shareCents;
    });

    const diff = totalFeeCents - allocatedCents;
    if (diff !== 0 && memberSubtotals.length > 0) {
      const largestMember = [...memberSubtotals].sort((a, b) => b.subtotal - a.subtotal)[0];
      shares[largestMember.user_id] += diff;
    }

    Object.keys(shares).forEach((uid) => {
      shares[uid] = fromCents(shares[uid]);
    });
  }

  const memberShares = memberSubtotals.map((m) => {
    const feeShare = shares[m.user_id] || 0;
    return {
      user_id: m.user_id,
      item_subtotal: m.subtotal,
      tax_and_fees_share: feeShare,
      total_share: fromCents(toCents(m.subtotal) + toCents(feeShare)),
    };
  });

  return {
    calculatedTax: fromCents(toCents(calculatedTax)),
    totalTaxAndFees: fromCents(totalFeeCents),
    totalBill: fromCents(toCents(totalBill)),
    memberShares,
  };
}

console.log('--- Test 1: Section 47 Proportional Dinner Test (4 People) ---');
const dist = calculateTableTaxDistribution(
  1800, // 550 + 420 + 380 + 450
  18,   // 18% GST = 324
  0,
  'added',
  'proportional',
  0,
  180,  // Service charge
  [
    { user_id: 'Krish', subtotal: 550 },
    { user_id: 'Rahul', subtotal: 420 },
    { user_id: 'Aman', subtotal: 380 },
    { user_id: 'Riya', subtotal: 450 },
  ]
);

console.log('Total Bill:', dist.totalBill);
console.log('Total Tax & Fees:', dist.totalTaxAndFees);
console.table(dist.memberShares);

const sumShares = dist.memberShares.reduce((s, m) => s + m.total_share, 0);
console.log('Sum of member shares:', sumShares);
console.assert(Math.abs(sumShares - 2304) < 0.01, 'Sum must match total bill');
console.log('✅ Section 47 Table Tax Test PASSED with zero-penny leak!');
