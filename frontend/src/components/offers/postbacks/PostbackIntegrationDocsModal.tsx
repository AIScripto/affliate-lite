import { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Copy, Check, Terminal, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface PostbackIntegrationDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postbackUrl: string;
}

export function PostbackIntegrationDocsModal({
  isOpen,
  onClose,
  postbackUrl,
}: PostbackIntegrationDocsModalProps) {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const sampleClickId = '9cdf32d5-124e-4e06-b25b-4c92d3cec9dc';
  const effectiveUrl = postbackUrl.replace(/\{clickid\}|\{click_id\}/g, sampleClickId);

  const codeSnippets: Record<string, string> = {
    curl: `curl -X GET "${effectiveUrl}&goal=1&sum=150.00&action_id=ORDER-10928" \\
  -H "Accept: application/json"`,
    node: `// Node.js (Fetch API)
const clickId = req.query.clickid || "${sampleClickId}";
const postbackEndpoint = "${postbackUrl}"
  .replace("{clickid}", clickId);

const response = await fetch(\`\${postbackEndpoint}&sum=150.00&action_id=\${order.id}\`, {
  method: "GET",
  headers: { "Accept": "application/json" }
});

const result = await response.json();
console.log("Conversion registered:", result);`,
    python: `# Python (requests library)
import requests

click_id = request.args.get("clickid", "${sampleClickId}")
postback_url = "${postbackUrl}".replace("{clickid}", click_id)

params = {
    "sum": "150.00",
    "goal": "1",
    "action_id": "ORDER-10928",
    "status": "1"
}

response = requests.get(postback_url, params=params, timeout=5)
print("Conversion registered:", response.json())`,
    php: `<?php
// PHP S2S Postback Call
$clickid = $_GET['clickid'] ?? '${sampleClickId}';
$url = str_replace('{clickid}', urlencode($clickid), '${postbackUrl}');
$url .= '&sum=150.00&goal=1&action_id=' . urlencode($order_id);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
curl_close($ch);
?>`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Advertiser S2S Postback Integration Documentation"
      size="xl"
    >
      <div className="space-y-6 text-xs text-fg">
        {/* Intro */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle">
          <h3 className="font-bold text-sm text-black dark:text-white mb-1.5 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span>Server-to-Server (S2S) Attribution Protocol</span>
          </h3>
          <p className="text-fg-muted">
            When a visitor clicks an affiliate link, AffiliateX generates a unique{' '}
            <code className="text-primary font-mono text-[11px]">&#123;clickid&#125;</code> and appends
            it to your Destination URL. When the user completes an order or registration on your site,
            your server must send an HTTP GET or POST request to our postback endpoint with that clickid.
          </p>
        </div>

        {/* Code Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-black dark:text-white">Sample Postback Code:</span>
            <div className="inline-flex rounded-lg border border-border-subtle p-0.5 bg-surface-elevated">
              {(['curl', 'node', 'python', 'php'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition uppercase ${
                    activeLang === lang
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl border border-border-subtle bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <button
              type="button"
              onClick={handleCopyCode}
              className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans flex items-center gap-1 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied ✓' : 'Copy'}</span>
            </button>
            <pre className="pr-16">{codeSnippets[activeLang]}</pre>
          </div>
        </div>

        {/* Key Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-1.5">
            <div className="font-bold text-black dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Idempotent Postback Processing</span>
            </div>
            <p className="text-fg-muted">
              Duplicate webhook requests for the same clickid and goal will not result in double
              accruals or duplicate payouts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-1.5">
            <div className="font-bold text-black dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              <span>Response Codes & Schema</span>
            </div>
            <p className="text-fg-muted">
              On success, the endpoint returns HTTP 200 with JSON:{' '}
              <code className="text-primary font-mono text-[11px]">
                &#123;"status":"ok","conversion_id":4812&#125;
              </code>.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <span>Close Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
