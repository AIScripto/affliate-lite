/**
 * Theme & UI Constants - Single Source of Truth for Design Tokens
 * Follows DESIGN.md specifications
 */

export type StatusType = 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'PENDING' 
  | 'DELETED' 
  | 'PUBLIC' 
  | 'PRIVATE' 
  | 'REQUIRES_APPROVAL'
  | 'LIVE'
  | 'ARCHIVED';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotColor?: string;
  hasPulse?: boolean;
}

export const STATUS_CONFIGS: Record<StatusType, StatusConfig> = {
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
    dotColor: 'bg-emerald-500',
    hasPulse: true,
  },
  LIVE: {
    label: 'Live',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    hasPulse: true,
  },
  PAUSED: {
    label: 'Paused',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
    dotColor: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    dotColor: 'bg-indigo-400',
  },
  DELETED: {
    label: 'Deleted',
    badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/25',
    dotColor: 'bg-rose-500',
  },
  PUBLIC: {
    label: 'Public',
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  PRIVATE: {
    label: 'Private',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  REQUIRES_APPROVAL: {
    label: 'Approval Req.',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  ARCHIVED: {
    label: 'Archived',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
};

export type MetricColor = 'indigo' | 'emerald' | 'sky' | 'purple' | 'amber';

export interface MetricTileStyle {
  containerClass: string;
  iconBgClass: string;
  iconTextClass: string;
  valueColorClass?: string;
  badgeClass?: string;
}

export const METRIC_COLOR_STYLES: Record<MetricColor, MetricTileStyle> = {
  indigo: {
    containerClass: 'tile-gradient-indigo',
    iconBgClass: 'bg-primary/20 border-primary/30',
    iconTextClass: 'text-primary',
    valueColorClass: 'text-fg',
  },
  emerald: {
    containerClass: 'tile-gradient-emerald',
    iconBgClass: 'bg-emerald-500/20 border-emerald-500/30',
    iconTextClass: 'text-emerald-500',
    valueColorClass: 'text-emerald-500',
    badgeClass: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30',
  },
  sky: {
    containerClass: 'tile-gradient-sky',
    iconBgClass: 'bg-sky-500/20 border-sky-500/30',
    iconTextClass: 'text-sky-500',
    valueColorClass: 'text-fg',
  },
  purple: {
    containerClass: 'tile-gradient-purple',
    iconBgClass: 'bg-purple-500/20 border-purple-500/30',
    iconTextClass: 'text-purple-400',
    valueColorClass: 'text-fg',
    badgeClass: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
  },
  amber: {
    containerClass: 'tile-gradient-amber',
    iconBgClass: 'bg-amber-500/20 border-amber-500/30',
    iconTextClass: 'text-amber-500',
    valueColorClass: 'text-amber-500',
    badgeClass: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
  },
};

