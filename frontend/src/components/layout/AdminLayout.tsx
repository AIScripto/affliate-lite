import React, { useState, useRef, useEffect } from 'react';
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
  ShieldCheck,
  User as UserIcon,
  BookmarkPlus,
  Check,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type NavItem =
  | 'dashboard'
  | 'publishers'
  | 'domains'
  | 'networks'
  | 'offers'
  | 'notifications'
  | 'reports'
  | 'report-overview'
  | 'report-offers'
  | 'report-networks'
  | 'report-publishers'
  | 'report-conversions'
  | 'report-traffic';

interface AdminLayoutProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentNav, onNavigate, children }: AdminLayoutProps) {
  const { theme, setTheme, vivid, setVivid, themesList } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [reportsExpanded, setReportsExpanded] = useState(
    currentNav === 'reports' || currentNav.startsWith('report-')
  );

  useEffect(() => {
    if (currentNav === 'reports' || currentNav.startsWith('report-')) {
      setReportsExpanded(true);
    }
  }, [currentNav]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

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
      case 'reports':
      case 'report-overview':
        return 'Reports / Overview';
      case 'report-offers':
        return 'Reports / Offers';
      case 'report-networks':
        return 'Reports / Networks';
      case 'report-publishers':
        return 'Reports / Publishers';
      case 'report-conversions':
        return 'Reports / Conversions';
      case 'report-traffic':
        return 'Reports / Traffic';
      default:
        return 'Dashboard';
    }
  };

  const navItemClass = (isActive: boolean) =>
    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer sidebar-nav-btn ${
      isActive ? 'is-active' : ''
    }`;

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-row font-sans">
      {/* Left Sidebar */}
      <aside
        style={{
          background: 'var(--sidebar-bg, var(--color-surface))',
          borderColor: 'var(--sidebar-border, var(--color-border-subtle))',
        }}
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div
          style={{ borderColor: 'var(--sidebar-border)' }}
          className="h-16 px-5 border-b flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 border-t border-white/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight sidebar-heading">Oval Media</div>
            <div className="text-[10px] sidebar-text font-semibold tracking-wider uppercase flex items-center gap-1.5 opacity-90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
              Affiliate Tracking
            </div>
          </div>
        </div>

        {/* User Profile Block in Sidebar */}
        <div
          style={{
            borderColor: 'var(--sidebar-border)',
            background: 'var(--sidebar-hover)',
          }}
          className="px-4 py-3.5 border-b flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <span
              style={{ borderColor: 'var(--sidebar-bg)' }}
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold sidebar-heading flex items-center justify-between truncate">
              <span className="truncate">Administrator</span>
              <span
                style={{
                  background: 'var(--sidebar-hover)',
                  color: 'var(--sidebar-text)',
                  borderColor: 'var(--sidebar-border)',
                }}
                className="text-[10px] px-1.5 py-0.2 rounded border font-medium"
              >
                Pro
              </span>
            </div>
            <div className="text-[11px] sidebar-muted truncate">zeeshan@gmail.com</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1">
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold sidebar-muted uppercase tracking-wider">
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
                  ? 'bg-white/25 text-white border border-white/30'
                  : 'border'
              }`}
              style={
                currentNav !== 'notifications'
                  ? {
                      background: 'var(--sidebar-hover)',
                      color: 'var(--sidebar-text)',
                      borderColor: 'var(--sidebar-border)',
                    }
                  : undefined
              }
            >
              3
            </span>
          </button>

          {/* Expandable Reports Item */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer sidebar-nav-btn ${
                currentNav === 'reports' || currentNav.startsWith('report-') ? 'is-active' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onNavigate('reports');
                  setReportsExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportsExpanded(!reportsExpanded);
                }}
                className="p-1 hover:opacity-100 opacity-70 cursor-pointer"
              >
                {reportsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {reportsExpanded && (
              <div
                style={{ borderColor: 'var(--sidebar-border)' }}
                className="ml-5 pl-3 mt-1 space-y-1 border-l"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('report-overview')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-overview' || currentNav === 'reports' ? 'is-active' : ''
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-offers')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-offers' ? 'is-active' : ''
                  }`}
                >
                  Offers
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-networks')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-networks' ? 'is-active' : ''
                  }`}
                >
                  Networks
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-publishers')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-publishers' ? 'is-active' : ''
                  }`}
                >
                  Publishers
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-conversions')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-conversions' ? 'is-active' : ''
                  }`}
                >
                  Conversions
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-traffic')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition sidebar-nav-btn ${
                    currentNav === 'report-traffic' ? 'is-active' : ''
                  }`}
                >
                  Traffic & Clicks
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Log Out */}
        <div
          style={{
            borderColor: 'var(--sidebar-border)',
            background: 'var(--sidebar-hover)',
          }}
          className="p-3.5 border-t"
        >
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                onNavigate('dashboard');
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium sidebar-muted hover:text-rose-400 hover:bg-rose-500/15 active:translate-y-0.5 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar Header (Executive Balanced Appearance) */}
        <header
          style={{
            background: 'var(--topbar-bg, var(--color-surface))',
            borderColor: 'var(--topbar-border, var(--color-border-subtle))',
          }}
          className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-surface-elevated/60 hover:bg-surface-elevated border border-border-subtle text-fg-muted transition cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-fg-muted font-medium">Platform</span>
              <span className="text-fg-subtle">/</span>
              <span className="text-fg-heading font-bold tracking-tight text-sm">
                {getBreadcrumb()}
              </span>
            </div>
          </div>

          {/* Top Right: User & Appearance Popover Menu (Matching ERP Specification) */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="user-menu-button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <div className="user-menu-text hidden sm:flex">
                <span className="user-menu-name">Administrator</span>
                <span className="user-menu-role">System Admin</span>
              </div>
              <span className="user-avatar" aria-hidden="true">
                AD
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
            </button>

            {menuOpen && (
              <div
                className="user-menu-popover"
                role="menu"
                aria-label="Theme & Appearance"
              >
                <div className="user-menu-section-label">Theme & Appearance</div>
                <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-1">
                  {themesList.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === option.value}
                      className="user-menu-item"
                      onClick={() => setTheme(option.value)}
                      title={option.desc}
                    >
                      <span className="text-sm leading-none" aria-hidden="true">
                        {option.emoji}
                      </span>
                      <span className="flex-1 min-w-0 truncate font-medium text-xs">
                        {option.label}
                      </span>
                      <span
                        className="inline-flex gap-1 items-center px-1.5 py-0.5 rounded-full bg-surface-elevated border border-border-subtle"
                        aria-hidden="true"
                      >
                        {option.preview.map((color, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      {theme === option.value && (
                        <Check
                          className="w-4 h-4 user-menu-check"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="user-menu-divider" />

                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={vivid}
                  className="user-menu-item"
                  title="Soft depth and tactile lift on cards and tiles"
                  onClick={() => setVivid(!vivid)}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span className="flex-1 text-xs font-medium">Vivid Depth</span>
                  {vivid && (
                    <Check
                      className="w-4 h-4 user-menu-check"
                      aria-hidden="true"
                    />
                  )}
                </button>

                <div className="user-menu-divider" />

                <button
                  type="button"
                  role="menuitem"
                  className="user-menu-item is-danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      onNavigate('dashboard');
                      setMenuOpen(false);
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 text-danger" aria-hidden="true" />
                  <span className="text-xs font-semibold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content View - Max space, standard balanced margins */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
