import React, { useState } from 'react';
import { 
  Webhook, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Terminal,
  Table as TableIcon
} from 'lucide-react';
import { firePostback } from '../../services/api';
import { BrandParam } from '../../types';

interface PostbackS2SConfigProps {
  brands: BrandParam[];
  onRefresh: () => void;
}

type TabType = 'fields' | 'simulator' | 'curl';

export const PostbackS2SConfig: React.FC<PostbackS2SConfigProps> = ({
  brands,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Postback Sandbox State
  const [testClickId, setTestClickId] = useState('clk_demo_101');
  const [testOrderId, setTestOrderId] = useState(`ORD_${Math.floor(100000 + Math.random() * 900000)}`);
  const [testSaleAmount, setTestSaleAmount] = useState('180.00');
  const [testGrossComm, setTestGrossComm] = useState('18.00');
  const [selectedBrandSecret, setSelectedBrandSecret] = useState(brands[0]?.postback_secret || '');
  const [loading, setLoading] = useState(false);
  const [postbackResult, setPostbackResult] = useState<any>(null);
  const [postbackError, setPostbackError] = useState<string | null>(null);

  const origin = window.location.origin;
  const postbackUrl = `${origin}/api/v1/postback`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFireTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPostbackResult(null);
    setPostbackError(null);

    try {
      const res = await firePostback({
        click_id: testClickId,
        order_id: testOrderId,
        sale_amount: parseFloat(testSaleAmount),
        gross_comm: parseFloat(testGrossComm),
        secret: selectedBrandSecret || undefined,
      });

      if (res.error) {
        setPostbackError(res.error);
      } else {
        setPostbackResult(res);
        onRefresh();
        // Generate new random order ID for next test
        setTestOrderId(`ORD_${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (err) {
      setPostbackError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const curlExample = `curl -X POST "${postbackUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "click_id": "${testClickId}",
    "order_id": "${testOrderId}",
    "sale_amount": ${testSaleAmount},
    "gross_comm": ${testGrossComm},
    "secret": "${selectedBrandSecret || 'sec_brand_token'}"
  }'`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Webhook className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Where Brand Sends Sales (Webhooks)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            When a visitor buys on the brand store, the brand automatically sends sales info to your link below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Webhook Receiver Ready
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fields')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'fields'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Webhook Link &amp; Accepted Fields</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Test a Sale (Simulator)</span>
        </button>

        <button
          onClick={() => setActiveTab('curl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'curl'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Developer cURL Code</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: WEBHOOK LINK & FIELDS TABLE */}
      {/* ============================================================== */}
      {activeTab === 'fields' && (
        <div className="space-y-6">
          {/* Webhook Address Box */}
          <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide mb-1">
              Your Webhook Receiving Link
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Give this link to your affiliate network or store developer. When an order happens, they notify this URL:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <span className="font-mono text-xs text-slate-900 dark:text-white break-all font-bold">
                {postbackUrl}
              </span>
              <button
                onClick={() => handleCopy(postbackUrl, 'main-url')}
                className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm flex-shrink-0 self-start sm:self-auto"
              >
                {copiedKey === 'main-url' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'main-url' ? 'Copied Link!' : 'Copy Webhook Link'}</span>
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Safe tracking enabled: If the brand accidentally sends the same order twice, you are protected against double payments.</span>
            </div>
          </div>

          {/* TABLE OF ACCEPTED FIELDS */}
          <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-500" />
                  <span>Accepted Field Names (Data Table)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The brand can send any of the accepted names below. Our system recognizes them automatically:
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Field Name</th>
                    <th className="py-2.5 px-3">Also Known As (Aliases)</th>
                    <th className="py-2.5 px-3">What is this?</th>
                    <th className="py-2.5 px-3 text-right">Required?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3.5 text-emerald-600 dark:text-emerald-400 font-bold">click_id</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">click_ref, subId1, subid</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">The unique Tracking ID created when visitor clicked</td>
                    <td className="py-2.5 px-3 text-right font-sans text-emerald-600 font-bold">Required</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3.5 text-emerald-600 dark:text-emerald-400 font-bold">order_id</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">brand_order_id, transaction_id</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">The customer receipt or invoice number</td>
                    <td className="py-2.5 px-3 text-right font-sans text-emerald-600 font-bold">Required</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">gross_comm</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">commission, payout</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">Total commission money paid by the brand ($)</td>
                    <td className="py-2.5 px-3 text-right font-sans text-emerald-600 font-bold">Required</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">sale_amount</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">amount, order_value</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">Customer total shopping cart value ($)</td>
                    <td className="py-2.5 px-3 text-right font-sans text-slate-400 font-medium">Optional</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3.5 text-amber-600 dark:text-amber-400 font-bold">secret</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">token, x-postback-secret header</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">Secret password to verify the sale is genuine</td>
                    <td className="py-2.5 px-3 text-right font-sans text-amber-600 font-semibold">Recommended</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TEST A SALE SIMULATOR */}
      {/* ============================================================== */}
      {activeTab === 'simulator' && (
        <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>Test a Sale Simulator</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate an order to test how profits are calculated and split automatically between you and your partners.
            </p>
          </div>

          <form onSubmit={handleFireTest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tracking Click ID (Target)
                </label>
                <input
                  type="text"
                  required
                  value={testClickId}
                  onChange={(e) => setTestClickId(e.target.value)}
                  placeholder="e.g. clk_demo_101"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Use clk_demo_101 (Partner) or clk_demo_102 (Direct)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Order Invoice ID
                </label>
                <input
                  type="text"
                  required
                  value={testOrderId}
                  onChange={(e) => setTestOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Auto-generated test order number</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Cart Total ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={testSaleAmount}
                  onChange={(e) => setTestSaleAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Commission Paid ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={testGrossComm}
                  onChange={(e) => setTestGrossComm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Brand Secret Password:</span>
                <select
                  value={selectedBrandSecret}
                  onChange={(e) => setSelectedBrandSecret(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  {brands.map(b => (
                    <option key={b.id} value={b.postback_secret}>
                      {b.brand_name} ({b.postback_secret})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-3d-emerald flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Processing Sale...' : 'Fire Test Sale'}</span>
              </button>
            </div>
          </form>

          {/* Result Output */}
          {postbackResult && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 text-xs animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sale Successfully Recorded! Here is how money was split:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-slate-800/80 font-mono shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Brand Commission</span>
                  <span className="font-bold text-slate-900 dark:text-white">${Number(postbackResult.gross_commission || testGrossComm).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Partner's Share</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">${Number(postbackResult.sub_affiliate_payout || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Your Net Profit</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">${Number(postbackResult.master_net_profit || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 uppercase">{postbackResult.status || 'Approved'}</span>
                </div>
              </div>
            </div>
          )}

          {postbackError && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{postbackError}</span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DEVELOPER CURL COMMAND */}
      {/* ============================================================== */}
      {activeTab === 'curl' && (
        <div className="panel-3d rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>cURL Terminal Command</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You or your store developer can run this command directly in the terminal to test:
              </p>
            </div>
            <button
              onClick={() => handleCopy(curlExample, 'curl-tab')}
              className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
            >
              {copiedKey === 'curl-tab' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl-tab' ? 'Copied cURL!' : 'Copy cURL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed shadow-inner">
            {curlExample}
          </pre>
        </div>
      )}
    </div>
  );
};
