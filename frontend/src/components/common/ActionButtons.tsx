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
          className="w-8 h-8 rounded bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition shadow-sm"
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
          className="w-8 h-8 rounded bg-sky-500 hover:bg-sky-600 active:scale-95 text-white flex items-center justify-center transition shadow-sm"
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
          className={`w-8 h-8 rounded ${
            isStatusActive
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-primary hover:bg-primary-hover'
          } active:scale-95 text-white flex items-center justify-center transition shadow-sm`}
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
          className="w-8 h-8 rounded bg-danger hover:bg-red-700 active:scale-95 text-white flex items-center justify-center transition shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
