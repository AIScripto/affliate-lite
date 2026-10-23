import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Users, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { User } from '../../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentTab: 'admin' | 'portal';
  onTabChange: (tab: 'admin' | 'portal') => void;
  currentUser: User | null;
  users: User[];
  onUserChange: (user: User) => void;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  users,
  onUserChange,
  onOpenSimulator,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange('admin')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Affiliate<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">X</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                    S2S Engine
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Multi-Tier Tracking &amp; Ledger Hub</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentTab === 'admin'
                    ? 'btn-3d-indigo text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Master Admin Hub
              </button>
              <button
                onClick={() => onTabChange('portal')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentTab === 'portal'
                    ? 'btn-3d-emerald text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Sub-Affiliate Portal
              </button>
            </nav>
          </div>

          {/* Right Section: Theme Toggle, Simulator Button & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Multi-Theme Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* S2S Webhook Simulator Trigger */}
            <button
              onClick={onOpenSimulator}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-sm"
              title="Simulate Brand Webhook Postback"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
              <span>Simulate S2S Sale</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-sm">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${
                  currentUser?.role === 'admin' 
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                }`}>
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser?.full_name || 'Select Persona'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">?ref={currentUser?.ref_code}</span>
                    <span>•</span>
                    <span>{currentUser?.role === 'admin' ? '100% Margin' : `${currentUser?.split_pct}% Split`}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Persona
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onUserChange(u);
                      if (u.role === 'admin') onTabChange('admin');
                      else onTabChange('portal');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      currentUser?.id === u.id ? 'bg-indigo-50/80 dark:bg-slate-800/60 font-semibold text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                        <span>{u.full_name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 ml-3.5">ref={u.ref_code}</span>
                    </div>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {u.role === 'admin' ? 'Direct' : `${u.split_pct}%`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
