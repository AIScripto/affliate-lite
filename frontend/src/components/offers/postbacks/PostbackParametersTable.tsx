import { useState } from 'react';
import { Copy, Plus, Check, Search, ChevronDown, ChevronUp } from 'lucide-react';

export interface PostbackParamItem {
  param: string;
  name: string;
  desc: string;
  example: string;
  required?: boolean;
}

export const POSTBACK_PARAMS: PostbackParamItem[] = [
  {
    param: '&clickid',
    name: 'Click ID',
    desc: 'Click ID - mandatory parameter passed by tracker upon user click',
    example: '8f7a2b91-4c3e-4d5a-8b1e-7f6a5b4c3d2e',
    required: true,
  },
  {
    param: '&action_id',
    name: 'Action / Order ID',
    desc: "Unique conversion ID in the advertiser's system (e.g. order number)",
    example: 'ORD-984210',
  },
  {
    param: '&action_timestamp',
    name: 'Action Timestamp',
    desc: 'Time of conversion creation: YYYY-MM-DD HH:MM, YYYY-MM-DD HH:MM:SS, or YYYY-MM-DD HH:MM:SS.mmm',
    example: '2026-10-25 14:30:00',
  },
  {
    param: '&goal',
    name: 'Goal / Event',
    desc: 'Goal number or event title: 1, lead, signup, purchase, deposit',
    example: '1',
  },
  {
    param: '&sum',
    name: 'Revenue / Amount',
    desc: 'Conversion revenue or total purchase amount in decimal format',
    example: '150.00',
  },
  {
    param: '&currency',
    name: 'Currency Code',
    desc: '3-Letter ISO 4217 Currency code (e.g. USD, EUR, GBP)',
    example: 'USD',
  },
  {
    param: '&ip',
    name: 'Visitor IP',
    desc: 'IP address of visitor who made a request (partially hidden by GDPR policy)',
    example: '192.168.1.1',
  },
  {
    param: '&status',
    name: 'Conversion Status',
    desc: 'Conversion status: Approved - 1, Pending - 2, Declined - 3, Hold - 5',
    example: '1',
  },
  {
    param: '&referrer',
    name: 'Referrer',
    desc: 'Referrer (additional information on traffic and deeplinks)',
    example: 'https://m.facebook.com',
  },
  {
    param: '&comment',
    name: 'Comment',
    desc: 'Optional advertiser note or reason (e.g. verified KYC)',
    example: 'Qualified lead',
  },
  {
    param: '&secure_token',
    name: 'Security Token',
    desc: 'Secret advertiser authentication token to prevent fraudulent postback calls',
    example: 'sec_8f93e10ab',
  },
  {
    param: '&custom_field_1',
    name: 'Custom Field 1',
    desc: 'Advertiser custom parameter 1 (coupon, campaign, category)',
    example: 'PROMO20',
  },
  {
    param: '&custom_field_2',
    name: 'Custom Field 2',
    desc: 'Advertiser custom parameter 2 (SKU, sub-publisher)',
    example: 'SKU-491',
  },
];

interface PostbackParametersTableProps {
  onAppendParam: (param: string) => void;
  onCopyToken: (token: string) => void;
}

export function PostbackParametersTable({
  onAppendParam,
  onCopyToken,
}: PostbackParametersTableProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const filtered = POSTBACK_PARAMS.filter(
    (p) =>
      p.param.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string) => {
    onCopyToken(text);
    setCopiedItem(text);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  return (
    <div className="panel-card border border-border-subtle bg-surface-elevated/40 rounded-xl overflow-hidden">
      {/* Header with Accordion toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-surface-elevated/80 border-b border-border-subtle flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
            Integration pixels parameters
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {POSTBACK_PARAMS.length} available
          </span>
        </div>
        <button
          type="button"
          className="text-fg-muted hover:text-fg p-1 rounded transition"
          aria-label="Toggle parameters drawer"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3.5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-fg-muted" />
            <input
              type="text"
              placeholder="Search parameters by name or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border-subtle text-fg rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border-subtle overflow-hidden max-h-[520px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-elevated border-b border-border-subtle z-10">
                <tr className="text-[11px] font-bold text-black dark:text-white uppercase">
                  <th className="py-2 px-3">Parameter</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {filtered.map((item) => {
                  const isCopied = copiedItem === item.param;
                  return (
                    <tr
                      key={item.param}
                      className="hover:bg-surface-elevated/50 transition group"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-primary align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.param}</span>
                          {item.required && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger/10 text-danger">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-fg-muted font-sans font-normal mt-0.5">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-fg-muted align-top text-[11px]">
                        <p className="leading-snug text-black dark:text-slate-200">{item.desc}</p>
                        <div className="text-[10px] text-fg-muted font-mono mt-1 opacity-75">
                          e.g: {item.example}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right align-top whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onAppendParam(item.param)}
                            className="px-2 py-1 rounded bg-primary/10 hover:bg-primary hover:text-white text-primary text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                            title={`Append ${item.param} to S2S URL`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>In URL</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.param)}
                            className="p-1 rounded hover:bg-surface-elevated text-fg-muted hover:text-fg transition"
                            title="Copy parameter token"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-fg-muted text-xs">
                      No matching postback parameters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
