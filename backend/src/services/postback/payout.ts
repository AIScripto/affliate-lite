import { CurrencyCode, PaymentModel } from '@prisma/client';
import crypto from 'node:crypto';

export interface PayoutRule {
  goalValue: string;
  paymentModel: PaymentModel;
  currency: CurrencyCode;
  revenue: unknown; // Prisma Decimal
  payout: unknown; // Prisma Decimal
}

export interface ConversionAmounts {
  revenue: number;
  payout: number;
  currency: CurrencyCode;
}

/** Currency used only when an offer has no payout rule at all. */
export const FALLBACK_CURRENCY: CurrencyCode = 'USD';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The payout rule for this goal, or the offer's first rule when no rule matches. */
export function selectPayoutRule<T extends PayoutRule>(rules: T[], goal: string): T | undefined {
  return rules.find((r) => r.goalValue === goal) ?? rules[0];
}

/**
 * Money for one conversion.
 * - Fixed models (CPA etc.): fixed revenue/payout; `sum` from the network replaces revenue.
 * - REVSHARE: revenue and payout are percentages of `sum` (the sale amount).
 * - No rule: no payout is invented (old code used a made-up 150/100).
 */
export function computeConversionAmounts(rule: PayoutRule | undefined, sum?: number): ConversionAmounts {
  if (!rule) {
    return { revenue: round2(sum ?? 0), payout: 0, currency: FALLBACK_CURRENCY };
  }
  const ruleRevenue = Number(rule.revenue);
  const rulePayout = Number(rule.payout);

  if (rule.paymentModel === 'REVSHARE') {
    const saleAmount = sum ?? 0;
    return {
      revenue: round2((saleAmount * ruleRevenue) / 100),
      payout: round2((saleAmount * rulePayout) / 100),
      currency: rule.currency,
    };
  }

  return {
    revenue: round2(sum ?? ruleRevenue),
    payout: round2(rulePayout),
    currency: rule.currency,
  };
}

/** Constant-time token check, so the token cannot be guessed from response timing. */
export function tokensMatch(expected: string, provided: string | undefined): boolean {
  if (!provided) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(provided).digest();
  return crypto.timingSafeEqual(a, b);
}
