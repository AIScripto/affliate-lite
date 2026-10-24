import { useState, useEffect } from 'react';
import { Globe, Plus } from 'lucide-react';
import {
  fetchDomains,
  createDomain,
  updateDomainStatus,
  deleteDomain,
} from '../../services/api';
import { Domain, DomainStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { ActionButtons } from '../common/ActionButtons';
import { Modal } from '../common/Modal';

export function DomainsView() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalDomain, setDeleteModalDomain] = useState<Domain | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDomains();
      setDomains(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load domains', err);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) {
      setError('Please fill out this field.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createDomain(domainName.trim());
      setDomainName('');
      setShowAddForm(false);
      showToast('Domain added successfully!');
      await loadDomains();
    } catch (err: any) {
      alert(err.message || 'Failed to create domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (domain: Domain) => {
    try {
      const nextStatus: DomainStatus = domain.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateDomainStatus(domain.id, nextStatus);
      showToast(`Domain status updated to ${nextStatus}`);
      await loadDomains();
    } catch (err: any) {
      alert(err.message || 'Failed to update domain status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalDomain) return;
    try {
      await deleteDomain(deleteModalDomain.id);
      setDeleteModalDomain(null);
      showToast('Domain deleted successfully');
      await loadDomains();
    } catch (err: any) {
      alert(err.message || 'Failed to delete domain');
    }
  };

  const columns: Column<Domain>[] = [
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
        <div className="flex items-center gap-2 font-mono font-medium text-fg">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{item.name}</span>
        </div>
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
          {item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '2026-08-20 09:03:05'}
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
          onToggleStatus={() => handleToggleStatus(item)}
          onDelete={() => setDeleteModalDomain(item)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Green Add Domain Button */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-fg">Manage Domain</h1>
            <p className="text-xs text-fg-muted mt-0.5">
              Dedicated tracking and postback domains configured for redirect routing
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Domain'}</span>
          </button>
        </div>

        {/* Collapsible Add Domain Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateDomain}
            className="mt-5 pt-5 border-t border-border-subtle bg-surface-elevated/40 p-4 rounded-lg"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Add New Domain
            </h2>
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-fg-muted mb-1">
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name (e.g. zshe.panel.7tracking.com)"
                value={domainName}
                onChange={(e) => {
                  setDomainName(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full bg-surface border ${
                  error ? 'border-danger' : 'border-border-subtle'
                } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition`}
              />
              {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
            </div>

            <div className="mt-4 flex gap-2">
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

      {/* Domain List DataTable */}
      <div className="panel-card p-5">
        <DataTable<Domain>
          columns={columns}
          data={domains}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          searchPlaceholder="Search domain..."
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalDomain !== null}
        onClose={() => setDeleteModalDomain(null)}
        title="Delete Domain"
      >
        <div className="space-y-4 text-xs">
          <p className="text-fg">
            Are you sure you want to permanently delete domain{' '}
            <strong className="text-danger">{deleteModalDomain?.name}</strong>? Tracking links
            using this domain will stop functioning.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalDomain(null)}
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
