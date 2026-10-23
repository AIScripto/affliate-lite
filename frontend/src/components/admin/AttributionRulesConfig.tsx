import React from 'react';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  Clock, 
  Lock, 
  CheckCircle2
} from 'lucide-react';

export const AttributionRulesConfig: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Attribution &amp; Engine Rules Config
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Core mathematical commission models, cookie-less S2S click tracking policies, and zero-leak fallback routing rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            Engine Policy Active
          </span>
        </div>
      </div>

      {/* Two Core Revenue Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode A: Direct Traffic Rule */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-indigo-200 dark:border-indigo-500/30 p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shadow-sm">
                A
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                Mode A: Direct Master Traffic (100% Margin)
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-semibold">
              ?ref=direct
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Used when promoting products directly across your own media channels, YouTube videos, email newsletters, or website banners.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono shadow-inner">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Gross Commission:</span>
              <span className="text-slate-900 dark:text-white font-bold">100%</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Sub-Affiliate Payout:</span>
              <span className="text-slate-400 dark:text-slate-500 font-bold">$0.00 (None)</span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="font-bold">Master Admin Net Profit:</span>
              <span className="font-bold">100% of Commission</span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Zero partner liability generated. Full gross margin retained.</span>
          </div>
        </div>

        {/* Mode B: Sub-Affiliate Network Spread */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-emerald-200 dark:border-emerald-500/30 p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shadow-sm">
                B
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                Mode B: Sub-Affiliate Split &amp; Override
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
              ?ref=partner_code
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Used when registered influencers and partners drive traffic. Gross brand commission is automatically split per configured tier.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono shadow-inner">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Sub-Affiliate Share:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">split_pct (e.g. 60%)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Master Admin Override:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">(100 - split_pct)% (e.g. 40%)</span>
            </div>
            <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="font-bold">Ledger Split Execution:</span>
              <span className="font-bold">Atomic DB Transaction</span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pending liability credited to partner wallet pending brand clearance.</span>
          </div>
        </div>
      </div>

      {/* Operational Engine Policies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Zero-Leak Fallback Policy */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Zero-Leak Fallback Policy</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            If an inbound link has an unrecognized, invalid, or deactivated <code>ref</code> parameter, the engine automatically attributes traffic to the Master Admin (Mode A).
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-300 shadow-sm">
            Fallback target: user_role = 'admin', ref_code = 'direct'
          </div>
        </div>

        {/* Cookie-less S2S Attribution Window */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Attribution Window</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Click IDs persist inside the PostgreSQL database ledger. Unlike client-side cookies blocked by Safari ITP or ad-blockers, S2S tracking survives indefinitely.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-300 shadow-sm">
            Attribution window: 30-day conversion clearance
          </div>
        </div>

        {/* Telemetry & Privacy Standards */}
        <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Privacy &amp; Telemetry</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Client IP addresses are cryptographically hashed using SHA-256 for GDPR and CCPA compliance. Device and geo headers are resolved via User-Agent parsing.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-amber-600 dark:text-amber-300 shadow-sm">
            Redirect Latency Target: &lt;50ms response
          </div>
        </div>
      </div>
    </div>
  );
};
