import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Globe,
  Network as NetworkIcon,
  Tag,
  BarChart3,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  User as UserIcon,
  BookmarkPlus,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type NavItem =
  | 'dashboard'
  | 'publishers'
  | 'domains'
  | 'networks'
  | 'offers'
  | 'notifications'
  | 'report-networks'
  | 'report-offers'
  | 'report-publishers';

interface AdminLayoutProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentNav, onNavigate, children }: AdminLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportsExpanded, setReportsExpanded] = useState(
    currentNav.startsWith('report-')
  );

  const getBreadcrumb = () => {
    switch (currentNav) {
      case 'dashboard':
        return 'Dashboard';
      case 'publishers':
        return 'Publisher';
      case 'domains':
        return 'Domain';
      case 'networks':
        return 'Network';
      case 'offers':
        return 'Offers';
      case 'notifications':
        return 'Notifications';
      case 'report-networks':
        return 'Networks Report';
      case 'report-offers':
        return 'Offers Report';
      case 'report-publishers':
        return 'Publishers Report';
      default:
        return 'Dashboard';
    }
  };

  const navItemClass = (isActive: boolean) =>
    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-primary/25 border-t border-white/20 active:translate-y-0.5'
        : 'text-fg-muted hover:text-fg hover:bg-surface-elevated/70 active:translate-y-0.5'
    }`;

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-row font-sans">
      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border-subtle flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border-subtle flex items-center gap-3 bg-surface">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 border-t border-white/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-fg">Oval Media</div>
            <div className="text-[10px] text-primary font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
              Affiliate Tracking
            </div>
          </div>
        </div>

        {/* User Profile Block */}
        <div className="px-4 py-3.5 border-b border-border-subtle/80 flex items-center gap-3 bg-surface-elevated/30">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-fg flex items-center justify-between truncate">
              <span className="truncate">Administrator</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-medium">Pro</span>
            </div>
            <div className="text-[11px] text-fg-muted truncate">zeeshan@gmail.com</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1">
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold text-fg-muted/70 uppercase tracking-wider">
            Navigation
          </div>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`w-full ${navItemClass(currentNav === 'dashboard')}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('publishers')}
            className={`w-full ${navItemClass(currentNav === 'publishers')}`}
          >
            <Users className="w-4 h-4" />
            <span>Publishers</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('domains')}
            className={`w-full ${navItemClass(currentNav === 'domains')}`}
          >
            <Globe className="w-4 h-4" />
            <span>Domain</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('networks')}
            className={`w-full ${navItemClass(currentNav === 'networks')}`}
          >
            <NetworkIcon className="w-4 h-4" />
            <span>Network</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('offers')}
            className={`w-full ${navItemClass(currentNav === 'offers')}`}
          >
            <Tag className="w-4 h-4" />
            <span>Offers</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className={`w-full justify-between ${navItemClass(currentNav === 'notifications')}`}
          >
            <div className="flex items-center gap-3">
              <BookmarkPlus className="w-4 h-4" />
              <span>Notifications</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                currentNav === 'notifications'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-primary/15 text-primary border border-primary/25'
              }`}
            >
              3
            </span>
          </button>

          {/* Expandable Reports Item */}
          <div>
            <button
              type="button"
              onClick={() => setReportsExpanded(!reportsExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                currentNav.startsWith('report-')
                  ? 'bg-surface-elevated text-fg font-semibold shadow-sm'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-elevated/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span>Report</span>
              </div>
              {reportsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-fg-muted" />
              )}
            </button>

            {reportsExpanded && (
              <div className="ml-5 pl-3 mt-1 space-y-1 border-l border-border-subtle/80">
                <button
                  type="button"
                  onClick={() => onNavigate('report-networks')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentNav === 'report-networks'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-fg-muted hover:text-fg hover:bg-surface-elevated/50'
                  }`}
                >
                  Networks
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-offers')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentNav === 'report-offers'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-fg-muted hover:text-fg hover:bg-surface-elevated/50'
                  }`}
                >
                  Offers
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-publishers')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentNav === 'report-publishers'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-fg-muted hover:text-fg hover:bg-surface-elevated/50'
                  }`}
                >
                  Publishers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Log Out */}
        <div className="p-3.5 border-t border-border-subtle/80 bg-surface">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                onNavigate('dashboard');
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-fg-muted hover:text-rose-500 hover:bg-rose-500/10 active:translate-y-0.5 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-surface-elevated border border-border-subtle text-fg hover:text-primary transition"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-fg-muted">Platform</span>
              <span className="text-fg-muted/60">/</span>
              <span className="text-fg font-bold tracking-tight">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-3d-subtle flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-fg hover:border-primary/50 transition cursor-pointer"
              title="Switch Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-warning" />
                  <span>Switch Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-primary" />
                  <span>Switch Theme</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content View - Max space, standard balanced margins */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
