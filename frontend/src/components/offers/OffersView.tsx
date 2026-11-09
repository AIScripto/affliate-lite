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
import { TitleBar } from '../common/TitleBar';
import { MetricTile } from '../common/MetricTile';
import { Toast } from '../common/Toast';
import { StatusBadge } from '../common/StatusBadge';
import { OfferBuilder } from './OfferBuilder';
import { buildTrackingUrl } from '../../utils/trackingUrls';

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
    const macro = offer.postbackMacroParam || '{clickid}';
    const postbackUrl = buildTrackingUrl('postback', [`clickid=${macro}`]);
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
      render: (item) => <StatusBadge status={item.visibility} size="sm" />,
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
      render: (item) => <StatusBadge status={item.status} />,
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

  const totalOffers = offers.length;
  const activeOffers = useMemo(() => offers.filter((o) => o.status === 'ACTIVE').length, [offers]);
  const totalClicks = useMemo(() => offers.reduce((acc, o) => acc + (o.clicksCount || 0), 0), [offers]);
  const totalConversions = useMemo(() => offers.reduce((acc, o) => acc + (o.conversionsCount || 0), 0), [offers]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <Toast message={toastMessage} />

      {builderOpen ? (
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
      ) : (
        <>
          {/* Title Bar with Filled Color 3D Effects Gradient */}
          <TitleBar
            title="Manage Offers"
            badge="Campaign Manager"
            subtitle="Enterprise campaign manager with full-body tracking controls, targeting, and revenue spread"
            action={
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
            }
          />

          {/* 4 Color Tiles With Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricTile
              title="Total Offers"
              value={totalOffers}
              unit="Campaigns"
              subtitle="Registered in portfolio"
              icon={Tag}
              color="indigo"
            />
            <MetricTile
              title="Active Routing"
              value={activeOffers}
              subtitle="Traffic eligible campaigns"
              icon={Activity}
              color="emerald"
              badge={{ text: 'Live', pulse: true }}
            />
            <MetricTile
              title="Total Clicks"
              value={totalClicks}
              unit="Sessions"
              subtitle="Direct routing sessions"
              icon={MousePointer}
              color="sky"
            />
            <MetricTile
              title="Conversions"
              value={totalConversions}
              subtitle="Verified postback actions"
              icon={CheckCircle2}
              color="purple"
              badge={{ text: 'Attributed' }}
            />
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
        </>
      )}
    </div>
  );
}
