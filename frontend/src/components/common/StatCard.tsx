import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'emerald',
  accentColor = 'border-slate-200 dark:border-slate-800',
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    slate: 'bg-slate-200 dark:bg-slate-700/30 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50',
  }[badgeType];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 dark:from-[#161F30] dark:via-[#131B2A] dark:to-[#0F172A] border ${accentColor} p-5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group`}>
      {/* 3D Top Bevel Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/15 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-black dark:text-white tracking-wider uppercase">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-indigo-600 dark:text-slate-300 shadow-sm group-hover:scale-110 group-hover:border-indigo-400/50 transition-all duration-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono drop-shadow-sm">
          {value}
        </span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-sm ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1 font-medium">
          {subtitle}
        </p>
      )}

      {/* Subtle 3D background atmospheric glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
    </div>
  );
};
