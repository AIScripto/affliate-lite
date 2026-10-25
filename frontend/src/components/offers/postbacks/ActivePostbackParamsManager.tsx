import { Trash2, Eye, EyeOff, SlidersHorizontal, AlertCircle } from 'lucide-react';

export interface ActiveUrlParam {
  key: string;       // e.g. "clickid", "secure_token", "sum", "comment"
  value: string;     // e.g. "{clickid}", "sec_...", "{sum}"
  enabled: boolean;  // true = active in URL, false = disabled in URL
  isMandatory?: boolean; // e.g. clickid cannot be deleted
  label?: string;    // e.g. "Click ID", "Security Token", "Revenue / Amount"
}

interface ActivePostbackParamsManagerProps {
  params: ActiveUrlParam[];
  onToggleParam: (key: string) => void;
  onRemoveParam: (key: string) => void;
  onUpdateValue: (key: string, newValue: string) => void;
  onClearOptional: () => void;
}

export function ActivePostbackParamsManager({
  params,
  onToggleParam,
  onRemoveParam,
  onUpdateValue,
  onClearOptional,
}: ActivePostbackParamsManagerProps) {

  const activeCount = params.filter((p) => p.enabled).length;
  const disabledCount = params.filter((p) => !p.enabled).length;
  const optionalCount = params.filter((p) => !p.isMandatory).length;

  return (
    <div className="panel-card border border-border-subtle bg-surface-elevated/30 rounded-xl overflow-hidden mt-3 text-xs">
      {/* Header */}
      <div className="p-3 bg-surface-elevated/70 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
            Active URL Parameters
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {activeCount} active
          </span>
          {disabledCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {disabledCount} disabled
            </span>
          )}
        </div>

        {optionalCount > 0 && (
          <button
            type="button"
            onClick={onClearOptional}
            className="text-[11px] text-fg-muted hover:text-danger flex items-center gap-1 transition"
            title="Remove all optional parameters from URL"
          >
            <span>Remove all optional</span>
          </button>
        )}
      </div>

      {/* Parameters Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-elevated border-b border-border-subtle text-[10px] uppercase font-bold text-black dark:text-white shadow-sm">
            <tr className="bg-surface-elevated">
              <th className="py-2 px-3 bg-surface-elevated">Parameter</th>
              <th className="py-2 px-3 bg-surface-elevated">Macro / Value</th>
              <th className="py-2 px-2.5 bg-surface-elevated">Status</th>
              <th className="py-2 px-3 text-right bg-surface-elevated">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {params.map((p) => {
              const tokenStr = `&${p.key}`;
              return (
                <tr
                  key={p.key}
                  className={`transition group ${
                    p.enabled
                      ? 'hover:bg-surface-elevated/40'
                      : 'bg-surface-elevated/20 opacity-60'
                  }`}
                >
                  {/* Parameter Column */}
                  <td className="py-2 px-3 align-middle font-mono font-bold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={p.enabled ? 'text-primary' : 'text-fg-muted'}>
                        {tokenStr}
                      </span>
                      {p.isMandatory && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger/10 text-danger">
                          Required
                        </span>
                      )}
                    </div>
                    {p.label && (
                      <div className="text-[10px] text-fg-muted font-sans font-normal">
                        {p.label}
                      </div>
                    )}
                  </td>

                  {/* Macro / Value Column */}
                  <td className="py-2 px-3 align-middle font-mono">
                    <div className="flex items-center gap-1 max-w-[200px]">
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => onUpdateValue(p.key, e.target.value)}
                        placeholder={`{${p.key}}`}
                        className="w-full bg-surface border border-border-subtle text-fg rounded px-2 py-1 text-xs focus:outline-none focus:border-primary font-mono"
                        title={`Edit macro or value for ${tokenStr}`}
                      />
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="py-2 px-2.5 align-middle whitespace-nowrap">
                    {p.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Disabled</span>
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="py-2 px-3 align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Disable / Enable Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleParam(p.key)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition ${
                          p.enabled
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        }`}
                        title={
                          p.enabled
                            ? `Disable ${tokenStr} (exclude from URL)`
                            : `Enable ${tokenStr} (include in URL)`
                        }
                      >
                        {p.enabled ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Disable</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Enable</span>
                          </>
                        )}
                      </button>

                      {/* Remove / Delete Parameter from URL */}
                      {!p.isMandatory ? (
                        <button
                          type="button"
                          onClick={() => onRemoveParam(p.key)}
                          className="p-1 rounded text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition"
                          title={`Delete ${tokenStr} from URL`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span
                          className="p-1 text-fg-muted opacity-40 cursor-not-allowed"
                          title="Mandatory parameter cannot be deleted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {params.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-fg-muted">
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-fg-muted" />
                    <span>No active parameters. Click &quot;+ In URL&quot; from the table to add parameters.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
