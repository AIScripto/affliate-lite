import { OfferBuilder, OfferBuilderProps } from './OfferBuilder';

export interface OfferBuilderModalProps extends Omit<OfferBuilderProps, 'onBack'> {
  isOpen: boolean;
  onClose: () => void;
}

export function OfferBuilderModal({
  isOpen,
  onClose,
  offer,
  networks,
  domains,
  onSuccess,
}: OfferBuilderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl rounded-xl bg-surface border border-border-subtle shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto p-6">
        <OfferBuilder
          offer={offer}
          networks={networks}
          domains={domains}
          onBack={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}

export { OfferBuilder };
export type { OfferBuilderProps };
