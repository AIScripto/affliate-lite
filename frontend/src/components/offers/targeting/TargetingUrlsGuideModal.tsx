import { Modal } from '../../common/Modal';
import { Globe, GitFork, ArrowRight, ShieldCheck } from 'lucide-react';

interface TargetingUrlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TargetingUrlsGuideModal({ isOpen, onClose }: TargetingUrlsGuideModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How Targeting Group URLs Work"
      size="lg"
    >
      <div className="space-y-5 text-xs text-fg">
        <p className="text-sm text-fg-muted">
          Targeting Group URLs allow you to override the main Base Destination URL for traffic that
          matches this specific targeting group.
        </p>

        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <Globe className="w-4 h-4 text-primary" />
            <span>Localized Landing Pages & Geo-Specific Routing</span>
          </div>
          <p className="text-fg-muted">
            Direct matching visitors to language-specific or localized conversion funnels. For
            instance, route German traffic to your German store page{' '}
            <code className="text-primary font-mono text-[11px]">https://brand.de/offer?clickid=&#123;clickid&#125;</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <GitFork className="w-4 h-4 text-emerald-500" />
            <span>A/B Split-Testing with Weights (%)</span>
          </div>
          <p className="text-fg-muted">
            If you specify multiple URLs within the same targeting group with weights (e.g. 50% vs
            50%), the attribution engine automatically performs round-robin split-testing between
            the landing page variants.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Macro Substitution & Fallback</span>
          </div>
          <p className="text-fg-muted">
            All macros such as <code className="font-mono text-primary">&#123;clickid&#125;</code>,{' '}
            <code className="font-mono text-primary">&#123;pid&#125;</code>, and{' '}
            <code className="font-mono text-primary">&#123;sub1&#125;</code> are automatically populated.
            If no group URL is configured, traffic uses the Offer Base Destination URL.
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
