import { useState, useMemo } from 'react';
import {
  DollarSign,
  Activity,
  Layers,
  BarChart2,
} from 'lucide-react';

export interface TrafficDataPoint {
  date: string;
  conversions: number;
  clicks: number;
  profit?: number;
  income?: number;
  payout?: number;
}

interface TrafficAnalyticsGraphsProps {
  data: TrafficDataPoint[];
  isLoading?: boolean;
  currencySymbol?: string;
}

type TimeRange = '7D' | '14D' | '30D';
type ViewMode = 'SPLIT' | 'VOLUME' | 'FINANCIALS';

/**
 * Catmull-Rom to Cubic Bezier curve conversion for organic spline paths
 */
function generateSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function TrafficAnalyticsGraphs({
  data,
  isLoading = false,
  currencySymbol = '$',
}: TrafficAnalyticsGraphsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [viewMode, setViewMode] = useState<ViewMode>('SPLIT');

  // Layer toggles for Graph 1 (Volume)
  const [showClicks, setShowClicks] = useState(true);
  const [showConversions, setShowConversions] = useState(true);

  // Layer toggles for Graph 2 (Financials)
  const [showRevenue, setShowRevenue] = useState(true);
  const [showProfit, setShowProfit] = useState(true);

  // Hover states
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter data by selected time range
  const activeData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const count = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;
    return data.slice(-count);
  }, [data, timeRange]);

  // Aggregate metrics for active window
  const aggregates = useMemo(() => {
    const totalClicks = activeData.reduce((s, d) => s + d.clicks, 0);
    const totalConversions = activeData.reduce((s, d) => s + (d.conversions ?? 0), 0);
    const totalRevenue = activeData.reduce((s, d) => s + (d.income ?? 0), 0);
    const totalProfit = activeData.reduce((s, d) => s + (d.profit ?? 0), 0);
    const totalPayout = activeData.reduce(
      (s, d) => s + (d.payout ?? Math.max(0, (d.income ?? 0) - (d.profit ?? 0))),
      0
    );

    const cr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const epc = totalClicks > 0 ? totalPayout / totalClicks : 0;

    return {
      totalClicks,
      totalConversions,
      totalRevenue,
      totalProfit,
      totalPayout,
      cr: cr.toFixed(2),
      margin: margin.toFixed(1),
      epc: epc.toFixed(2),
    };
  }, [activeData]);

  // SVG Chart Geometry Constants
  const viewBoxWidth = 800;
  const viewBoxHeight = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  const graphHeight = viewBoxHeight - padding.top - padding.bottom;

  // Scales for Graph 1: Volume (Clicks & Conversions)
  const maxClicks = Math.max(...activeData.map((d) => d.clicks), 10);
  const maxConversions = Math.max(...activeData.map((d) => d.conversions), 5);

  const getVolumeX = (index: number) => {
    if (activeData.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (activeData.length - 1)) * graphWidth;
  };

  const clicksPoints = activeData.map((d, i) => ({
    x: getVolumeX(i),
    y: padding.top + graphHeight - (d.clicks / maxClicks) * graphHeight,
  }));

  const conversionsPoints = activeData.map((d, i) => ({
    x: getVolumeX(i),
    y: padding.top + graphHeight - (d.conversions / maxConversions) * graphHeight,
  }));

  const clicksPath = generateSmoothPath(clicksPoints);
  const clicksArea = clicksPoints.length > 0
    ? `${clicksPath} L ${clicksPoints[clicksPoints.length - 1].x} ${padding.top + graphHeight} L ${clicksPoints[0].x} ${padding.top + graphHeight} Z`
    : '';

  const convPath = generateSmoothPath(conversionsPoints);
  const convArea = conversionsPoints.length > 0
    ? `${convPath} L ${conversionsPoints[conversionsPoints.length - 1].x} ${padding.top + graphHeight} L ${conversionsPoints[0].x} ${padding.top + graphHeight} Z`
    : '';

  // Scales for Graph 2: Financials (Revenue & Profit)
  const maxRevenue = Math.max(...activeData.map((d) => d.income ?? 0), 100);
  const maxProfit = Math.max(...activeData.map((d) => d.profit ?? 0), 50);
  const maxFinancialScale = Math.max(maxRevenue, maxProfit, 100);

  const revenuePoints = activeData.map((d, i) => ({
    x: getVolumeX(i),
    y: padding.top + graphHeight - ((d.income ?? 0) / maxFinancialScale) * graphHeight,
  }));

  const profitPoints = activeData.map((d, i) => ({
    x: getVolumeX(i),
    y: padding.top + graphHeight - ((d.profit ?? 0) / maxFinancialScale) * graphHeight,
  }));

  const revenuePath = generateSmoothPath(revenuePoints);
  const revenueArea = revenuePoints.length > 0
    ? `${revenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${padding.top + graphHeight} L ${revenuePoints[0].x} ${padding.top + graphHeight} Z`
    : '';

  const profitPath = generateSmoothPath(profitPoints);
  const profitArea = profitPoints.length > 0
    ? `${profitPath} L ${profitPoints[profitPoints.length - 1].x} ${padding.top + graphHeight} L ${profitPoints[0].x} ${padding.top + graphHeight} Z`
    : '';

  // Compute key X-axis date labels (e.g., 5-6 evenly spaced labels)
  const labelIndices = useMemo(() => {
    if (activeData.length <= 6) return activeData.map((_, i) => i);
    const step = Math.floor((activeData.length - 1) / 5);
    const indices = [0];
    for (let i = step; i < activeData.length - 1; i += step) {
      indices.push(i);
    }
    indices.push(activeData.length - 1);
    return Array.from(new Set(indices));
  }, [activeData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
        <div className="panel-card h-80 bg-surface-elevated/50" />
        <div className="panel-card h-80 bg-surface-elevated/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Architecture Control Bar: Granularity & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <span>Performance Intelligence Suite</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Live Dual Pipeline
              </span>
            </h2>
            <p className="text-[11px] text-fg-muted">
              Dimensional separation: Traffic Acquisition Yield vs. Financial Margin Velocity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-elevated border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setViewMode('SPLIT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'SPLIT'
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dual Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('VOLUME')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'VOLUME'
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Volume</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FINANCIALS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'FINANCIALS'
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Revenue</span>
            </button>
          </div>

          {/* Time Window Granularity */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-elevated border border-border-subtle text-xs">
            {(['7D', '14D', '30D'] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                  timeRange === range
                    ? 'bg-surface text-fg font-bold shadow-sm'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Graphs Layout */}
      <div
        className={`grid gap-5 ${
          viewMode === 'SPLIT'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* GRAPH 1: Traffic & Conversion Funnel Dynamics */}
        {(viewMode === 'SPLIT' || viewMode === 'VOLUME') && (
          <div className="panel-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-fg">Traffic & Conversion Flow</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    CR: {aggregates.cr}%
                  </span>
                </div>
                <p className="text-[11px] text-fg-muted mt-0.5">
                  Click volume vs. Conversion events over the last {timeRange}
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowClicks(!showClicks)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                    showClicks
                      ? 'bg-pink-500/10 border-pink-500/40 text-pink-500 font-semibold'
                      : 'bg-surface border-border-subtle text-fg-muted opacity-40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Clicks ({aggregates.totalClicks})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConversions(!showConversions)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                    showConversions
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 font-semibold'
                      : 'bg-surface border-border-subtle text-fg-muted opacity-40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Conv ({aggregates.totalConversions})</span>
                </button>
              </div>
            </div>

            {/* SVG Canvas for Graph 1 */}
            <div className="relative w-full h-56 select-none" onMouseLeave={() => setHoveredIndex(null)}>
              <svg
                className="w-full h-full overflow-visible"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Clicks Gradient */}
                  <linearGradient id="clicksAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Conversions Gradient */}
                  <linearGradient id="convAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const y = padding.top + graphHeight * (1 - ratio);
                  const clickVal = Math.round(maxClicks * ratio);
                  return (
                    <g key={`v-grid-${ratio}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={viewBoxWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-border-subtle/70"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-fg-muted"
                      >
                        {clickVal}
                      </text>
                    </g>
                  );
                })}

                {/* Baseline Axis */}
                <line
                  x1={padding.left}
                  y1={padding.top + graphHeight}
                  x2={viewBoxWidth - padding.right}
                  y2={padding.top + graphHeight}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeWidth="1.5"
                />

                {/* Clicks Area & Curve */}
                {showClicks && clicksArea && (
                  <>
                    <path d={clicksArea} fill="url(#clicksAreaGrad)" />
                    <path
                      d={clicksPath}
                      fill="none"
                      stroke="#EC4899"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Conversions Area & Curve */}
                {showConversions && convArea && (
                  <>
                    <path d={convArea} fill="url(#convAreaGrad)" />
                    <path
                      d={convPath}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Data Points (Only render for points > 0 to eliminate barbed wire baseline) */}
                {showClicks &&
                  clicksPoints.map((p, i) => {
                    const val = activeData[i]?.clicks ?? 0;
                    if (val === 0 && hoveredIndex !== i) return null;
                    return (
                      <circle
                        key={`c-dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 5.5 : 3.5}
                        fill="#EC4899"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-all duration-150"
                      />
                    );
                  })}

                {showConversions &&
                  conversionsPoints.map((p, i) => {
                    const val = activeData[i]?.conversions ?? 0;
                    if (val === 0 && hoveredIndex !== i) return null;
                    return (
                      <circle
                        key={`cv-dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 6 : 4}
                        fill="#8B5CF6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    );
                  })}

                {/* Interactive Vertical Hover Crosshair */}
                {hoveredIndex !== null && (
                  <line
                    x1={getVolumeX(hoveredIndex)}
                    y1={padding.top}
                    x2={getVolumeX(hoveredIndex)}
                    y2={padding.top + graphHeight}
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="opacity-70"
                  />
                )}

                {/* X-Axis Date Labels */}
                {labelIndices.map((idx) => {
                  const d = activeData[idx];
                  if (!d) return null;
                  const x = getVolumeX(idx);
                  const label = d.date.slice(5); // e.g. "10-17"
                  return (
                    <text
                      key={`v-lbl-${idx}`}
                      x={x}
                      y={viewBoxHeight - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-fg-muted font-medium"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Invisible Hover Rectangles */}
                {activeData.map((_, i) => {
                  const width = graphWidth / Math.max(1, activeData.length - 1);
                  const x = getVolumeX(i) - width / 2;
                  return (
                    <rect
                      key={`hit-v-${i}`}
                      x={Math.max(padding.left, x)}
                      y={padding.top}
                      width={width}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  );
                })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredIndex !== null && activeData[hoveredIndex] && (
                <div
                  className="absolute pointer-events-none z-30 bg-surface/95 backdrop-blur-md border border-border-subtle p-3 rounded-lg shadow-2xl text-xs space-y-1.5 animate-fade-in"
                  style={{
                    left: `${(getVolumeX(hoveredIndex) / viewBoxWidth) * 100}%`,
                    top: '10px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="font-bold text-fg border-b border-border-subtle pb-1 flex items-center justify-between gap-3">
                    <span>{activeData[hoveredIndex].date}</span>
                    <span className="text-[10px] font-semibold text-primary">
                      CR:{' '}
                      {activeData[hoveredIndex].clicks > 0
                        ? (
                            (activeData[hoveredIndex].conversions /
                              activeData[hoveredIndex].clicks) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-pink-500 font-medium">
                    <span>Clicks:</span>
                    <strong className="tabular-nums font-bold">
                      {activeData[hoveredIndex].clicks}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-purple-400 font-medium">
                    <span>Conversions:</span>
                    <strong className="tabular-nums font-bold">
                      {activeData[hoveredIndex].conversions}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GRAPH 2: Financial Velocity & Profit Margin */}
        {(viewMode === 'SPLIT' || viewMode === 'FINANCIALS') && (
          <div className="panel-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-fg">Financial Velocity & Yield</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Margin: {aggregates.margin}%
                  </span>
                </div>
                <p className="text-[11px] text-fg-muted mt-0.5">
                  Gross Revenue vs. Net Profit spread ({currencySymbol} {aggregates.totalProfit} net)
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRevenue(!showRevenue)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                    showRevenue
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-semibold'
                      : 'bg-surface border-border-subtle text-fg-muted opacity-40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Revenue ({currencySymbol}{aggregates.totalRevenue})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfit(!showProfit)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${
                    showProfit
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500 font-semibold'
                      : 'bg-surface border-border-subtle text-fg-muted opacity-40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Net Profit ({currencySymbol}{aggregates.totalProfit})</span>
                </button>
              </div>
            </div>

            {/* SVG Canvas for Graph 2 */}
            <div className="relative w-full h-56 select-none" onMouseLeave={() => setHoveredIndex(null)}>
              <svg
                className="w-full h-full overflow-visible"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Revenue Gradient */}
                  <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Profit Gradient */}
                  <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Currency Y-Labels */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const y = padding.top + graphHeight * (1 - ratio);
                  const revVal = Math.round(maxFinancialScale * ratio);
                  return (
                    <g key={`f-grid-${ratio}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={viewBoxWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-border-subtle/70"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-fg-muted"
                      >
                        {currencySymbol}{revVal}
                      </text>
                    </g>
                  );
                })}

                {/* Baseline Axis */}
                <line
                  x1={padding.left}
                  y1={padding.top + graphHeight}
                  x2={viewBoxWidth - padding.right}
                  y2={padding.top + graphHeight}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeWidth="1.5"
                />

                {/* Revenue Area & Curve */}
                {showRevenue && revenueArea && (
                  <>
                    <path d={revenueArea} fill="url(#revAreaGrad)" />
                    <path
                      d={revenuePath}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Profit Area & Curve */}
                {showProfit && profitArea && (
                  <>
                    <path d={profitArea} fill="url(#profitAreaGrad)" />
                    <path
                      d={profitPath}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Data Points (Only render for points > 0) */}
                {showRevenue &&
                  revenuePoints.map((p, i) => {
                    const val = activeData[i]?.income ?? 0;
                    if (val === 0 && hoveredIndex !== i) return null;
                    return (
                      <circle
                        key={`rev-dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 5.5 : 3.5}
                        fill="#10B981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-all duration-150"
                      />
                    );
                  })}

                {showProfit &&
                  profitPoints.map((p, i) => {
                    const val = activeData[i]?.profit ?? 0;
                    if (val === 0 && hoveredIndex !== i) return null;
                    return (
                      <circle
                        key={`prf-dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 6 : 4}
                        fill="#06B6D4"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    );
                  })}

                {/* Interactive Vertical Hover Crosshair */}
                {hoveredIndex !== null && (
                  <line
                    x1={getVolumeX(hoveredIndex)}
                    y1={padding.top}
                    x2={getVolumeX(hoveredIndex)}
                    y2={padding.top + graphHeight}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="opacity-70"
                  />
                )}

                {/* X-Axis Date Labels */}
                {labelIndices.map((idx) => {
                  const d = activeData[idx];
                  if (!d) return null;
                  const x = getVolumeX(idx);
                  const label = d.date.slice(5);
                  return (
                    <text
                      key={`f-lbl-${idx}`}
                      x={x}
                      y={viewBoxHeight - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-fg-muted font-medium"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Invisible Hover Rectangles */}
                {activeData.map((_, i) => {
                  const width = graphWidth / Math.max(1, activeData.length - 1);
                  const x = getVolumeX(i) - width / 2;
                  return (
                    <rect
                      key={`hit-f-${i}`}
                      x={Math.max(padding.left, x)}
                      y={padding.top}
                      width={width}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  );
                })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredIndex !== null && activeData[hoveredIndex] && (
                <div
                  className="absolute pointer-events-none z-30 bg-surface/95 backdrop-blur-md border border-border-subtle p-3 rounded-lg shadow-2xl text-xs space-y-1.5 animate-fade-in"
                  style={{
                    left: `${(getVolumeX(hoveredIndex) / viewBoxWidth) * 100}%`,
                    top: '10px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="font-bold text-fg border-b border-border-subtle pb-1 flex items-center justify-between gap-3">
                    <span>{activeData[hoveredIndex].date}</span>
                    <span className="text-[10px] font-semibold text-emerald-500">
                      Margin:{' '}
                      {(activeData[hoveredIndex].income ?? 0) > 0
                        ? (
                            ((activeData[hoveredIndex].profit ?? 0) /
                              (activeData[hoveredIndex].income ?? 1)) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-emerald-500 font-medium">
                    <span>Gross Revenue:</span>
                    <strong className="tabular-nums font-bold">
                      {currencySymbol}{Number(activeData[hoveredIndex].income ?? 0).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-cyan-500 font-medium">
                    <span>Net Profit:</span>
                    <strong className="tabular-nums font-bold">
                      {currencySymbol}{Number(activeData[hoveredIndex].profit ?? 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
