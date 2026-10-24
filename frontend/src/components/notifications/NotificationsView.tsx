import { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Trash2,
  Check,
  Search,
} from 'lucide-react';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: 'CONVERSION' | 'CAP_ALERT' | 'PUBLISHER' | 'DOMAIN' | 'SECURITY';
  severity: 'info' | 'warning' | 'success' | 'danger';
  timestamp: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'New Conversion Logged',
    message: 'Conversion #1042 recorded for offer "Luovia - OA" ($150.00 payout).',
    category: 'CONVERSION',
    severity: 'success',
    timestamp: '10 minutes ago',
    isRead: false,
  },
  {
    id: 2,
    title: 'Offer Cap Threshold Alert',
    message: 'Offer "Luovia - OA" has reached 85% of its daily click limit (69 / 80 clicks).',
    category: 'CAP_ALERT',
    severity: 'warning',
    timestamp: '1 hour ago',
    isRead: false,
  },
  {
    id: 3,
    title: 'New Publisher Registered',
    message: 'Publisher "Farhan" (farhan@gmail.com) activated and assigned to master network.',
    category: 'PUBLISHER',
    severity: 'info',
    timestamp: '3 hours ago',
    isRead: false,
  },
  {
    id: 4,
    title: 'Domain SSL Active',
    message: 'Tracking domain "zshe.panel.7tracking.com" SSL certificate verified and active.',
    category: 'DOMAIN',
    severity: 'success',
    timestamp: '1 day ago',
    isRead: true,
  },
  {
    id: 5,
    title: 'Duplicate Conversion Blocked',
    message: 'Duplicate postback for transaction ID "tx_998124" rejected per Network policy.',
    category: 'SECURITY',
    severity: 'danger',
    timestamp: '2 days ago',
    isRead: true,
  },
];

const SEVERITY_CONFIG = {
  info: {
    bg: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: CheckCircle2,
  },
  danger: {
    bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    icon: ShieldAlert,
  },
};

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNREAD' | 'WARNINGS' | 'CONVERSIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    showToast('Notification marked as read');
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read');
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Notification removed');
  };

  const clearAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    showToast('Cleared read notifications');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category / Status Filter
      if (selectedFilter === 'UNREAD' && n.isRead) return false;
      if (selectedFilter === 'WARNINGS' && n.severity !== 'warning' && n.severity !== 'danger') return false;
      if (selectedFilter === 'CONVERSIONS' && n.category !== 'CONVERSION') return false;

      // Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMessage = n.message.toLowerCase().includes(q);
        const matchesCategory = n.category.toLowerCase().includes(q);
        return matchesTitle || matchesMessage || matchesCategory;
      }

      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-elevated border border-primary/40 text-fg px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-fg">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Real-time conversion events, offer caps, and platform security alerts
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle hover:border-primary text-xs font-medium text-fg hover:text-primary disabled:opacity-40 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={clearAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle hover:border-danger text-xs font-medium text-fg hover:text-danger transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="panel-card p-5 space-y-4">
        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-elevated border border-border-subtle overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                selectedFilter === 'ALL'
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('UNREAD')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                selectedFilter === 'UNREAD'
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('WARNINGS')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                selectedFilter === 'WARNINGS'
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Alerts & Warnings
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('CONVERSIONS')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                selectedFilter === 'CONVERSIONS'
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Conversions
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Table-First Layout per DOD */}
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border-subtle text-fg-muted uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4 w-32">Category</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4 text-right w-36">Time</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle font-normal text-fg">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const severityCfg = SEVERITY_CONFIG[item.severity];
                  const IconComponent = severityCfg.icon;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-elevated/40 transition ${
                        !item.isRead ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 text-center text-fg-muted">{item.id}</td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${severityCfg.bg}`}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{item.category}</span>
                        </span>
                      </td>

                      {/* Title & Message */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-fg flex items-center gap-2">
                          <span>{item.title}</span>
                          {!item.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                          )}
                        </div>
                        <div className="text-[11px] text-fg-muted mt-0.5">{item.message}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right tabular-nums text-fg-muted text-[11px]">
                        {item.timestamp}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {item.isRead ? (
                          <span className="text-[10px] text-fg-muted uppercase font-semibold">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase">
                            New
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className="p-1 rounded hover:bg-surface-elevated text-emerald-500 hover:text-emerald-400 transition"
                              title="Mark as Read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(item.id)}
                            className="p-1 rounded hover:bg-surface-elevated text-fg-muted hover:text-danger transition"
                            title="Delete Notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fg-muted font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Bell className="w-6 h-6 text-fg-muted opacity-40" />
                      <span>No notifications matching your filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
