export interface SplitCalculationInput {
  role: 'admin' | 'sub_aff';
  refCode: string;
  splitPct: number; // e.g. 60.00
  grossCommission: number; // e.g. 20.00
}

export interface SplitCalculationResult {
  subPay: number;
  netProfit: number;
  isDirect: boolean;
}

export function calculateCommissionSplit(input: SplitCalculationInput): SplitCalculationResult {
  const { role, refCode, splitPct, grossCommission } = input;

  const isDirect = role === 'admin' || refCode === 'direct';

  if (isDirect) {
    return {
      subPay: 0,
      netProfit: Number(grossCommission.toFixed(2)),
      isDirect: true,
    };
  }

  // Sub-affiliate commission split
  const safeSplit = Math.max(0, Math.min(100, splitPct));
  const subPay = Number(((grossCommission * safeSplit) / 100).toFixed(2));
  const netProfit = Number((grossCommission - subPay).toFixed(2));

  return {
    subPay,
    netProfit,
    isDirect: false,
  };
}
