import { Modal } from '../../common/Modal';
import { Layers, CheckCircle2, ShieldCheck, Shuffle, ArrowRight } from 'lucide-react';

interface TargetingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TargetingGuideModal({ isOpen, onClose }: TargetingGuideModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How Targeting Groups Work in AffiliateX"
      size="xl"
    >
      <div className="space-y-6 text-xs text-fg">
        <p className="text-sm text-fg-muted">
          Targeting groups let you filter and direct traffic based on visitor location, device,
          operating system, browser, carrier, and IP addresses.
        </p>

        {/* 1. Multiple Groups & Priority */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <Layers className="w-4 h-4 text-primary" />
            <span>1. Multiple Targeting Groups & Rule Priority</span>
          </div>
          <p className="text-fg-muted">
            You can create multiple targeting groups (e.g. Group #1 for US/CA high-payout iOS users,
            Group #2 for UK Android users). The attribution engine evaluates groups in top-to-bottom
            order until a match is found.
          </p>
        </div>

        {/* 2. Condition Operators */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <Shuffle className="w-4 h-4 text-emerald-500" />
            <span>2. Condition Operator: AND vs OR</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-fg-muted">
            <li>
              <strong className="text-black dark:text-white">AND:</strong> Visitor must satisfy{' '}
              <em>all</em> active criteria (e.g. Country is US <strong>AND</strong> Device is iOS).
            </li>
            <li>
              <strong className="text-black dark:text-white">OR:</strong> Visitor matches if{' '}
              <em>any</em> condition is fulfilled (e.g. Country is UK <strong>OR</strong> Device is PC).
            </li>
          </ul>
        </div>

        {/* 3. Geo-Fencing & Exclusions */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>3. Geo-Fencing & Exclusions</span>
          </div>
          <p className="text-fg-muted">
            Checking <span className="text-danger font-semibold">Exclude</span> turns the rule into a
            blacklist. For example, selecting "Germany" with Exclude enabled allows all countries
            except Germany.
          </p>
        </div>

        {/* 4. Zero-Leak Fallback */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>4. Zero-Leak Safe Fallback (DOD Rule #6)</span>
          </div>
          <p className="text-fg-muted">
            If a click does not match any targeting group, it safely falls back to the Offer's
            primary <strong>Base Destination URL</strong> or the configured <strong>Trafficback URL</strong>.
            Traffic and revenue are never discarded or lost.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <span>Got it, close</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
