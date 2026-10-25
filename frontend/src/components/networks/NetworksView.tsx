import { useState, useEffect } from 'react';
import { Network as NetworkIcon, Plus, CheckCircle2, CopyCheck, AlertCircle } from 'lucide-react';
import {
  fetchNetworks,
  createNetwork,
  updateNetwork,
  updateNetworkStatus,
  deleteNetwork,
} from '../../services/api';
import { Network, NetworkStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { ActionButtons } from '../common/ActionButtons';
import { Modal } from '../common/Modal';

export function NetworksView() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [allowDuplicateConversions, setAllowDuplicateConversions] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editAllowDuplicates, setEditAllowDuplicates] = useState(false);

  // Delete modal state
  const [deleteModalNetwork, setDeleteModalNetwork] = useState<Network | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadNetworks = async () => {
    try {
      setIsLoading(true);
      const data = await fetchNetworks();
      setNetworks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load networks', err);
      setNetworks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, []);

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Please fill out this field.');
      return;
    }

    try {
      setIsSubmitting(true);
      setNameError(null);
      await createNetwork({
        name: name.trim(),
        contactDetails: contactDetails.trim() || undefined,
        allowDuplicateConversions,
      });
      setName('');
      setContactDetails('');
      setAllowDuplicateConversions(false);
      setShowAddForm(false);
      showToast('Network / Advertiser created successfully!');
      await loadNetworks();
    } catch (err: any) {
      alert(err.message || 'Failed to create network');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNetwork) return;
    try {
      setIsSubmitting(true);
      await updateNetwork(editingNetwork.id, {
        name: editName,
        contactDetails: editContact || undefined,
        allowDuplicateConversions: editAllowDuplicates,
      });
      setEditingNetwork(null);
      showToast('Network updated successfully!');
      await loadNetworks();
    } catch (err: any) {
      alert(err.message || 'Failed to update network');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (network: Network) => {
    try {
      const nextStatus: NetworkStatus = network.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateNetworkStatus(network.id, nextStatus);
      showToast(`Network status updated to ${nextStatus}`);
      await loadNetworks();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalNetwork) return;
    try {
      await deleteNetwork(deleteModalNetwork.id);
      setDeleteModalNetwork(null);
      showToast('Network deleted successfully');
      await loadNetworks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete network');
    }
  };

  const columns: Column<Network>[] = [
    {
      key: 'id',
      header: '#',
      width: '60px',
      align: 'center',
      render: (item) => <span className="text-fg-muted font-medium">{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center gap-2 font-semibold text-fg">
          <NetworkIcon className="w-3.5 h-3.5 text-primary" />
          <span>{item.name}</span>
        </div>
      ),
    },
    {
      key: 'contactDetails',
      header: 'Contact Details',
      render: (item) => (
        <span className="text-fg-muted text-xs">
          {item.contactDetails || '—'}
        </span>
      ),
    },
    {
      key: 'allowDuplicateConversions',
      header: 'Duplicate',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
            item.allowDuplicateConversions
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-surface-elevated text-fg-muted border border-border-subtle'
          }`}
        >
          {item.allowDuplicateConversions ? 'Allowed' : 'Restricted'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            item.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (item) => (
        <span className="text-fg-muted text-[11px] tabular-nums">
          {item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '2026-09-13 06:26:43'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      sortable: false,
      render: (item) => (
        <ActionButtons
          isStatusActive={item.status === 'ACTIVE'}
          onEdit={() => {
            setEditingNetwork(item);
            setEditName(item.name);
            setEditContact(item.contactDetails || '');
            setEditAllowDuplicates(item.allowDuplicateConversions);
          }}
          onToggleStatus={() => handleToggleStatus(item)}
          onDelete={() => setDeleteModalNetwork(item)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn transition-all">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title Bar with Filled Color 3D Effects Gradient */}
      <div className="titlebar-3d-gradient rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">Manage Networks</h1>
              <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-[10px] font-bold text-white uppercase tracking-wider">
                Advertisers
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 font-medium">
              Advertisers and affiliate networks providing campaign offers and postback tracking
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-3d-success flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Network'}</span>
          </button>
        </div>

        {/* Collapsible Add Network Form (With Contact Details replacing Software dropdown [03:07]) */}
        {showAddForm && (
          <form
            onSubmit={handleCreateNetwork}
            className="mt-5 pt-5 border-t border-border-subtle bg-surface-elevated/40 p-4 rounded-lg"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Add New Network / Advertiser
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Name (e.g. Everflow, Mobeeka)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  className={`w-full bg-surface border ${
                    nameError ? 'border-danger' : 'border-border-subtle'
                  } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition`}
                />
                {nameError && (
                  <p className="text-[11px] text-danger mt-1">{nameError}</p>
                )}
              </div>

              {/* Free-text Contact Details replacing legacy software dropdown */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Contact Details
                </label>
                <input
                  type="text"
                  placeholder="Enter Telegram, Email, or Skype (Optional)"
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                  className="w-full bg-surface border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {/* Allow Duplicate Conversions toggle */}
            <div className="mt-4 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDuplicateConversions}
                  onChange={(e) => setAllowDuplicateConversions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-surface border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <div>
                <span className="text-xs font-semibold text-fg">
                  Allow Duplicate Conversions
                </span>
                <p className="text-[11px] text-fg-muted">
                  When unchecked, duplicate order_id postbacks are rejected to prevent financial leak
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-xs font-medium text-fg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Color Tiles With Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tile 1: Total Networks - Indigo Gradient */}
        <div className="tile-gradient-indigo p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Total Networks</span>
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <NetworkIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{networks.length}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Advertisers</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Integrated networks</p>
        </div>

        {/* Tile 2: Active Networks - Emerald Gradient */}
        <div className="tile-gradient-emerald p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Active Partners</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-emerald-500 tracking-tight">
              {networks.filter((n) => n.status === 'ACTIVE').length}
            </span>
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
              Live
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Serving campaign offers</p>
        </div>

        {/* Tile 3: Deduplication Allowed - Sky Gradient */}
        <div className="tile-gradient-sky p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Multi-Conversion</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center shadow-sm">
              <CopyCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">
              {networks.filter((n) => n.allowDuplicateConversions).length}
            </span>
            <span className="text-[11px] font-semibold text-fg-muted">Networks</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Allow duplicate conversions</p>
        </div>

        {/* Tile 4: Inactive/Staged - Amber Gradient */}
        <div className="tile-gradient-amber p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Paused / Staging</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-amber-500 tracking-tight">
              {networks.filter((n) => n.status !== 'ACTIVE').length}
            </span>
            <span className="text-[11px] font-semibold text-fg-muted">Paused</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Inactive advertiser connections</p>
        </div>
      </div>

      {/* Networks List DataTable */}
      <div className="panel-card p-5">
        <DataTable<Network>
          columns={columns}
          data={networks}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          searchPlaceholder="Search network by name or contact..."
        />
      </div>

      {/* Edit Network Modal */}
      <Modal
        isOpen={editingNetwork !== null}
        onClose={() => setEditingNetwork(null)}
        title="Edit Network"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-black dark:text-white mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-bold text-black dark:text-white mb-1">Contact Details</label>
            <input
              type="text"
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="edit-allow-dups"
              checked={editAllowDuplicates}
              onChange={(e) => setEditAllowDuplicates(e.target.checked)}
              className="rounded border-border-subtle text-primary focus:ring-primary"
            />
            <label htmlFor="edit-allow-dups" className="font-semibold text-fg cursor-pointer">
              Allow Duplicate Conversions
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setEditingNetwork(null)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalNetwork !== null}
        onClose={() => setDeleteModalNetwork(null)}
        title="Delete Network"
      >
        <div className="space-y-4 text-xs">
          <p className="text-fg">
            Are you sure you want to permanently delete network{' '}
            <strong className="text-danger">{deleteModalNetwork?.name}</strong>? Associated offers
            may be affected.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalNetwork(null)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-lg bg-danger hover:bg-red-700 text-white font-semibold"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
