import React from 'react';
import { StatusType, STATUS_CONFIGS } from '../../constants/theme';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const normalized = status.toUpperCase() as StatusType;
  const config = STATUS_CONFIGS[normalized] || {
    label: status,
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border shadow-xs ${sizeClass} ${config.badgeClass}`}
    >
      {config.hasPulse && config.dotColor && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor} mr-1.5 animate-pulse shadow-sm shadow-emerald-500/50`}
        />
      )}
      {config.label}
    </span>
  );
};

