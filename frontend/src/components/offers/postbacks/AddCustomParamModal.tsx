import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { PostbackParamItem } from './PostbackParametersTable';

interface AddCustomParamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (param: PostbackParamItem) => void;
  existingKeys: string[];
}

export function AddCustomParamModal({
  isOpen,
  onClose,
  onAdd,
  existingKeys,
}: AddCustomParamModalProps) {
  const [paramKey, setParamKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [example, setExample] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let cleanKey = paramKey.trim();
    if (!cleanKey) {
      setError('Please enter a parameter key.');
      return;
    }
    if (!cleanKey.startsWith('&')) {
      cleanKey = `&${cleanKey}`;
    }
    // Check duplication
    if (existingKeys.includes(cleanKey.toLowerCase())) {
      setError(`Parameter "${cleanKey}" already exists.`);
      return;
    }

    onAdd({
      param: cleanKey,
      name: name.trim() || cleanKey.replace('&', ''),
      desc: desc.trim() || `Custom advertiser parameter: ${cleanKey.replace('&', '')}`,
      example: example.trim() || 'VALUE',
      isCustom: true,
      isDisabled: false,
    });

    // Reset and close
    setParamKey('');
    setName('');
    setDesc('');
    setExample('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-elevated border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black dark:text-white">
                Add Custom Postback Parameter
              </h3>
              <p className="text-[11px] text-fg-muted">
                Define an advertiser-specific query token
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-surface transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-black dark:text-white mb-1">
              Parameter Token <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. &sub_id, &aff_sub, or &order_val"
                value={paramKey}
                onChange={(e) => setParamKey(e.target.value)}
                className="w-full bg-surface-elevated border border-border-subtle text-fg font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-[10px] text-fg-muted mt-0.5">
              Query key passed in URL (auto-prefixed with & if omitted).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-black dark:text-white mb-1">
              Display Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sub Publisher ID"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-black dark:text-white mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Explain what this parameter contains and when advertisers should pass it"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-black dark:text-white mb-1">
              Example Value
            </label>
            <input
              type="text"
              placeholder="e.g. SUB_9981 or 99.50"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-fg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Parameter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
