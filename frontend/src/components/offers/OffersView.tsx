import { useState, useEffect, useMemo } from 'react';
import { Plus, Copy, Check, ExternalLink, Tag, Activity, MousePointer, CheckCircle2 } from 'lucide-react';
import {
  fetchOffers,
  fetchNetworks,
  fetchDomains,
  updateOfferStatus,
  deleteOffer,
  duplicateOffer,
} from '../../services/api';
import { Offer, Network, Domain, OfferStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { ActionButtons } from '../common/ActionButtons';
import { Modal } from '../common/Modal';
import { OfferBuilder } from './OfferBuilder';

export function OffersView() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Builder Modal State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Delete Modal State
  const [deleteModalOffer, setDeleteModalOffer] = useState<Offer | null>(null);

  // Toast / Copy Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedOfferId, setCopiedOfferId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [offersData, networksData, domainsData] = await Promise.all([
        fetchOffers(),
        fetchNetworks(),
        fetchDomains(),
      ]);
      setOffers(Array.isArray(offersData) ? offersData : []);
      setNetworks(Array.isArray(networksData) ? networksData : []);
      setDomains(Array.isArray(domainsData) ? domainsData : []);
    } catch (err) {
      console.error('Failed to load offers data', err);
      setOffers([]);
      setNetworks([]);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyPostback = (offer: Offer) => {
    const domainHost = offer.domain?.name || 'zshe.panel.7tracking.com';
    const macro = offer.postbackMacroParam || '{clickid}';
    const postbackUrl = `https://${domainHost}/api/v1/postback?clickid=${macro}`;
    navigator.clipboard.writeText(postbackUrl);
    setCopiedOfferId(offer.id);
    showToast('Postback URL copied to clipboard!');
    setTimeout(() => setCopiedOfferId(null), 2000);
  };

  const handleToggleStatus = async (offer: Offer) => {
    try {
      const nextStatus: OfferStatus = offer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await updateOfferStatus(offer.id, nextStatus);
      showToast(`Offer status updated to ${nextStatus}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update offer status');
    }
  };

  const handleDuplicate = async (offer: Offer) => {
    try {
      await duplicateOffer(offer.id);
      showToast('Offer duplicated successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate offer');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalOffer) return;
    try {
      await deleteOffer(deleteModalOffer.id);
      setDeleteModalOffer(null);
      showToast('Offer deleted successfully');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete offer');
    }
  };

  const columns: Column<Offer>[] = [
    {
      key: 'id',
      header: '#',
      width: '50px',
      align: 'center',
      render: (item) => <span className="text-fg-muted font-medium">{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div>
          <span className="font-semibold text-fg">{item.name}</span>
          {item.previewUrl && (
            <a
              href={item.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-primary hover:underline inline-flex items-center text-[11px]"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      render: (item) => (
        <span className="text-fg-muted font-mono text-[11px]">
          {item.domain?.name || 'Default'}
        </span>
      ),
    },
    {
      key: 'advertiser',
      header: 'Network',
      render: (item) => (
        <span className="text-fg font-medium">
          {item.advertiser?.name || 'Direct'}
        </span>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
            item.visibility === 'PUBLIC'
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              : item.visibility === 'PRIVATE'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}
        >
          {item.visibility === 'REQUIRES_APPROVAL' ? 'Approval Req.' : item.visibility}
        </span>
      ),
    },
    {
      key: 'clicksCount',
      header: 'Clicks',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums text-fg">{item.clicksCount ?? 0}</span>
      ),
    },
    {
      key: 'conversionsCount',
      header: 'Conversions',
      align: 'right',
      render: (item) => (
        <span className="tabular-nums font-semibold text-emerald-500">
          {item.conversionsCount ?? 0}
        </span>
      ),
    },
    {
      key: 'postback',
      header: 'PostBack',
      align: 'center',
      sortable: false,
      render: (item) => (
        <button
          type="button"
          onClick={() => handleCopyPostback(item)}
          className="btn-3d-subtle inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated text-fg-muted hover:text-fg border border-border-subtle text-[11px] font-mono transition shadow-xs cursor-pointer active:scale-95"
          title="Copy Postback URL"
        >
          {copiedOfferId === item.id ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-primary" />
              <span>Copy URL</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs ${
            item.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
              : item.status === 'PAUSED'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/25'
          }`}
        >
          {item.status === 'ACTIVE' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-sm shadow-emerald-500/50" />
          )}
          {item.status}
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
            setSelectedOffer(item);
            setBuilderOpen(true);
          }}
          onDuplicate={() => handleDuplicate(item)}
          onToggleStatus={() => handleToggleStatus(item)}
          onDelete={() => setDeleteModalOffer(item)}
        />
      ),
    },
  ];

  // Render full-body OfferBuilder workspace when creating or editing an offer
  if (builderOpen) {
    return (
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn transition-all">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        <OfferBuilder
          offer={selectedOffer}
          networks={networks}
          domains={domains}
          onBack={() => {
            setBuilderOpen(false);
            setSelectedOffer(null);
          }}
          onSuccess={async (msg) => {
            showToast(msg);
            setBuilderOpen(false);
            setSelectedOffer(null);
            await loadData();
          }}
        />
      </div>
    );
  }

  const totalOffers = offers.length;
  const activeOffers = useMemo(() => offers.filter((o) => o.status === 'ACTIVE').length, [offers]);
  const totalClicks = useMemo(() => offers.reduce((acc, o) => acc + (o.clicksCount || 0), 0), [offers]);
  const totalConversions = useMemo(() => offers.reduce((acc, o) => acc + (o.conversionsCount || 0), 0), [offers]);

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
      <div className="titlebar-3d-gradient rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">Manage Offers</h1>
            <span className="px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-[10px] font-bold text-white uppercase tracking-wider">
              Campaign Manager
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Enterprise campaign manager with full-body tracking controls, targeting, and revenue spread
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedOffer(null);
            setBuilderOpen(true);
          }}
          className="btn-3d-success flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Offer</span>
        </button>
      </div>

      {/* 4 Color Tiles With Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tile 1: Total Offers - Indigo Gradient */}
        <div className="tile-gradient-indigo p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Total Offers</span>
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{totalOffers}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Campaigns</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Registered in portfolio</p>
        </div>

        {/* Tile 2: Active Offers - Emerald Gradient */}
        <div className="tile-gradient-emerald p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Active Routing</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-emerald-500 tracking-tight">{activeOffers}</span>
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
              Live
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Traffic eligible campaigns</p>
        </div>

        {/* Tile 3: Total Clicks - Sky Gradient */}
        <div className="tile-gradient-sky p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Total Clicks</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center shadow-sm">
              <MousePointer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{totalClicks}</span>
            <span className="text-[11px] font-semibold text-fg-muted">Sessions</span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Direct routing sessions</p>
        </div>

        {/* Tile 4: Attributed Conversions - Purple Gradient */}
        <div className="tile-gradient-purple p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">Conversions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-fg tracking-tight">{totalConversions}</span>
            <span className="text-[11px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full shadow-xs">
              Attributed
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mt-1 font-medium">Verified postback actions</p>
        </div>
      </div>

      {/* Offers DataTable */}
      <div className="panel-card p-5">
        <DataTable<Offer>
          columns={columns}
          data={offers}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          searchPlaceholder="Search offer by name, network, or domain..."
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOffer !== null}
        onClose={() => setDeleteModalOffer(null)}
        title="Delete Offer"
      >
        <div className="space-y-4 text-xs">
          <p className="text-fg">
            Are you sure you want to permanently delete offer{' '}
            <strong className="text-danger">{deleteModalOffer?.name}</strong>? Any routing traffic
            will fallback to master default.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOffer(null)}
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
