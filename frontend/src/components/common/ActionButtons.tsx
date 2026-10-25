import { Edit2, Copy, Power, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  isStatusActive?: boolean;
  statusTitle?: string;
  editTitle?: string;
  duplicateTitle?: string;
  deleteTitle?: string;
}

export function ActionButtons({
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  isStatusActive = true,
  statusTitle = 'Toggle Status',
  editTitle = 'Edit',
  duplicateTitle = 'Duplicate',
  deleteTitle = 'Delete',
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title={editTitle}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface border border-border-subtle text-amber-500 hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-400 active:scale-90 flex items-center justify-center transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}

      {onDuplicate && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title={duplicateTitle}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface border border-border-subtle text-sky-500 hover:bg-sky-500/15 hover:border-sky-500/40 hover:text-sky-400 active:scale-90 flex items-center justify-center transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}

      {onToggleStatus && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
          title={statusTitle}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border active:scale-90 flex items-center justify-center transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer ${
            isStatusActive
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-500 hover:bg-emerald-500/25 hover:border-emerald-500/50 hover:text-emerald-400'
              : 'bg-surface border-border-subtle text-fg-muted hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title={deleteTitle}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface border border-border-subtle text-rose-500 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-400 active:scale-90 flex items-center justify-center transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
