import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  MousePointer,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { fetchDashboardSummary } from '../../services/api';
import { DashboardSummary } from '../../types';
import { TrafficAnalyticsGraphs } from './TrafficAnalyticsGraphs';

/**
 * Computes a smoothed SVG path from real chronological trend points using cubic Bezier interpolation.
 */
function generateSmoothSvg(points: number[], width = 200, height = 40, padding = 4) {
  if (!points || points.length === 0) {
    return {
      fillPath: `M 0,${height} L ${width},${height} Z`,
      strokePath: `M 0,${height - padding} L ${width},${height - padding}`,
      lastX: width,
      lastY: height - padding,
    };
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1 || 1)) * width;
    const norm = (val - minVal) / range;
    const y = height - padding - norm * (height - 2 * padding);
    return { x, y };
  });

  if (coords.length === 1) {
    coords.push({ x: width, y: coords[0].y });
  }

  let strokePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    strokePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const last = coords[coords.length - 1];
  const fillPath = `${strokePath} L ${width},${height} L 0,${height} Z`;

  return {
    fillPath,
    strokePath,
    lastX: last.x,
    lastY: last.y,
  };
}

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('All Time (Live)');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [hoveredTileNode, setHoveredTileNode] = useState<{
    tile: 'clicks' | 'conversions' | 'revenue' | 'payout';
    index: number;
    label: string;
    value: string;
  } | null>(null);

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

  // 100% Real database-derived metrics with zero fabricated numbers
  const totalClicks = summary?.clicks ?? 0;
  const totalConvs = summary?.conversions ?? 0;
  const approvedConvs = summary?.approvedConversions ?? 0;
  const uncheckedConvs = summary?.uncheckedConversions ?? 0;
  const totalRevenue = summary?.revenue ?? 0;
  const totalPayout = summary?.payout ?? 0;
  const netMargin = summary?.netMargin ?? Number((totalRevenue - totalPayout).toFixed(2));
  const marginPercent = summary?.marginPercent ?? (totalRevenue > 0 ? Number(((netMargin / totalRevenue) * 100).toFixed(1)) : 0);
  const overallCr = summary?.overallCr ?? (totalClicks > 0 ? Number(((totalConvs / totalClicks) * 100).toFixed(1)) : 0);
  const averageEpc = summary?.epc ?? (totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0);

  // Dynamic Bezier Sparklines computed from real Prisma database aggregation
  const clickTrend = summary?.trends?.clicks && summary.trends.clicks.length > 0
    ? summary.trends.clicks
    : [0, totalClicks];
  const clickSvg = generateSmoothSvg(clickTrend, 200, 40);

  const revTrend = summary?.trends?.revenue && summary.trends.revenue.length > 0
    ? summary.trends.revenue
    : [0, totalRevenue];
  const revSvg = generateSmoothSvg(revTrend, 200, 40);

  const payoutTrend = summary?.trends?.payout && summary.trends.payout.length > 0
    ? summary.trends.payout
    : [0, totalPayout];
  const payoutSvg = generateSmoothSvg(payoutTrend, 200, 40);

  // Real Database Timeline Buckets
  const timelineBuckets = summary?.timeline && summary.timeline.length > 0
    ? summary.timeline
    : [
        { label: '00:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
        { label: '04:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
        { label: '08:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
        { label: '12:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
        { label: '16:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
        { label: '20:00', clicks: 0, conversions: 0, payout: 0, revenue: 0 },
      ];

  const trafficData = summary?.trafficStats || [];

  return (
    <div className="space-y-6">
      {/* Page Header & Date Range Filter with Filled 3D Gradient Title Bar */}
      <div className="titlebar-3d-gradient rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">Dashboard</h1>
            <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-[10px] font-bold text-white uppercase tracking-wider">
              Analytics Hub
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Real-time CPA Affiliate performance, conversions, and traffic analytics
          </p>
        </div>

        {/* Date Range Picker Dropdown */}
        <div className="relative flex items-center gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-semibold text-white shadow-sm backdrop-blur-sm focus:outline-hidden cursor-pointer"
          >
            <option value="USD" className="text-slate-900">USD ($)</option>
            <option value="EUR" className="text-slate-900">EUR (€)</option>
            <option value="GBP" className="text-slate-900">GBP (£)</option>
            <option value="PKR" className="text-slate-900">PKR (₨)</option>
            <option value="AED" className="text-slate-900">AED</option>
          </select>

          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-semibold text-white shadow-sm backdrop-blur-sm active:scale-95 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface border border-border-strong shadow-xl z-30 p-2 text-xs divide-y divide-border-strong">
              <div className="space-y-1 pb-2">
                {[
                  'All Time (Live)',
                  'Today',
                  'Yesterday',
                  'Last 7 Days',
                  'Last 30 Days',
                  'This Month',
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      loadData();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-surface-elevated text-fg transition cursor-pointer"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Executive Metric Tiles with Distinct & Meaningful Standard Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Active Traffic / Clicks (Spline Wave Stream) */}
        <div
          className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between"
          onMouseLeave={() => setHoveredTileNode(null)}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <MousePointer className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                  Active Clicks
                </span>
              </div>
              {hoveredTileNode?.tile === 'clicks' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/25 text-sky-300 border border-sky-400/50 animate-pulse">
                  {hoveredTileNode.label}: {hoveredTileNode.value}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  CR {overallCr.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
              {isLoading ? '...' : totalClicks.toLocaleString()}
            </div>
          </div>

          {/* Spline Wave Stream (Neon Blue with interactive nodes) */}
          <div className="mt-2 -mx-1 relative">
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="clickGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={clickSvg.fillPath} fill="url(#clickGradDash)" />
              <path
                d={clickSvg.strokePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Interactive Points on Clicks Stream */}
              {timelineBuckets.map((b, idx) => {
                const x = (idx / (timelineBuckets.length - 1 || 1)) * 200;
                const maxB = Math.max(...timelineBuckets.map((k) => k.clicks), 1);
                const norm = b.clicks / maxB;
                const y = 36 - norm * 28;
                const isHovered = hoveredTileNode?.tile === 'clicks' && hoveredTileNode.index === idx;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#FFFFFF' : '#38bdf8'}
                    stroke="#38bdf8"
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredTileNode({
                        tile: 'clicks',
                        index: idx,
                        label: b.label,
                        value: `${b.clicks} Clicks`,
                      })
                    }
                  />
                );
              })}
            </svg>
          </div>

          <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
            <span>Real-time redirects</span>
            <span className="text-emerald-400 font-bold">100% Attribution</span>
          </div>
        </div>

        {/* Tile 2: Conversions (Discrete Event Histogram) */}
        <div
          className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between"
          onMouseLeave={() => setHoveredTileNode(null)}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Target className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                  Conversions
                </span>
              </div>
              {hoveredTileNode?.tile === 'conversions' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 animate-pulse">
                  {hoveredTileNode.label}: {hoveredTileNode.value}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {approvedConvs} Approved
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
              {isLoading ? '...' : totalConvs.toLocaleString()}
            </div>
          </div>

          {/* Discrete Event Histogram Bars */}
          <div className="mt-2 -mx-1 relative">
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="convBarGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <line x1="0" y1="36" x2="200" y2="36" stroke="currentColor" strokeOpacity="0.1" />

              {timelineBuckets.map((b, idx) => {
                const totalBars = timelineBuckets.length;
                const colW = 200 / totalBars;
                const barW = 16;
                const x = idx * colW + (colW - barW) / 2;
                const maxC = Math.max(...timelineBuckets.map((k) => k.conversions), 1);
                const barH = b.conversions > 0 ? Math.max((b.conversions / maxC) * 30, 8) : 3;
                const y = 36 - barH;
                const isHovered = hoveredTileNode?.tile === 'conversions' && hoveredTileNode.index === idx;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredTileNode({
                        tile: 'conversions',
                        index: idx,
                        label: b.label,
                        value: `${b.conversions} Conv`,
                      })
                    }
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={3}
                      fill={b.conversions > 0 ? (isHovered ? '#34d399' : 'url(#convBarGradDash)') : 'rgba(255,255,255,0.08)'}
                      className="transition-colors"
                    />
                    {b.conversions > 0 && (
                      <circle cx={x + barW / 2} cy={y} r={2.5} fill="#6ee7b7" className="animate-pulse" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
            <span className="text-emerald-400 font-bold">{approvedConvs} Approved</span>
            <span className="text-amber-400 font-bold">{uncheckedConvs} Unchecked</span>
          </div>
        </div>

        {/* Tile 3: Gross Revenue (Stepped Mountain Gradient Curve) */}
        <div
          className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between"
          onMouseLeave={() => setHoveredTileNode(null)}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                  Gross Revenue
                </span>
              </div>
              {hoveredTileNode?.tile === 'revenue' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-400/50 animate-pulse">
                  {hoveredTileNode.label}: {hoveredTileNode.value}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Margin {marginPercent.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
              {isLoading ? '...' : `${currencySymbol} ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>

          {/* Mountain Slope Curve with Shaded Step Nodes */}
          <div className="mt-2 -mx-1 relative">
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={revSvg.fillPath} fill="url(#revGradDash)" />
              <path
                d={revSvg.strokePath}
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Interactive Revenue Milestone Markers */}
              {timelineBuckets.map((b, idx) => {
                const x = (idx / (timelineBuckets.length - 1 || 1)) * 200;
                const maxR = Math.max(...timelineBuckets.map((k) => k.revenue), 1);
                const norm = b.revenue / maxR;
                const y = 36 - norm * 28;
                const isHovered = hoveredTileNode?.tile === 'revenue' && hoveredTileNode.index === idx;

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#FFFFFF' : '#818cf8'}
                    stroke="#818cf8"
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredTileNode({
                        tile: 'revenue',
                        index: idx,
                        label: b.label,
                        value: `${currencySymbol}${b.revenue.toFixed(2)} Rev`,
                      })
                    }
                  />
                );
              })}
            </svg>
          </div>

          <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
            <span>Net Margin</span>
            <span className="text-emerald-400 font-bold">
              {currencySymbol} {netMargin.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tile 4: Affiliate Payout (Dual-Tone Bar & Yield Spline Combo) */}
        <div
          className="panel-card p-3.5 border border-border-strong relative overflow-hidden flex flex-col justify-between"
          onMouseLeave={() => setHoveredTileNode(null)}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 dark:text-slate-200">
                  Total Payout
                </span>
              </div>
              {hoveredTileNode?.tile === 'payout' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/50 animate-pulse">
                  {hoveredTileNode.label}: {hoveredTileNode.value}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  CR {overallCr.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-white tracking-tight tabular-nums">
              {isLoading ? '...' : `${currencySymbol} ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>

          {/* Hybrid: Mini Payout Pillars with Golden EPC Rate Line */}
          <div className="mt-2 -mx-1 relative">
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="payoutBarGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Underlying Payout Pillars */}
              {timelineBuckets.map((b, idx) => {
                const totalBars = timelineBuckets.length;
                const colW = 200 / totalBars;
                const barW = 10;
                const x = idx * colW + (colW - barW) / 2;
                const maxP = Math.max(...timelineBuckets.map((k) => k.payout), 1);
                const barH = b.payout > 0 ? Math.max((b.payout / maxP) * 26, 6) : 2;
                const y = 36 - barH;

                return (
                  <rect
                    key={`dbar-${idx}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={2}
                    fill="url(#payoutBarGradDash)"
                    className="opacity-70 hover:opacity-100 transition"
                  />
                );
              })}

              {/* Overlaid Golden Rate Spline */}
              <path
                d={payoutSvg.strokePath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Interactive Points on Rate Spline */}
              {timelineBuckets.map((b, idx) => {
                const x = (idx / (timelineBuckets.length - 1 || 1)) * 200;
                const maxP = Math.max(...timelineBuckets.map((k) => k.payout), 1);
                const norm = b.payout / maxP;
                const y = 36 - norm * 26;
                const isHovered = hoveredTileNode?.tile === 'payout' && hoveredTileNode.index === idx;

                return (
                  <circle
                    key={`dpt-${idx}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#FFFFFF' : '#f59e0b'}
                    stroke="#fbbf24"
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredTileNode({
                        tile: 'payout',
                        index: idx,
                        label: b.label,
                        value: `${currencySymbol}${b.payout.toFixed(2)} Paid`,
                      })
                    }
                  />
                );
              })}
            </svg>
          </div>

          <div className="text-xs text-slate-200 dark:text-slate-200 pt-1.5 border-t border-border-strong flex items-center justify-between font-semibold">
            <span>Average EPC</span>
            <span className="text-amber-400 font-bold">
              {currencySymbol} {averageEpc.toFixed(2)}
            </span>
          </div>
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
