import { Modal } from '../../common/Modal';
import { ArrowRight } from 'lucide-react';

interface PostbackParamsDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostbackParamsDocsModal({ isOpen, onClose }: PostbackParamsDocsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Postback Parameters Quick Reference"
      size="lg"
    >
      <div className="space-y-4 text-xs text-fg">
        <p className="text-fg-muted">
          Here is a breakdown of the supported query parameters you can pass into the S2S postback
          URL to enrich conversion attribution and financial reporting:
        </p>

        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated/70 border-b border-border-subtle text-[11px] font-bold text-black dark:text-white uppercase tracking-wider">
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Required?</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&clickid</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger">
                    Mandatory
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  Unique click tracking UUID passed from the click redirect.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&action_id</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-fg-muted">
                    Recommended
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  Order ID or transaction reference in your billing system.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&sum</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-fg-muted">
                    Optional
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  Sale revenue or dynamic cart total amount (e.g. 149.99).
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&goal</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-fg-muted">
                    Optional
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  Goal index or event name (1 = default, lead, deposit, sale).
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&status</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-fg-muted">
                    Optional
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  1 = Approved, 2 = Pending, 3 = Declined, 5 = Hold.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-primary">&secure_token</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-fg-muted">
                    Optional
                  </span>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">
                  Tamper-protection secret token to prevent unauthorized calls.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <span>Understood</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
