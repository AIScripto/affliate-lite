import { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PartnerPortal } from './components/portal/PartnerPortal';
import { BrandParamModal } from './components/admin/BrandParamModal';
import { PostbackSimulator } from './components/simulation/PostbackSimulator';
import { CreateSubAffiliateModal } from './components/admin/CreateSubAffiliateModal';
import { ThemeProvider } from './context/ThemeContext';
import { 
  User, 
  BrandParam, 
  Product, 
  MasterReportSummary, 
  LeaderboardItem, 
  ConversionStreamItem, 
  DirectVsSubItem, 
  TrafficSourceItem,
  SubAffiliateStatsResponse
} from './types';
import { 
  fetchMasterReports, 
  fetchBrandParams, 
  saveBrandParam, 
  deleteBrandParam, 
  fetchProducts, 
  fetchUsers, 
  fetchPortalStats,
  toggleUserStatus 
} from './services/api';

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'admin' | 'portal'>('admin');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [brands, setBrands] = useState<BrandParam[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Master Reports State
  const [summary, setSummary] = useState<MasterReportSummary>({
    totalClicks: 0,
    totalSalesVolume: 0,
    totalGrossComm: 0,
    directProfit: 0,
    subOverrideProfit: 0,
    subPayableLiability: 0,
  });
  const [directVsSub, setDirectVsSub] = useState<DirectVsSubItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSourceItem[]>([]);
  const [geography, setGeography] = useState<Array<{ country: string; clicks: number }>>([]);
  const [devices, setDevices] = useState<Array<{ device: string; clicks: number }>>([]);
  const [liveStream, setLiveStream] = useState<ConversionStreamItem[]>([]);

  // Portal State
  const [portalStats, setPortalStats] = useState<SubAffiliateStatsResponse | null>(null);

  // Modals
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandParam | null>(null);
  const [createSubModalOpen, setCreateSubModalOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, brandsData, productsData] = await Promise.all([
        fetchUsers(),
        fetchBrandParams(),
        fetchProducts(),
      ]);

      setUsers(usersData.users || []);
      setBrands(brandsData.brands || []);
      setProducts(productsData.products || []);

      // Default active user to admin
      if (!currentUser && usersData.users?.length > 0) {
        setCurrentUser(usersData.users[0]);
      }

      await refreshReports();
    } catch (err) {
      console.error('Error initializing platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshReports = async () => {
    try {
      const reports = await fetchMasterReports();
      if (reports.success) {
        setSummary(reports.summary);
        setDirectVsSub(reports.directVsSub || []);
        setLeaderboard(reports.leaderboard || []);
        setTrafficSources(reports.trafficSources || []);
        setGeography(reports.geography || []);
        setDevices(reports.devices || []);
        setLiveStream(reports.liveStream || []);
      }

      // Also refresh portal stats if currentUser is sub-affiliate
      const targetRef = currentUser?.role === 'sub_aff' ? currentUser.ref_code : 'sub_ali_05';
      const pStats = await fetchPortalStats(targetRef);
      if (pStats.success) {
        setPortalStats(pStats);
      }
    } catch (err) {
      console.error('Failed to refresh analytics reports:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When switching user
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('portal');
        fetchPortalStats(currentUser.ref_code).then((pStats) => {
          if (pStats.success) setPortalStats(pStats);
        });
      }
    }
  }, [currentUser]);

  const handleTabChange = (tab: 'admin' | 'portal') => {
    setCurrentTab(tab);
    if (tab === 'portal' && currentUser?.role === 'admin') {
      const firstSub = users.find((u) => u.role === 'sub_aff');
      if (firstSub) {
        setCurrentUser(firstSub);
      }
    } else if (tab === 'admin' && currentUser?.role !== 'admin') {
      const adminUser = users.find((u) => u.role === 'admin');
      if (adminUser) {
        setCurrentUser(adminUser);
      }
    }
  };

  const handleSaveBrand = async (data: Partial<BrandParam>) => {
    await saveBrandParam(data);
    const brandsData = await fetchBrandParams();
    setBrands(brandsData.brands || []);
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand parameter definition?')) {
      await deleteBrandParam(id);
      const brandsData = await fetchBrandParams();
      setBrands(brandsData.brands || []);
    }
  };

  const handleToggleUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      await toggleUserStatus(userId, newStatus);
      const refreshedUsers = await fetchUsers();
      setUsers(refreshedUsers.users || []);
    } catch (err) {
      alert('Failed to update partner status: ' + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        users={users}
        onUserChange={setCurrentUser}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Connecting to S2S Attribution Engine...</span>
          </div>
        ) : currentTab === 'admin' ? (
          <AdminDashboard
            summary={summary}
            brands={brands}
            users={users}
            products={products}
            directVsSub={directVsSub}
            leaderboard={leaderboard}
            trafficSources={trafficSources}
            geography={geography}
            devices={devices}
            liveStream={liveStream}
            onOpenBrandModal={(brand) => {
              setEditingBrand(brand || null);
              setBrandModalOpen(true);
            }}
            onOpenCreateSubModal={() => setCreateSubModalOpen(true)}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteBrand={handleDeleteBrand}
            onRefresh={async () => {
              await refreshReports();
              const [bData, pData, uData] = await Promise.all([
                fetchBrandParams(),
                fetchProducts(),
                fetchUsers()
              ]);
              if (bData.brands) setBrands(bData.brands);
              if (pData.products) setProducts(pData.products);
              if (uData.users) setUsers(uData.users);
            }}
            onOpenSimulator={() => setSimulatorOpen(true)}
          />
        ) : (
          <PartnerPortal
            stats={portalStats}
            products={products}
            onRefresh={refreshReports}
            onOpenSimulator={() => setSimulatorOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070A12] py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AffiliateX Architecture Blueprint • Server-to-Server (S2S) Click ID Postback Engine</span>
          <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            Powered by: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">AI-Scripto Automations</strong>
          </span>
        </div>
      </footer>

      {/* Brand Parameter Registry Modal */}
      <BrandParamModal
        isOpen={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSave={handleSaveBrand}
        brand={editingBrand}
      />

      {/* Create Sub-Affiliate Modal */}
      <CreateSubAffiliateModal
        isOpen={createSubModalOpen}
        onClose={() => setCreateSubModalOpen(false)}
        onSuccess={async () => {
          const refreshedUsers = await fetchUsers();
          setUsers(refreshedUsers.users || []);
          await refreshReports();
        }}
      />

      {/* S2S Webhook Postback Simulator Modal */}
      <PostbackSimulator
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onSuccess={refreshReports}
      />
    </div>
  );
}

export default App;
