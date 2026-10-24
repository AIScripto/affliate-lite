import { useState, useEffect } from 'react';
import { Plus, Copy, Check, ExternalLink } from 'lucide-react';
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
import { OfferBuilderModal } from './OfferBuilderModal';

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
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
            item.visibility === 'PUBLIC'
              ? 'bg-blue-500/10 text-blue-500'
              : item.visibility === 'PRIVATE'
              ? 'bg-purple-500/10 text-purple-500'
              : 'bg-amber-500/10 text-amber-500'
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
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated hover:bg-primary/20 hover:text-primary text-fg-muted border border-border-subtle text-[11px] font-mono transition"
          title="Copy Postback URL"
        >
          {copiedOfferId === item.id ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Green Add Offer Button */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-fg">Manage Offer</h1>
            <p className="text-xs text-fg-muted mt-0.5">
              5-Tab campaign manager with targeting, dual-list affiliate routing, and revenue spread
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedOffer(null);
              setBuilderOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Offer</span>
          </button>
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

      {/* 5-Tab Offer Builder Modal */}
      <OfferBuilderModal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        offer={selectedOffer}
        networks={networks}
        domains={domains}
        onSuccess={async (msg) => {
          showToast(msg);
          await loadData();
        }}
      />

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
