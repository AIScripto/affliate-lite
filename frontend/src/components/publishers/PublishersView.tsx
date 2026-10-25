import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  AlertTriangle,
  Link2,
  Copy,
  Check,
  Layers,
  Search,
  Tag,
  Users,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  fetchPublishers,
  createPublisher,
  updatePublisher,
  updatePublisherStatus,
  deletePublisher,
  fetchOffers,
} from '../../services/api';
import { User, PublisherStatus, PublisherType, Offer } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { ActionButtons } from '../common/ActionButtons';
import { Modal } from '../common/Modal';

// Available Postback Macro Tokens for 1-click insertion
const POSTBACK_MACROS = [
  { token: '{click_id}', desc: 'Unique Click Identifier' },
  { token: '{payout}', desc: 'Calculated Payout Amount' },
  { token: '{offer_id}', desc: 'Attributed Offer ID' },
  { token: '{sub1}', desc: 'Partner Sub-Parameter 1' },
  { token: '{status}', desc: 'Conversion Status (APPROVED)' },
];

export function PublishersView() {
  const [publishers, setPublishers] = useState<User[]>([]);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [publisherType, setPublisherType] = useState<PublisherType>('Publisher');
  const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([]);
  const [postbackUrl, setPostbackUrl] = useState('');
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    postbackUrl?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingPublisher, setEditingPublisher] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPublisherType, setEditPublisherType] = useState<PublisherType>('Publisher');
  const [editSelectedOfferIds, setEditSelectedOfferIds] = useState<number[]>([]);
  const [editPostbackUrl, setEditPostbackUrl] = useState('');
  const [editOfferSearchTerm, setEditOfferSearchTerm] = useState('');

  // Status toggle confirmation modal
  const [statusModalPublisher, setStatusModalPublisher] = useState<User | null>(null);

  // Delete confirmation modal
  const [deleteModalPublisher, setDeleteModalPublisher] = useState<User | null>(null);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pubData, offData] = await Promise.all([
        fetchPublishers(),
        fetchOffers().catch(() => []),
      ]);
      setPublishers(Array.isArray(pubData) ? pubData : []);
      setAvailableOffers(Array.isArray(offData) ? offData : []);
    } catch (err) {
      console.error('Failed to load publishers or offers', err);
      setPublishers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered offers for Add form
  const filteredOffersForAdd = useMemo(() => {
    return availableOffers.filter((off) =>
      off.name.toLowerCase().includes(offerSearchTerm.toLowerCase())
    );
  }, [availableOffers, offerSearchTerm]);

  // Filtered offers for Edit modal
  const filteredOffersForEdit = useMemo(() => {
    return availableOffers.filter((off) =>
      off.name.toLowerCase().includes(editOfferSearchTerm.toLowerCase())
    );
  }, [availableOffers, editOfferSearchTerm]);

  // Handle toggling offer selection
  const toggleOfferSelection = (offerId: number) => {
    setSelectedOfferIds((prev) =>
      prev.includes(offerId) ? prev.filter((id) => id !== offerId) : [...prev, offerId]
    );
  };

  const toggleEditOfferSelection = (offerId: number) => {
    setEditSelectedOfferIds((prev) =>
      prev.includes(offerId) ? prev.filter((id) => id !== offerId) : [...prev, offerId]
    );
  };

  // 1-Click append macro token to postback URL
  const appendTokenToPostback = (token: string, isEdit = false) => {
    if (isEdit) {
      setEditPostbackUrl((prev) => {
        const separator = prev ? (prev.includes('?') ? '&' : '?') : '';
        const paramKey = token.replace(/[{}]/g, '');
        return `${prev}${separator}${paramKey}=${token}`;
      });
    } else {
      setPostbackUrl((prev) => {
        const separator = prev ? (prev.includes('?') ? '&' : '?') : '';
        const paramKey = token.replace(/[{}]/g, '');
        return `${prev}${separator}${paramKey}=${token}`;
      });
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const handleCreatePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; password?: string; postbackUrl?: string } = {};

    if (!name.trim()) newErrors.name = 'Please fill out this field.';
    if (!email.trim()) newErrors.email = 'Please fill out this field.';
    if (!password.trim()) {
      newErrors.password = 'Please fill out this field.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (postbackUrl.trim() && !/^https?:\/\//i.test(postbackUrl.trim())) {
      newErrors.postbackUrl = 'Postback URL must begin with http:// or https://';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await createPublisher({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        publisherType,
        postbackUrl: postbackUrl.trim() || undefined,
        offerIds: selectedOfferIds,
      });

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPublisherType('Publisher');
      setSelectedOfferIds([]);
      setPostbackUrl('');
      setShowAddForm(false);
      showToast('Publisher created successfully with assigned campaigns!');
      await loadData();
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
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        publisherType: editPublisherType,
        postbackUrl: editPostbackUrl.trim() || undefined,
        offerIds: editSelectedOfferIds,
      });
      setEditingPublisher(null);
      showToast('Publisher updated successfully!');
      await loadData();
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
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDirectStatusToggle = async (publisher: User) => {
    try {
      await updatePublisherStatus(publisher.id, 'ACTIVE');
      showToast('Publisher activated!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to activate publisher');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPublisher) return;
    try {
      await deletePublisher(deleteModalPublisher.id);
      setDeleteModalPublisher(null);
      showToast('Publisher deleted successfully');
      await loadData();
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
      render: (item) => <span className="text-fg-muted font-mono text-xs">{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-fg text-xs">{item.name}</span>
          <span className="text-[11px] text-fg-muted font-mono">{item.email}</span>
        </div>
      ),
    },
    {
      key: 'publisherType',
      header: 'Publisher Type',
      align: 'center',
      render: (item) => {
        const isSub = item.publisherType === 'SubPublisher';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isSub
                ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30'
                : 'bg-primary/15 text-primary border border-primary/30'
            }`}
          >
            {item.publisherType || 'Publisher'}
          </span>
        );
      },
    },
    {
      key: 'assignedOffers',
      header: 'Assigned Offers',
      render: (item) => {
        const assigned = item.assignedOffers || [];
        if (assigned.length === 0) {
          return <span className="text-fg-muted text-[11px] italic">No offers assigned</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {assigned.slice(0, 3).map((a) => (
              <span
                key={a.offer.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-500 border border-blue-500/20"
              >
                {a.offer.name}
              </span>
            ))}
            {assigned.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-fg-muted border border-border-subtle">
                +{assigned.length - 3} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'postbackUrl',
      header: 'Postback',
      render: (item) => {
        if (!item.postbackUrl) {
          return <span className="text-fg-muted text-[11px]">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5 max-w-[180px]">
            <Link2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span
              className="text-[11px] text-fg-muted truncate font-mono"
              title={item.postbackUrl}
            >
              {item.postbackUrl}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
            item.status === 'ACTIVE'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              : item.status === 'PAUSED'
              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              : 'bg-red-500/15 text-red-500 border border-red-500/30'
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
          {item.createdAt
            ? new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)
            : '—'}
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
            setEditPublisherType(item.publisherType || 'Publisher');
            setEditPostbackUrl(item.postbackUrl || '');
            setEditSelectedOfferIds(item.assignedOffers?.map((a) => a.offer.id) || []);
            setEditOfferSearchTerm('');
          }}
          onToggleStatus={() => {
            if (item.status === 'ACTIVE') {
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

  const totalPubs = publishers.length;
  const activePubs = useMemo(() => publishers.filter((p) => p.status === 'ACTIVE').length, [publishers]);
  const directPubs = useMemo(() => publishers.filter((p) => p.publisherType === 'Publisher' || !p.publisherType).length, [publishers]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title Bar with Filled Color 3D Effects Gradient */}
      <div className="titlebar-3d-gradient rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">Manage Publishers</h1>
              <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-[10px] font-bold text-white uppercase tracking-wider">
                Affiliate Directory
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 font-medium">
              Configure affiliates, publisher tiers, assigned campaigns, and S2S postback URLs
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-3d-success flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Publisher'}</span>
          </button>
        </div>

        {/* Collapsible Add Publisher Form matching Oval Media UI specification */}
        {showAddForm && (
          <form
            onSubmit={handleCreatePublisher}
            className="mt-5 pt-5 border-t border-border-subtle bg-surface-elevated/40 p-5 rounded-xl border border-border-subtle space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5" />
                Add New Publisher
              </h2>
              <span className="text-[11px] text-fg-muted">
                Fields marked with <span className="text-danger">*</span> are required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
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
                {errors.name && <p className="text-[11px] text-danger mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
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
                {errors.email && <p className="text-[11px] text-danger mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
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
                {errors.password && <p className="text-[11px] text-danger mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Publisher Type */}
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1">
                Publisher Type
              </label>
              <select
                value={publisherType}
                onChange={(e) => setPublisherType(e.target.value as PublisherType)}
                className="w-full md:w-1/3 bg-surface border border-border-subtle text-fg rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition"
              >
                <option value="Publisher">Publisher</option>
                <option value="SubPublisher">SubPublisher</option>
              </select>
            </div>

            {/* Offers Multi-Select (Matches Oval Media badge chips with '×' removal) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Offers
                </label>
                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedOfferIds(availableOffers.map((o) => o.id))}
                    className="text-primary hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-fg-muted">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedOfferIds([])}
                    className="text-fg-muted hover:text-danger font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Active Selected Badges (Matches screenshot: bright blue chips with '×') */}
              <div className="min-h-[44px] p-2.5 bg-surface border border-border-subtle rounded-lg flex flex-wrap items-center gap-1.5">
                {selectedOfferIds.length === 0 ? (
                  <span className="text-xs text-fg-muted italic">
                    Click offers below or select from dropdown to assign to this publisher...
                  </span>
                ) : (
                  selectedOfferIds.map((offerId) => {
                    const offer = availableOffers.find((o) => o.id === offerId);
                    if (!offer) return null;
                    return (
                      <button
                        type="button"
                        key={offer.id}
                        onClick={() => toggleOfferSelection(offer.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition active:scale-95"
                        title="Click to remove"
                      >
                        <span className="font-bold text-[11px]">×</span>
                        <span>{offer.name}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Offer Selector Picker */}
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted" />
                    <input
                      type="text"
                      placeholder="Filter available offers to add..."
                      value={offerSearchTerm}
                      onChange={(e) => setOfferSearchTerm(e.target.value)}
                      className="w-full bg-surface border border-border-subtle text-fg rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto border border-border-subtle rounded-lg p-2 bg-surface/50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {filteredOffersForAdd.length === 0 ? (
                    <div className="col-span-full text-center text-xs text-fg-muted py-2">
                      No matching offers found
                    </div>
                  ) : (
                    filteredOffersForAdd.map((off) => {
                      const isSelected = selectedOfferIds.includes(off.id);
                      return (
                        <button
                          type="button"
                          key={off.id}
                          onClick={() => toggleOfferSelection(off.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs transition border ${
                            isSelected
                              ? 'bg-primary/20 border-primary text-primary font-semibold'
                              : 'bg-surface hover:bg-surface-elevated border-border-subtle text-fg'
                          }`}
                        >
                          <span className="truncate">{off.name}</span>
                          {isSelected ? (
                            <Check className="w-3 h-3 text-primary flex-shrink-0 ml-1" />
                          ) : (
                            <Tag className="w-3 h-3 text-fg-muted flex-shrink-0 ml-1 opacity-50" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Postback (Optional) with 1-Click Parameter Token Appender */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-black dark:text-white">
                  Postback (Optional)
                </label>
                <span className="text-[11px] text-fg-muted">
                  Global S2S URL called when a conversion occurs
                </span>
              </div>
              <input
                type="text"
                placeholder="Postback (Optional)"
                value={postbackUrl}
                onChange={(e) => {
                  setPostbackUrl(e.target.value);
                  if (errors.postbackUrl) setErrors({ ...errors, postbackUrl: undefined });
                }}
                className={`w-full bg-surface border ${
                  errors.postbackUrl ? 'border-danger' : 'border-border-subtle'
                } text-fg rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary transition`}
              />
              {errors.postbackUrl && (
                <p className="text-[11px] text-danger mt-1">{errors.postbackUrl}</p>
              )}

              {/* 1-Click Macro Insertion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-fg-muted font-semibold uppercase mr-1">
                  1-Click Tokens:
                </span>
                {POSTBACK_MACROS.map((m) => (
                  <button
                    type="button"
                    key={m.token}
                    onClick={() => appendTokenToPostback(m.token, false)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border-subtle hover:border-primary text-primary hover:bg-primary/10 transition active:scale-95"
                    title={m.desc}
                  >
                    <span>{m.token}</span>
                    {copiedToken === m.token ? (
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-fg-muted opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
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
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Color Tiles With Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tile 1: Total Publishers - Indigo Gradient */}
        <div className="tile-gradient-indigo p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Total Publishers</span>
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{totalPubs}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Partners</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Affiliates in network</p>
        </div>

        {/* Tile 2: Active Accounts - Emerald Gradient */}
        <div className="tile-gradient-emerald p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-emerald-500 tracking-tight">{activePubs}</span>
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Eligible to route traffic</p>
        </div>

        {/* Tile 3: Direct Tier - Sky Gradient */}
        <div className="tile-gradient-sky p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Direct Tier</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{directPubs}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Publishers</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Primary traffic sources</p>
        </div>

        {/* Tile 4: Available Offers - Amber Gradient */}
        <div className="tile-gradient-amber p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Available Offers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{availableOffers.length}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Campaigns</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Ready for assignment</p>
        </div>
      </div>

      {/* Publishers List DataTable */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-fg">Publisher Records</h2>
          </div>
          <span className="text-xs text-fg-muted">
            Total registered: <strong className="text-fg">{publishers.length}</strong>
          </span>
        </div>

        <DataTable<User>
          columns={columns}
          data={publishers}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          searchPlaceholder="Search publisher by name, email, type, or ID..."
        />
      </div>

      {/* Enhanced Edit Publisher Modal */}
      <Modal
        isOpen={editingPublisher !== null}
        onClose={() => setEditingPublisher(null)}
        title="Edit Publisher"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block font-bold text-black dark:text-white mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">Publisher Type</label>
              <select
                value={editPublisherType}
                onChange={(e) => setEditPublisherType(e.target.value as PublisherType)}
                className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="Publisher">Publisher</option>
                <option value="SubPublisher">SubPublisher</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">
                Reset Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Edit Offers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-black dark:text-white">Assigned Offers</label>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setEditSelectedOfferIds(availableOffers.map((o) => o.id))}
                  className="text-primary hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-fg-muted">|</span>
                <button
                  type="button"
                  onClick={() => setEditSelectedOfferIds([])}
                  className="text-fg-muted hover:text-danger font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Selected badges in edit modal */}
            <div className="min-h-[38px] p-2 bg-surface-elevated border border-border-subtle rounded-lg flex flex-wrap gap-1 mb-2">
              {editSelectedOfferIds.length === 0 ? (
                <span className="text-fg-muted text-[11px] italic">No offers assigned</span>
              ) : (
                editSelectedOfferIds.map((offerId) => {
                  const offer = availableOffers.find((o) => o.id === offerId);
                  if (!offer) return null;
                  return (
                    <button
                      type="button"
                      key={offer.id}
                      onClick={() => toggleEditOfferSelection(offer.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium"
                    >
                      <span>×</span>
                      <span>{offer.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick search & toggle for edit */}
            <input
              type="text"
              placeholder="Search offers to toggle..."
              value={editOfferSearchTerm}
              onChange={(e) => setEditOfferSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border-subtle text-fg rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary mb-2"
            />
            <div className="max-h-28 overflow-y-auto border border-border-subtle rounded-lg p-1.5 bg-surface/30 grid grid-cols-2 gap-1">
              {filteredOffersForEdit.map((off) => {
                const isSelected = editSelectedOfferIds.includes(off.id);
                return (
                  <button
                    type="button"
                    key={off.id}
                    onClick={() => toggleEditOfferSelection(off.id)}
                    className={`flex items-center justify-between px-2 py-1 rounded text-left text-[11px] transition border ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-primary font-medium'
                        : 'bg-surface hover:bg-surface-elevated border-border-subtle text-fg'
                    }`}
                  >
                    <span className="truncate">{off.name}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Postback URL */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1">
              Postback URL (Optional)
            </label>
            <input
              type="text"
              placeholder="https://tracker.com/postback?clickid={click_id}&payout={payout}"
              value={editPostbackUrl}
              onChange={(e) => setEditPostbackUrl(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle text-fg rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary"
            />
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className="text-[10px] text-fg-muted uppercase mr-1">Tokens:</span>
              {POSTBACK_MACROS.map((m) => (
                <button
                  type="button"
                  key={m.token}
                  onClick={() => appendTokenToPostback(m.token, true)}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-border-subtle text-primary hover:bg-primary/10"
                >
                  {m.token}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setEditingPublisher(null)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Warning Confirmation Modal */}
      <Modal
        isOpen={statusModalPublisher !== null}
        onClose={() => setStatusModalPublisher(null)}
        title="Confirm Deactivation"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Setting this publisher to <strong>Inactive</strong> will automatically unassign all
              their active offers and halt tracking. Are you sure you want to proceed?
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalPublisher(null)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmStatusToggle}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition"
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
              className="px-4 py-2 rounded-lg border border-border-subtle text-fg hover:bg-surface-elevated font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-lg bg-danger hover:bg-red-700 text-white font-semibold transition"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
