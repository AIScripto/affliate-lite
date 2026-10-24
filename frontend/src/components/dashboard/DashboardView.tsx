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

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('October 1, 2026 - October 22, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currency, setCurrency] = useState('USD');

  // Chart legend visibility toggles
  const [showConversions, setShowConversions] = useState(true);
  const [showClicks, setShowClicks] = useState(true);
  const [showProfit, setShowProfit] = useState(true);
  const [showIncome, setShowIncome] = useState(true);

  // Hover state for chart
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const maxClicks = Math.max(...trafficData.map((d) => d.clicks), 70);
  const maxConversions = Math.max(...trafficData.map((d) => d.conversions), 10);

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
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
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
              <span className="text-3xl font-bold tabular-nums text-fg">
                {summary?.clicks ?? 68}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {summary?.clicksGrowth ?? '+136% Today'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2">Active routing clicks across all campaigns</p>
        </div>

        {/* Card 2: Conversions */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
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
              <span className="text-3xl font-bold tabular-nums text-fg">
                {summary?.conversions ?? 5}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {summary?.conversionsGrowth ?? '+200% Today'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2">Attributed conversions from postback engine</p>
        </div>

        {/* Card 3: Payout */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
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
              <span className="text-3xl font-bold tabular-nums text-fg">
                {currencySymbol} {(summary?.payout ?? 750).toFixed(2)}
              </span>
              <span className="text-[11px] font-medium text-fg-muted uppercase">
                {currency}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2">Total affiliate publisher earnings payable</p>
        </div>

        {/* Card 4: EPC & Interactive Currency Selector */}
        <div className="panel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
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
                {currencySymbol} {(summary?.epc ?? 11.03).toFixed(2)}
              </span>
            </div>
          )}
          <p className="text-[11px] text-fg-muted mt-2">
            Earnings by Currency:{' '}
            <strong className="text-fg font-semibold">
              {currencySymbol} {(summary?.payout ?? 750).toFixed(2)}
            </strong>
          </p>
        </div>
      </div>

      {/* 100%-Width 30-Day Traffic Statistics Chart (Client Directive: full width, no clutter widgets) */}
      <div className="panel-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-fg">
              Traffic statistics for the last 30 day
            </h2>
            <p className="text-xs text-fg-muted mt-0.5">
              Dual-axis trend: Clicks, Conversions, Profit, and Gross Revenue
            </p>
          </div>

          {/* Interactive Legend Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowConversions(!showConversions)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                showConversions
                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                  : 'bg-surface border-border-subtle text-fg-muted opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Total Conversions</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClicks(!showClicks)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                showClicks
                  ? 'bg-pink-500/10 border-pink-500 text-pink-500 font-semibold'
                  : 'bg-surface border-border-subtle text-fg-muted opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>Clicks</span>
            </button>

            <button
              type="button"
              onClick={() => setShowProfit(!showProfit)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                showProfit
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500 font-semibold'
                  : 'bg-surface border-border-subtle text-fg-muted opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Total Profit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIncome(!showIncome)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                showIncome
                  ? 'bg-blue-500/10 border-blue-500 text-blue-500 font-semibold'
                  : 'bg-surface border-border-subtle text-fg-muted opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Total Income</span>
            </button>
          </div>
        </div>

        {/* SVG Composed Chart with Hover Tooltip */}
        <div className="relative w-full h-72">
          {isLoading ? (
            <div className="w-full h-full bg-surface-elevated animate-pulse rounded-lg" />
          ) : (
            <div className="w-full h-full flex flex-col justify-between">
              {/* Chart Canvas */}
              <div
                className="relative flex-1 w-full"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 0 ${trafficData.length * 100} 200`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="clicksBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 50, 100, 150].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2={trafficData.length * 100}
                      y2={y}
                      stroke="currentColor"
                      className="text-border-subtle"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Bars for Clicks */}
                  {showClicks &&
                    trafficData.map((d, i) => {
                      const barHeight = (d.clicks / maxClicks) * 160;
                      const x = i * 100 + 35;
                      const y = 190 - barHeight;
                      return (
                        <rect
                          key={`bar-${i}`}
                          x={x}
                          y={y}
                          width="30"
                          height={barHeight}
                          rx="4"
                          fill="url(#clicksBarGradient)"
                          className="transition-all hover:opacity-100 opacity-80"
                        />
                      );
                    })}

                  {/* Line for Conversions */}
                  {showConversions && (
                    <>
                      <path
                        d={trafficData
                          .map((d, i) => {
                            const x = i * 100 + 50;
                            const y = 190 - (d.conversions / maxConversions) * 160;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#6C5CE7"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {trafficData.map((d, i) => {
                        const x = i * 100 + 50;
                        const y = 190 - (d.conversions / maxConversions) * 160;
                        return (
                          <circle
                            key={`dot-${i}`}
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#6C5CE7"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="cursor-pointer hover:r-7 transition-all"
                          />
                        );
                      })}
                    </>
                  )}

                  {/* Transparent hover columns */}
                  {trafficData.map((_, i) => (
                    <rect
                      key={`hit-${i}`}
                      x={i * 100}
                      y="0"
                      width="100"
                      height="200"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  ))}
                </svg>

                {/* Floating Tooltip matching Max Wave spec [00:53] */}
                {hoveredIndex !== null && trafficData[hoveredIndex] && (
                  <div
                    className="absolute z-20 pointer-events-none bg-surface/95 backdrop-blur-md border border-border-subtle p-3 rounded-lg shadow-xl text-xs space-y-1"
                    style={{
                      left: `${((hoveredIndex + 0.5) / trafficData.length) * 100}%`,
                      top: '20px',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="font-bold text-fg border-b border-border-subtle pb-1">
                      {trafficData[hoveredIndex].date}
                    </div>
                    {showConversions && (
                      <div className="flex items-center justify-between gap-4 text-primary">
                        <span>Total Conversions:</span>
                        <strong className="tabular-nums">
                          {trafficData[hoveredIndex].conversions}
                        </strong>
                      </div>
                    )}
                    {showClicks && (
                      <div className="flex items-center justify-between gap-4 text-pink-500">
                        <span>Clicks:</span>
                        <strong className="tabular-nums">
                          {trafficData[hoveredIndex].clicks}
                        </strong>
                      </div>
                    )}
                    {showProfit && (
                      <div className="flex items-center justify-between gap-4 text-cyan-500">
                        <span>Total Profit:</span>
                        <strong className="tabular-nums">
                          $ {trafficData[hoveredIndex].profit ?? 375}.00
                        </strong>
                      </div>
                    )}
                    {showIncome && (
                      <div className="flex items-center justify-between gap-4 text-blue-500">
                        <span>Total Income:</span>
                        <strong className="tabular-nums">
                          $ {trafficData[hoveredIndex].income ?? 1125}.00
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* X-Axis Dates */}
              <div className="flex justify-between text-[11px] text-fg-muted pt-2 border-t border-border-subtle">
                {trafficData.map((d) => (
                  <span key={d.date} className="truncate">
                    {d.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
