import { useState, useEffect } from 'react';
import { UserPlus, AlertTriangle } from 'lucide-react';
import {
  fetchPublishers,
  createPublisher,
  updatePublisher,
  updatePublisherStatus,
  deletePublisher,
} from '../../services/api';
import { User, PublisherStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { ActionButtons } from '../common/ActionButtons';
import { Modal } from '../common/Modal';

export function PublishersView() {
  const [publishers, setPublishers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingPublisher, setEditingPublisher] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Status toggle confirmation modal
  const [statusModalPublisher, setStatusModalPublisher] = useState<User | null>(null);

  // Delete confirmation modal
  const [deleteModalPublisher, setDeleteModalPublisher] = useState<User | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPublishers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPublishers();
      setPublishers(data);
    } catch (err) {
      console.error('Failed to load publishers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublishers();
  }, []);

  const handleCreatePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) newErrors.name = 'Please fill out this field.';
    if (!email.trim()) newErrors.email = 'Please fill out this field.';
    if (!password.trim()) {
      newErrors.password = 'Please fill out this field.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await createPublisher({ name, email, password });
      setName('');
      setEmail('');
      setPassword('');
      setShowAddForm(false);
      showToast('Publisher created successfully!');
      await loadPublishers();
    } catch (err: any) {
      alert(err.message || 'Failed to create publisher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPublisher) return;
    try {
      setIsSubmitting(true);
      await updatePublisher(editingPublisher.id, {
        name: editName,
        email: editEmail,
        password: editPassword || undefined,
      });
      setEditingPublisher(null);
      showToast('Publisher updated successfully!');
      await loadPublishers();
    } catch (err: any) {
      alert(err.message || 'Failed to update publisher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusModalPublisher) return;
    try {
      const nextStatus: PublisherStatus =
        statusModalPublisher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updatePublisherStatus(statusModalPublisher.id, nextStatus);
      setStatusModalPublisher(null);
      showToast(`Publisher status updated to ${nextStatus}`);
      await loadPublishers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPublisher) return;
    try {
      await deletePublisher(deleteModalPublisher.id);
      setDeleteModalPublisher(null);
      showToast('Publisher deleted successfully');
      await loadPublishers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete publisher');
    }
  };

  const columns: Column<User>[] = [
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
      render: (item) => <span className="font-semibold text-fg">{item.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (item) => <span className="text-fg-muted font-mono">{item.email}</span>,
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
              : item.status === 'PAUSED'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
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
          {item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '2026-08-13 10:25:08'}
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
            setEditingPublisher(item);
            setEditName(item.name);
            setEditEmail(item.email);
            setEditPassword('');
          }}
          onToggleStatus={() => {
            if (item.status === 'ACTIVE') {
              // Show warning confirmation per video [02:20]
              setStatusModalPublisher(item);
            } else {
              handleConfirmDirectStatusToggle(item);
            }
          }}
          onDelete={() => setDeleteModalPublisher(item)}
        />
      ),
    },
  ];

  const handleConfirmDirectStatusToggle = async (publisher: User) => {
    try {
      await updatePublisherStatus(publisher.id, 'ACTIVE');
      showToast('Publisher activated!');
      await loadPublishers();
    } catch (err: any) {
      alert(err.message || 'Failed to activate publisher');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Green Add Publisher Button */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-fg">Manage Publisher</h1>
            <p className="text-xs text-fg-muted mt-0.5">
              Configure affiliates, login credentials, and active campaign authorizations
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Publisher'}</span>
          </button>
        </div>

        {/* Collapsible Add Publisher Form (Simplified per client directive [01:52]-[02:04]) */}
        {showAddForm && (
          <form
            onSubmit={handleCreatePublisher}
            className="mt-5 pt-5 border-t border-border-subtle bg-surface-elevated/40 p-4 rounded-lg"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Add New Publisher
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={`w-full bg-surface border ${
                    errors.name ? 'border-danger' : 'border-border-subtle'
                  } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition`}
                />
                {errors.name && (
                  <p className="text-[11px] text-danger mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full bg-surface border ${
                    errors.email ? 'border-danger' : 'border-border-subtle'
                  } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition`}
                />
                {errors.email && (
                  <p className="text-[11px] text-danger mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full bg-surface border ${
                    errors.password ? 'border-danger' : 'border-border-subtle'
                  } text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition`}
                />
                {errors.password && (
                  <p className="text-[11px] text-danger mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
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

      {/* Publishers List DataTable */}
      <div className="panel-card p-5">
        <DataTable<User>
          columns={columns}
          data={publishers}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          searchPlaceholder="Search publisher by name, email, or id..."
        />
      </div>

      {/* Edit Publisher Modal */}
      <Modal
        isOpen={editingPublisher !== null}
        onClose={() => setEditingPublisher(null)}
        title="Edit Publisher"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-fg-muted mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-semibold text-fg-muted mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-semibold text-fg-muted mb-1">
              Reset Password (leave blank to keep current)
            </label>
            <input
              type="password"
              placeholder="New password (optional)"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setEditingPublisher(null)}
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

      {/* Deactivate Warning Confirmation Modal [02:20] */}
      <Modal
        isOpen={statusModalPublisher !== null}
        onClose={() => setStatusModalPublisher(null)}
        title="Confirm Deactivation"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Setting this publisher to <strong>Inactive</strong> will automatically unassign
              all their active offers and halt tracking. Are you sure you want to proceed?
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalPublisher(null)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmStatusToggle}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              Confirm Deactivate
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalPublisher !== null}
        onClose={() => setDeleteModalPublisher(null)}
        title="Delete Publisher"
      >
        <div className="space-y-4 text-xs">
          <p className="text-fg">
            Are you sure you want to permanently delete publisher{' '}
            <strong className="text-danger">{deleteModalPublisher?.name}</strong>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalPublisher(null)}
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
