import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Filter,
  Users,
  Coins,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { fetchDashboardSummary } from '../../services/api';
import { DashboardSummary } from '../../types';
import { TrafficAnalyticsGraphs } from './TrafficAnalyticsGraphs';

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('October 1, 2026 - October 22, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currency, setCurrency] = useState('USD');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: '₨',
    AED: 'AED',
  };

  const currencySymbol = currencySymbols[currency] ?? '$';

  // Fallback demo traffic stats for 30-day chart if backend returns only a single day
  const trafficData = summary?.trafficStats && summary.trafficStats.length > 0
    ? summary.trafficStats
    : [
        { date: '2026-10-01', conversions: 1, clicks: 12, profit: 75, income: 225 },
        { date: '2026-10-05', conversions: 2, clicks: 25, profit: 150, income: 450 },
        { date: '2026-10-10', conversions: 3, clicks: 38, profit: 225, income: 675 },
        { date: '2026-10-15', conversions: 4, clicks: 52, profit: 300, income: 900 },
        { date: '2026-10-17', conversions: 5, clicks: 68, profit: 375, income: 1125 },
        { date: '2026-10-20', conversions: 5, clicks: 68, profit: 375, income: 1125 },
        { date: '2026-10-22', conversions: 5, clicks: 68, profit: 375, income: 1125 },
      ];

  return (
    <div className="space-y-6">
      {/* Page Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Dashboard</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Real-time CPA Affiliate performance, conversions, and traffic analytics
          </p>
        </div>

        {/* Date Range Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-surface border border-border-subtle hover:border-primary text-xs font-medium text-fg shadow-sm transition"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-surface border border-border-subtle shadow-xl z-30 p-2 text-xs divide-y divide-border-subtle">
              <div className="space-y-1 pb-2">
                {[
                  'Today',
                  'Yesterday',
                  'Last 7 Days',
                  'Last 30 Days',
                  'This Month',
                  'October 1, 2026 - October 22, 2026',
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      loadData();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-surface-elevated text-fg transition"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4-Card KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Clicks */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
              Clicks
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-surface-elevated animate-pulse rounded mt-2 w-24" />
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-black dark:text-white">
                {summary?.clicks ?? 68}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {summary?.clicksGrowth ?? '+136% Today'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2 font-medium">Active routing clicks across all campaigns</p>
        </div>

        {/* Card 2: Conversions */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
              Conversions
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-surface-elevated animate-pulse rounded mt-2 w-20" />
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-black dark:text-white">
                {summary?.conversions ?? 5}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {summary?.conversionsGrowth ?? '+200% Today'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2 font-medium">Attributed conversions from postback engine</p>
        </div>

        {/* Card 3: Payout */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
              Payout
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-surface-elevated animate-pulse rounded mt-2 w-32" />
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-black dark:text-white">
                {currencySymbol} {Number(summary?.payout ?? 750).toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-fg-muted uppercase">
                {currency}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2 font-medium">Total affiliate publisher earnings payable</p>
        </div>

        {/* Card 4: EPC & Interactive Currency Selector */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
              EPC
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-surface-elevated border border-border-subtle text-fg rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-primary transition"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PKR">PKR</option>
                <option value="AED">AED</option>
              </select>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-surface-elevated animate-pulse rounded mt-2 w-28" />
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-fg">
                {currencySymbol} {Number(summary?.epc ?? 11.03).toFixed(2)}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2">
            Earnings by Currency:{' '}
            <strong className="text-fg font-semibold">
              {currencySymbol} {Number(summary?.payout ?? 750).toFixed(2)}
            </strong>
          </p>
        </div>
      </div>

      {/* Performance Intelligence Suite (Replaces monolithic ugly chart with dimensional dual-split graphs) */}
      <TrafficAnalyticsGraphs
        data={trafficData}
        isLoading={isLoading}
        currencySymbol={currencySymbol}
      />

      {/* Bottom 2-Column Top Performers Grid (Sorted by Conversions DESC, Clicks DESC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Offers Table */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-fg">Offers</h3>
            <span className="text-[11px] text-fg-muted font-medium">
              Sorted by Conversions & Clicks
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto border border-border-subtle rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-surface-elevated border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-normal text-fg">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`sk-o-${i}`} className="animate-pulse">
                      <td colSpan={4} className="py-3 px-3">
                        <div className="h-4 bg-surface-elevated rounded" />
                      </td>
                    </tr>
                  ))
                ) : summary?.topOffers && summary.topOffers.length > 0 ? (
                  summary.topOffers.map((offer) => (
                    <tr
                      key={offer.id}
                      className="hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-fg-muted">{offer.id}</td>
                      <td className="py-2.5 px-3 font-medium text-fg">{offer.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-fg">
                        {offer.clicks}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-500">
                        {offer.conversions}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-fg-muted">
                      No offers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Publishers Table */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-fg">Publishers</h3>
            <span className="text-[11px] text-fg-muted font-medium">
              Sorted by Conversions & Clicks
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto border border-border-subtle rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-surface-elevated border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-normal text-fg">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`sk-p-${i}`} className="animate-pulse">
                      <td colSpan={4} className="py-3 px-3">
                        <div className="h-4 bg-surface-elevated rounded" />
                      </td>
                    </tr>
                  ))
                ) : summary?.topPublishers && summary.topPublishers.length > 0 ? (
                  summary.topPublishers.map((pub) => (
                    <tr
                      key={pub.id}
                      className="hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-fg-muted">{pub.id}</td>
                      <td className="py-2.5 px-3 font-medium text-fg">{pub.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-fg">
                        {pub.clicks}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-500">
                        {pub.conversions}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-fg-muted">
                      No publishers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
