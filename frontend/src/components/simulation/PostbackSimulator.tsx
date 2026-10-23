import React, { useState } from 'react';
import { X, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { firePostback } from '../../services/api';

interface PostbackSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PostbackSimulator: React.FC<PostbackSimulatorProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clickId, setClickId] = useState('clk_98412_yt01');
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [saleAmount, setSaleAmount] = useState('100.00');
  const [grossComm, setGrossComm] = useState('20.00');
  const [secretToken, setSecretToken] = useState('sec_nike_postback_99182');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFirePostback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await firePostback({
        click_id: clickId.trim(),
        order_id: orderId.trim(),
        sale_amount: parseFloat(saleAmount),
        gross_comm: parseFloat(grossComm),
        secret: secretToken.trim(),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
        onSuccess();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetClick: string, presetSecret: string, presetComm: string) => {
    setClickId(presetClick);
    setSecretToken(presetSecret);
    setGrossComm(presetComm);
    setOrderId(`ORD-${Math.floor(10000 + Math.random() * 90000)}`);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="panel-3d relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">S2S Postback Webhook Simulator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Simulate brand checkout completion &amp; test ledger split</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Quick Test Scenarios:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreset('clk_98412_yt01', 'sec_nike_postback_99182', '20.00')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors shadow-sm"
            >
              Sub-Affiliate: Ali Khan (60% split)
            </button>
            <button
              type="button"
              onClick={() => setPreset('clk_98414_dir03', 'sec_cj_network_44109', '40.00')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors shadow-sm"
            >
              Direct Link (100% Master Profit)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleFirePostback} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Click ID (click_id)
              </label>
              <input
                type="text"
                required
                value={clickId}
                onChange={(e) => setClickId(e.target.value)}
                placeholder="clk_..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand Order ID (Unique)
              </label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORD-99120"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shopper Sale Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="100.00"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gross Brand Commission ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={grossComm}
                onChange={(e) => setGrossComm(e.target.value)}
                placeholder="20.00"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Webhook Secret Token
            </label>
            <input
              type="text"
              value={secretToken}
              onChange={(e) => setSecretToken(e.target.value)}
              placeholder="sec_..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-mono focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Result Box */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-xs shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Postback Recorded &amp; Commission Split Calculated!</span>
              </div>
              <div className="space-y-1 font-mono text-slate-700 dark:text-slate-300 text-[11px] bg-white/90 dark:bg-black/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">Promoter:</span>
                  <span className="text-slate-900 dark:text-white">{result.attribution?.promoter} ({result.attribution?.ref_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Commission:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">${result.attribution?.gross_commission?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sub-Affiliate Payout:</span>
                  <span className="text-amber-600 dark:text-amber-400">${result.attribution?.sub_affiliate_payout?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Master Override Net Profit:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">${result.attribution?.master_override_net_profit?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-emerald flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing S2S Webhook...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fire S2S Postback Webhook</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
