import React, { useState } from 'react';
import { 
  MousePointerClick, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Globe, 
  Plus, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Monitor, 
  RefreshCw,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { 
  MasterReportSummary, 
  LeaderboardItem, 
  ConversionStreamItem, 
  DirectVsSubItem, 
  TrafficSourceItem 
} from '../../types';

interface DashboardStatsViewProps {
  summary: MasterReportSummary;
  directVsSub: DirectVsSubItem[];
  leaderboard: LeaderboardItem[];
  trafficSources: TrafficSourceItem[];
  geography: Array<{ country: string; clicks: number }>;
  devices: Array<{ device: string; clicks: number }>;
  liveStream: ConversionStreamItem[];
  onRefresh: () => void;
  onOpenSimulator: () => void;
  onNavigateToModule: (module: any) => void;
}

export const DashboardStatsView: React.FC<DashboardStatsViewProps> = ({
  summary,
  directVsSub,
  leaderboard,
  trafficSources,
  geography,
  devices,
  liveStream,
  onRefresh,
  onOpenSimulator,
  onNavigateToModule,
}) => {
  const [copiedClick, setCopiedClick] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClick(text);
    setTimeout(() => setCopiedClick(null), 2000);
  };

  const handleRefreshClick = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Sales &amp; Traffic Overview</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            See clicks, sales, and profits from your own links and from registered influencer partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
            title="Refresh Numbers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh Numbers'}</span>
          </button>
          <button
            onClick={onOpenSimulator}
            className="btn-3d-emerald flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Zap className="w-4 h-4 animate-pulse" />
            <span>Test a Sale (Simulator)</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clicks"
          value={summary.totalClicks.toLocaleString()}
          subtitle="All visitors clicking your links"
          icon={MousePointerClick}
          badge="100% Tracked"
          badgeType="indigo"
          accentColor="border-indigo-500/20"
        />
        <StatCard
          title="Direct Net Profit"
          value={`$${summary.directProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="From your own links (100% yours)"
          icon={DollarSign}
          badge="100% Yours"
          badgeType="emerald"
          accentColor="border-emerald-500/30"
        />
        <StatCard
          title="Partner Profit"
          value={`$${summary.subOverrideProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Your share from influencer sales"
          icon={TrendingUp}
          badge="Your Cut"
          badgeType="indigo"
          accentColor="border-indigo-500/30"
        />
        <StatCard
          title="Money to Pay Partners"
          value={`$${summary.subPayableLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Owed to registered influencers"
          icon={Wallet}
          badge="Partner Payouts"
          badgeType="amber"
          accentColor="border-amber-500/30"
        />
      </div>

      {/* Live Sales Feed (Table format) */}
      <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                Live Sales Feed (Real-Time)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every order sent by the brand store, showing how money is divided between you and your partners.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Test a Sale</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Tracking Click ID</th>
                <th className="py-2.5 px-3 font-semibold">Promoter / Partner</th>
                <th className="py-2.5 px-3 font-semibold">Where From (Channel)</th>
                <th className="py-2.5 px-3 font-semibold">Order Number</th>
                <th className="py-2.5 px-3 font-semibold">Total Commission</th>
                <th className="py-2.5 px-3 font-semibold">Partner Payout</th>
                <th className="py-2.5 px-3 font-semibold">Your Profit</th>
                <th className="py-2.5 px-3 font-semibold text-right">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              {liveStream.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-6 h-6 text-slate-400 dark:text-slate-600 animate-pulse" />
                      <span>No sales recorded yet. Click "Test a Sale" above to fire your first test order!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                liveStream.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <button
                        onClick={() => copyToClipboard(item.click_id)}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy Tracking ID"
                      >
                        {item.click_id}
                        {copiedClick === item.click_id && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        item.ref_code === 'direct'
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {item.ref_code === 'direct' ? 'YOU (Direct Link)' : item.ref_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-sans">
                      <span className="capitalize">{item.src}</span>
                      <span className="text-slate-400 dark:text-slate-600 mx-1">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-500">{item.camp}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">{item.brand_order_id}</td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">${Number(item.gross_comm).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold">${Number(item.sub_pay).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">${Number(item.net_profit).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings Comparison & Top Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct vs Partner Comparison */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Your Earnings: Direct Links vs Partner Links
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Live Split Summary
            </span>
          </div>

          <div className="space-y-4">
            {directVsSub.map((item, idx) => {
              const isDirect = item.category.includes('Direct');
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isDirect
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/20 shadow-sm'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isDirect ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isDirect 
                        ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20' 
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    }`}>
                      {isDirect ? '100% Profit (Your Own Links)' : 'Profit Share from Influencers'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-black/30 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Sales Generated</div>
                      <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        ${Number(item.total_sale_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-black/30 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Your Net Profit</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        ${Number(item.net_master_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-black/30 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Conversion Rate</div>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                        {item.conversion_rate || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Partners */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Top Earning Partners
            </h2>
            <button
              onClick={() => onNavigateToModule('sub-affiliates')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-semibold"
            >
              <span>Manage Partners</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-sans">
                No partner sales recorded yet.
              </div>
            ) : (
              leaderboard.slice(0, 4).map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{sub.full_name}</span>
                        {sub.is_suspicious_spike && (
                          <span className="text-[9px] bg-rose-500/10 text-rose-500 dark:text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/20 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> High Activity
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        ?ref={sub.ref_code} • {sub.split_pct}% Partner Share
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +${Number(sub.master_override || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Your Net Cut</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Traffic Channels, Devices, and Geography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>Where Visitors Came From</span>
          </h2>
          <div className="space-y-2.5">
            {trafficSources.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No traffic recorded yet</div>
            ) : (
              trafficSources.slice(0, 5).map((ts, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold">{ts.source}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500 dark:text-slate-400">{ts.clicks} clicks</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ts.cr_pct}% bought</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Devices */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>Phones vs Computers</span>
          </h2>
          <div className="space-y-2.5">
            {devices.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No devices recorded yet</div>
            ) : (
              devices.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    {d.device.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{d.device}</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{d.clicks} clicks</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Geography */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>Countries</span>
          </h2>
          <div className="space-y-2.5">
            {geography.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No countries recorded yet</div>
            ) : (
              geography.map((g, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{g.country}</span>
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{g.clicks}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
