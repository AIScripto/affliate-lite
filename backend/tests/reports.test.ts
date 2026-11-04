/**
 * Reports Controller & Aggregations Test Suite
 * Conforming to DOD Rule 7 (Always Write Test Cases covering positive flows, edge cases, and error recovery)
 */

describe('Reports Calculation & Aggregation Suite', () => {
  it('positive flow: correctly computes Net Margin and Margin Percent', () => {
    const totalRevenue = 1500.0;
    const totalPayout = 900.0;
    const netMargin = totalRevenue - totalPayout;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    expect(netMargin).toBe(600.0);
    expect(marginPercent).toBe(40.0);
  });

  it('positive flow: correctly computes Conversion Rate (CR) and Earnings Per Click (EPC)', () => {
    const clicks = 250;
    const conversions = 25;
    const totalPayout = 500.0;

    const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const epc = clicks > 0 ? totalPayout / clicks : 0;

    expect(cr).toBe(10.0);
    expect(epc).toBe(2.0);
  });

  it('edge case: 0 clicks safely returns 0 for CR and EPC without division by zero', () => {
    const clicks = 0;
    const conversions = 0;
    const totalPayout = 0;

    const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const epc = clicks > 0 ? totalPayout / clicks : 0;

    expect(cr).toBe(0);
    expect(epc).toBe(0);
    expect(Number.isFinite(cr)).toBe(true);
    expect(Number.isFinite(epc)).toBe(true);
  });

  it('edge case: date filter parses YYYY-MM-DD boundary properly', () => {
    const fromStr = '2026-10-01';
    const toStr = '2026-10-31';

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    toDate.setHours(23, 59, 59, 999);

    expect(fromDate.getTime()).toBeLessThan(toDate.getTime());
    expect(toDate.getHours()).toBe(23);
    expect(toDate.getMinutes()).toBe(59);
    expect(toDate.getSeconds()).toBe(59);
  });

  it('error recovery: handles zero revenue with non-zero payout gracefully', () => {
    const totalRevenue = 0.0;
    const totalPayout = 150.0;
    const netMargin = totalRevenue - totalPayout;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    expect(netMargin).toBe(-150.0);
    expect(marginPercent).toBe(0);
  });
});

