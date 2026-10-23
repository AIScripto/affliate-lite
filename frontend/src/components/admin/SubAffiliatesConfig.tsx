import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Percent, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  X
} from 'lucide-react';
import { User } from '../../types';
import { updateSubAffiliate, deleteSubAffiliate } from '../../services/api';

interface SubAffiliatesConfigProps {
  users: User[];
  onOpenCreateSubModal: () => void;
  onToggleUserStatus: (userId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  onRefresh: () => void;
}

export const SubAffiliatesConfig: React.FC<SubAffiliatesConfigProps> = ({
  users,
  onOpenCreateSubModal,
  onToggleUserStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Edit Partner Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSplitPct, setFormSplitPct] = useState('60.00');
  const [editLoading, setEditLoading] = useState(false);

  const subAffiliates = users.filter(u => u.role === 'sub_aff');

  const filteredAffiliates = subAffiliates.filter(u => {
    const matchesSearch = 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.ref_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = subAffiliates.filter(u => u.status === 'active').length;
  const pendingCount = subAffiliates.filter(u => u.status === 'inactive').length;
  const totalPendingWallet = subAffiliates.reduce((acc, u) => acc + Number(u.wallet_pending || 0), 0);

  const handleCopyRef = (refCode: string) => {
    const link = `${window.location.origin}/go/nike-air-max-270?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(refCode);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setFormFirstName(user.first_name || user.full_name.split(' ')[0] || '');
    setFormLastName(user.last_name || user.full_name.split(' ').slice(1).join(' ') || '');
    setFormEmail(user.email);
    setFormPhone(user.mobile_number || '');
    setFormSplitPct(String(user.split_pct));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);

    try {
      await updateSubAffiliate(editingUser.id, {
        first_name: formFirstName,
        last_name: formLastName,
        email: formEmail,
        mobile_number: formPhone,
        split_pct: parseFloat(formSplitPct),
      });
      setEditingUser(null);
      onRefresh();
    } catch (err) {
      alert('Failed to update partner: ' + (err as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePartner = async (user: User) => {
    if (confirm(`Are you sure you want to delete partner "${user.full_name}" (?ref=${user.ref_code})?`)) {
      try {
        await deleteSubAffiliate(user.id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete partner: ' + (err as Error).message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sub-Affiliate Partners &amp; Splits Config
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage influencer network accounts, commission split percentages, contact information, and approval statuses.
          </p>
        </div>

        <button
          onClick={onOpenCreateSubModal}
          className="btn-3d-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Sub-Affiliate</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Registered Partners</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">{subAffiliates.length}</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Partners</div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{activeCount}</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pending Approval</div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{pendingCount}</div>
        </div>
        <div className="panel-3d p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pending Partner Pool</div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            ${totalPendingWallet.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Partner Table & Filter Section */}
      <div className="panel-3d rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Registered Partner Network ({filteredAffiliates.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'active' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'inactive' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Inactive
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, ref, email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 font-semibold">Partner Name</th>
                <th className="py-3 px-3 font-semibold">Contact</th>
                <th className="py-3 px-3 font-semibold">Tracking Ref</th>
                <th className="py-3 px-3 font-semibold">Commission Split</th>
                <th className="py-3 px-3 font-semibold">Wallet Balances</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No sub-affiliates found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shadow-sm">
                          {user.first_name ? user.first_name.charAt(0) : user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : user.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500">Sub-Affiliate</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.mobile_number && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.mobile_number}</span>
                        </div>
                      )}
                    </td>

                    {/* Tracking Ref */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                          ?ref={user.ref_code}
                        </span>
                        <button
                          onClick={() => handleCopyRef(user.ref_code)}
                          className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Copy Demo Link"
                        >
                          {copiedRef === user.ref_code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Split */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{user.split_pct}%</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                        Master retains {(100 - Number(user.split_pct)).toFixed(1)}%
                      </div>
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-3">
                      <div className="text-slate-900 dark:text-white font-semibold">
                        Available: ${Number(user.wallet_approved || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        Pending: ${Number(user.wallet_pending || 0).toFixed(2)}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3 font-sans">
                      <button
                        onClick={() => onToggleUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                          user.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditUser(user)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(user)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Partner Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="panel-3d relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Partner &amp; Commission Split %
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Partner Commission Split (%)
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {formSplitPct}% to partner / {(100 - parseFloat(formSplitPct || '0')).toFixed(1)}% to Master
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  required
                  value={formSplitPct}
                  onChange={(e) => setFormSplitPct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-3d-indigo px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
