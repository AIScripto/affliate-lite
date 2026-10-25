import { useState } from 'react';
import {
  Copy,
  Plus,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { ActiveUrlParam } from './ActivePostbackParamsManager';
import { AddCustomParamModal } from './AddCustomParamModal';

export interface PostbackParamItem {
  param: string;
  name: string;
  desc: string;
  example: string;
  required?: boolean;
  isCustom?: boolean;
  isDisabled?: boolean;
}

export const DEFAULT_POSTBACK_PARAMS: PostbackParamItem[] = [
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
  activeParams: ActiveUrlParam[];
  onAppendParam: (paramToken: string) => void;
  onRemoveParamFromUrl: (paramKey: string) => void;
  onToggleParamInUrl: (paramKey: string) => void;
  onCopyToken: (token: string) => void;
  allParams?: PostbackParamItem[];
  onParamsListChange?: (params: PostbackParamItem[]) => void;
}

export function PostbackParametersTable({
  activeParams,
  onAppendParam,
  onRemoveParamFromUrl,
  onToggleParamInUrl,
  onCopyToken,
  allParams: controlledParams,
  onParamsListChange,
}: PostbackParametersTableProps) {
  const [internalParams, setInternalParams] = useState<PostbackParamItem[]>(
    DEFAULT_POSTBACK_PARAMS
  );
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const paramsList = controlledParams || internalParams;

  const updateParams = (newParams: PostbackParamItem[]) => {
    if (onParamsListChange) {
      onParamsListChange(newParams);
    } else {
      setInternalParams(newParams);
    }
  };

  const handleCopy = (text: string) => {
    onCopyToken(text);
    setCopiedItem(text);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  // Delete existing parameter from library/table
  const handleDeleteParamFromLibrary = (paramToken: string) => {
    const cleanKey = paramToken.replace(/^&/, '');
    // Also remove from URL if active
    if (activeParams.some((p) => p.key === cleanKey)) {
      onRemoveParamFromUrl(cleanKey);
    }
    const updated = paramsList.filter((p) => p.param !== paramToken);
    updateParams(updated);
    onCopyToken(`Deleted ${paramToken} from parameters list ✓`);
  };

  // Toggle Disable/Enable parameter in library
  const handleToggleDisableInLibrary = (paramToken: string) => {
    const updated = paramsList.map((p) => {
      if (p.param === paramToken) {
        const nextDisabled = !p.isDisabled;
        if (nextDisabled) {
          // If disabling, also disable or remove from URL
          const cleanKey = paramToken.replace(/^&/, '');
          const existingInUrl = activeParams.find((a) => a.key === cleanKey);
          if (existingInUrl?.enabled) {
            onToggleParamInUrl(cleanKey);
          }
        }
        return { ...p, isDisabled: nextDisabled };
      }
      return p;
    });
    updateParams(updated);
  };

  // Restore Default Parameters
  const handleRestoreDefaults = () => {
    // Preserve custom parameters
    const customOnes = paramsList.filter((p) => p.isCustom);
    updateParams([...DEFAULT_POSTBACK_PARAMS, ...customOnes]);
    onCopyToken('Restored default postback parameters ✓');
  };

  // Add Custom Parameter
  const handleAddCustomParam = (newItem: PostbackParamItem) => {
    updateParams([...paramsList, newItem]);
    onCopyToken(`Added parameter ${newItem.param} ✓`);
  };

  const filtered = paramsList.filter(
    (p) =>
      p.param.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase())
  );

  const hasDeletedDefaults = DEFAULT_POSTBACK_PARAMS.some(
    (def) => !paramsList.some((p) => p.param === def.param)
  );

  return (
    <div className="panel-card border border-border-subtle bg-surface-elevated/40 rounded-xl overflow-hidden shadow-sm">
      {/* Header with Accordion toggle & Action buttons */}
      <div className="p-3.5 bg-surface-elevated/80 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
            Integration pixels parameters
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {paramsList.length} available
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasDeletedDefaults && (
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-surface border border-border-subtle hover:bg-surface-elevated text-fg-muted hover:text-fg flex items-center gap-1 transition"
              title="Restore deleted default parameters"
            >
              <RotateCcw className="w-3 h-3 text-primary" />
              <span>Restore Defaults</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1"
            title="Add a custom postback parameter"
          >
            <Plus className="w-3 h-3" />
            <span>Add Parameter</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-fg-muted hover:text-fg p-1 rounded transition ml-1"
            aria-label="Toggle parameters drawer"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
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
          <div className="rounded-lg border border-border-subtle overflow-hidden max-h-[560px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-elevated border-b border-border-subtle z-20 shadow-sm">
                <tr className="bg-surface-elevated">
                  <th className="py-2.5 px-3 bg-surface-elevated text-[11px] font-bold text-black dark:text-white uppercase">Parameter</th>
                  <th className="py-2.5 px-2.5 bg-surface-elevated text-[11px] font-bold text-black dark:text-white uppercase">Status</th>
                  <th className="py-2.5 px-3 bg-surface-elevated text-[11px] font-bold text-black dark:text-white uppercase">Description</th>
                  <th className="py-2.5 px-2 text-right bg-surface-elevated text-[11px] font-bold text-black dark:text-white uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {filtered.map((item) => {
                  const cleanKey = item.param.replace(/^&/, '');
                  const activeUrlItem = activeParams.find((a) => a.key === cleanKey);
                  const isInUrl = Boolean(activeUrlItem);
                  const isUrlActive = activeUrlItem?.enabled ?? false;
                  const isLibraryDisabled = Boolean(item.isDisabled);
                  const isCopied = copiedItem === item.param;

                  return (
                    <tr
                      key={item.param}
                      className={`transition group ${
                        isLibraryDisabled
                          ? 'bg-surface-elevated/20 opacity-55'
                          : 'hover:bg-surface-elevated/50'
                      }`}
                    >
                      {/* Parameter Name & Token */}
                      <td className="py-2.5 px-3 font-mono font-bold align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isLibraryDisabled
                                ? 'line-through text-fg-muted'
                                : 'text-primary'
                            }
                          >
                            {item.param}
                          </span>
                          {item.required && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger/10 text-danger">
                              Required
                            </span>
                          )}
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-fg-muted font-sans font-normal mt-0.5">
                          {item.name}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-2.5 px-2.5 align-top whitespace-nowrap">
                        {isLibraryDisabled ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span>Disabled</span>
                          </span>
                        ) : isInUrl ? (
                          isUrlActive ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>In URL ✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>URL: Disabled</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-normal text-fg-muted">
                            <span>Available</span>
                          </span>
                        )}
                      </td>

                      {/* Description & Example */}
                      <td className="py-2.5 px-3 text-fg-muted align-top text-[11px]">
                        <p className="leading-snug text-black dark:text-slate-200">
                          {item.desc}
                        </p>
                        <div className="text-[10px] text-fg-muted font-mono mt-1 opacity-75">
                          e.g: {item.example}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-2.5 px-2 text-right align-top whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* If Parameter is disabled in library, allow re-enabling */}
                          {isLibraryDisabled ? (
                            <button
                              type="button"
                              onClick={() => handleToggleDisableInLibrary(item.param)}
                              className="px-2 py-1 rounded bg-surface border border-border-subtle hover:bg-surface-elevated text-fg font-semibold text-[10px] transition flex items-center gap-1"
                              title="Re-enable parameter in library"
                            >
                              <Eye className="w-3 h-3 text-emerald-500" />
                              <span>Enable</span>
                            </button>
                          ) : (
                            <>
                              {/* URL Actions: Add to URL, Disable in URL, or Remove from URL */}
                              {isInUrl ? (
                                <>
                                  {/* Toggle URL active / disabled */}
                                  <button
                                    type="button"
                                    onClick={() => onToggleParamInUrl(cleanKey)}
                                    className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition ${
                                      isUrlActive
                                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                    }`}
                                    title={
                                      isUrlActive
                                        ? `Disable ${item.param} in URL`
                                        : `Enable ${item.param} in URL`
                                    }
                                  >
                                    {isUrlActive ? 'Disable' : 'Enable'}
                                  </button>

                                  {/* Remove from URL */}
                                  {!item.required && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveParamFromUrl(cleanKey)}
                                      className="p-1 rounded text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition"
                                      title={`Remove ${item.param} from URL`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAppendParam(item.param)}
                                  className="px-2 py-1 rounded bg-primary/10 hover:bg-primary hover:text-white text-primary text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                  title={`Append ${item.param} to S2S URL`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>In URL</span>
                                </button>
                              )}

                              {/* Copy Token Button */}
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

                              {/* Disable in Library Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleDisableInLibrary(item.param)}
                                className="p-1 rounded hover:bg-surface-elevated text-fg-muted hover:text-amber-600 transition"
                                title={`Disable ${item.param} in library`}
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Delete parameter from library */}
                          {!item.required && (
                            <button
                              type="button"
                              onClick={() => handleDeleteParamFromLibrary(item.param)}
                              className="p-1 rounded text-fg-muted hover:text-danger hover:bg-danger/10 transition"
                              title={`Delete ${item.param} from parameters list`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-fg-muted text-xs">
                      No matching postback parameters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Parameter Modal */}
      <AddCustomParamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomParam}
        existingKeys={paramsList.map((p) => p.param.toLowerCase())}
      />
    </div>
  );
}
