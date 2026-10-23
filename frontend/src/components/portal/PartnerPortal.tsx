import React, { useState } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  Wallet, 
  MousePointerClick, 
  DollarSign, 
  TrendingUp, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Product, SubAffiliateStatsResponse } from '../../types';
import { simulateClick, requestPayout } from '../../services/api';

interface PartnerPortalProps {
  stats: SubAffiliateStatsResponse | null;
  products: Product[];
  onRefresh: () => void;
  onOpenSimulator: () => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({
  stats,
  products,
  onRefresh,
  onOpenSimulator,
}) => {
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>(
    products[0]?.slug || 'running-shoe-123'
  );
  const [selectedSource, setSelectedSource] = useState<string>('youtube');
  const [campaignTag, setCampaignTag] = useState<string>('winter_sale_26');
  const [sub1, setSub1] = useState<string>('header_btn');
  const [copied, setCopied] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingClick, setTestingClick] = useState<boolean>(false);
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  if (!stats) {
    return (
      <div className="py-12 text-center text-slate-500">
        Loading partner portal telemetry...
      </div>
    );
  }

  const { user, metrics, trafficBySource, personalLedger } = stats;

  // Base URL for generated tracking links
  const origin = window.location.origin;
  const generatedLink = `${origin}/go/${selectedProductSlug}?ref=${user.refCode}&src=${selectedSource}&camp=${campaignTag}${sub1 ? `&sub1=${sub1}` : ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestClick = async () => {
    setTestingClick(true);
    setTestResult(null);
    try {
      const res = await simulateClick(selectedProductSlug, {
        ref: user.refCode,
        src: selectedSource,
        camp: campaignTag,
      });
      setTestResult(res);
      onRefresh(); // Refresh metrics after click
    } catch (err) {
      alert('Error testing tracking click: ' + (err as Error).message);
    } finally {
      setTestingClick(false);
    }
  };

  const handleRequestPayout = async () => {
    if (user.walletApproved <= 0) {
      alert('Approved wallet balance is currently $0.00. Sales become approved once brand return windows clear.');
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await requestPayout(user.id);
      setPayoutMsg(res.message);
      onRefresh();
      setTimeout(() => setPayoutMsg(null), 4000);
    } catch (err) {
      alert('Payout request failed: ' + (err as Error).message);
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Sub-Affiliate Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Partner Hub: {user.fullName}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono shadow-sm">
              ?ref={user.refCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal promotional links, live commission telemetry, and audited wallet payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
            Split Tier: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user.splitPct}%</span> of Brand Payout
          </div>
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
            title="Simulate Brand Webhook Postback"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Sale</span>
          </button>
          <button
            onClick={handleRequestPayout}
            disabled={payoutLoading || user.walletApproved <= 0}
            className="btn-3d-emerald flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            <span>{payoutLoading ? 'Requesting...' : 'Request Payout'}</span>
          </button>
        </div>
      </div>

      {payoutMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{payoutMsg}</span>
        </div>
      )}

      {/* KPI Cards (Wireframe B) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Clicks (30D)"
          value={metrics.clicks30d.toLocaleString()}
          subtitle={`Conversion Rate: ${metrics.conversionRate}%`}
          icon={MousePointerClick}
          badge={`${metrics.conversionRate}% CR`}
          badgeType="indigo"
          accentColor="border-indigo-500/20"
        />
        <StatCard
          title="Approved Wallet"
          value={`$${user.walletApproved.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Ready for Instant Payout"
          icon={Wallet}
          badge="Available"
          badgeType="emerald"
          accentColor="border-emerald-500/30"
        />
        <StatCard
          title="Pending Wallet"
          value={`$${user.walletPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Awaiting Brand Return Window"
          icon={TrendingUp}
          badge="In Escrow"
          badgeType="amber"
          accentColor="border-amber-500/20"
        />
        <StatCard
          title="Earnings Per Click (EPC)"
          value={`$${metrics.epc.toFixed(2)}`}
          subtitle={`Lifetime Earned: $${metrics.totalEarned.toFixed(2)}`}
          icon={DollarSign}
          badge="EPC Yield"
          badgeType="emerald"
          accentColor="border-emerald-500/20"
        />
      </div>

      {/* Promotional Link Generator (Wireframe B Core Requirement) */}
      <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
              Promotional Link Generator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select product and traffic source parameters to generate trackable links with sub-50ms redirection
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product
            </label>
            <select
              value={selectedProductSlug}
              onChange={(e) => setSelectedProductSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title} (${p.retail_price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Traffic Channel (src)
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 capitalize shadow-sm"
            >
              <option value="youtube">YouTube (Review / Shorts)</option>
              <option value="tiktok">TikTok (Bio / Video)</option>
              <option value="instagram">Instagram (Story / Reel)</option>
              <option value="facebook">Facebook (Post / Ads)</option>
              <option value="telegram">Telegram (Community)</option>
              <option value="blog">SEO Blog / Website</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campaign Tag (camp)
            </label>
            <input
              type="text"
              value={campaignTag}
              onChange={(e) => setCampaignTag(e.target.value)}
              placeholder="e.g. winter_sale_26"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sub Tag (sub1)
            </label>
            <input
              type="text"
              value={sub1}
              onChange={(e) => setSub1(e.target.value)}
              placeholder="e.g. header_btn"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Generated URL Box */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all select-all font-semibold">
              {generatedLink}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyLink}
                className="btn-3d-emerald flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPY LINK</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTestClick}
                disabled={testingClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
                title="Test click telemetry without leaving page"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{testingClick ? 'Testing...' : 'Test Click'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Test Click Inspection Box */}
        {testResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-xs shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Click Intercepted &amp; Outbound Brand Parameters Injected!
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Intercept Latency: <strong className="text-emerald-600 dark:text-emerald-300">{testResult.latency_ms}ms</strong>
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1 bg-white/90 dark:bg-black/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 break-all shadow-inner">
              <div>
                <span className="text-slate-500">Minted Click ID: </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{testResult.click_id}</span>
              </div>
              <div>
                <span className="text-slate-500">Destination Brand URL: </span>
                <span className="text-emerald-700 dark:text-emerald-300">{testResult.redirect_to}</span>
              </div>
              <div>
                <span className="text-slate-500">Telemetry Logged: </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {testResult.telemetry?.device} • {testResult.telemetry?.os} • {testResult.telemetry?.browser} • {testResult.telemetry?.city}, {testResult.telemetry?.country}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Traffic by Source & Sold Items (Wireframe B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide mb-4">
            My Traffic by Source &amp; Channel Performance
          </h2>
          <div className="space-y-3 font-mono text-xs">
            {trafficBySource.length === 0 ? (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                No channel traffic recorded yet. Generate a promotional link above!
              </div>
            ) : (
              trafficBySource.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white capitalize font-sans">{s.source}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.clicks} Clicks <span className="text-slate-400 dark:text-slate-600">•</span> {s.orders_sold} Sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${Number(s.earned).toFixed(2)} Earned</div>
                    <div className="text-[10px] text-slate-500">EPC: ${s.epc || 0} ({s.cr_pct || 0}% CR)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personal Sales & Conversion Ledger (Scoped Strictly) */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Personal Conversions &amp; Commission Ledger
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Scoped to {user.refCode}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-2.5">Item</th>
                  <th className="py-2.5 px-2.5">Order ID</th>
                  <th className="py-2.5 px-2.5">My Comm</th>
                  <th className="py-2.5 px-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {personalLedger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">
                      No conversions yet. Share your links or test via the Simulator!
                    </td>
                  </tr>
                ) : (
                  personalLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-2.5 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{row.product_name}</div>
                        <div className="text-[10px] text-slate-500">{row.brand_name} ({row.src})</div>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-700 dark:text-slate-300">{row.brand_order_id}</td>
                      <td className="py-2.5 px-2.5 text-emerald-600 dark:text-emerald-400 font-bold">${Number(row.my_commission).toFixed(2)}</td>
                      <td className="py-2.5 px-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          row.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
