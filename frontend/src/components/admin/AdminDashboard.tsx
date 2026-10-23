import React, { useState } from 'react';
import { 
  BrandParam, 
  MasterReportSummary, 
  LeaderboardItem, 
  ConversionStreamItem, 
  DirectVsSubItem, 
  TrafficSourceItem,
  User,
  Product 
} from '../../types';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { DashboardStatsView } from './DashboardStatsView';
import { AffiliateUrlParamsConfig } from './AffiliateUrlParamsConfig';
import { ProductsConfig } from './ProductsConfig';
import { SubAffiliatesConfig } from './SubAffiliatesConfig';
import { PostbackS2SConfig } from './PostbackS2SConfig';
import { AttributionRulesConfig } from './AttributionRulesConfig';

interface AdminDashboardProps {
  summary: MasterReportSummary;
  brands: BrandParam[];
  users: User[];
  products: Product[];
  directVsSub: DirectVsSubItem[];
  leaderboard: LeaderboardItem[];
  trafficSources: TrafficSourceItem[];
  geography: Array<{ country: string; clicks: number }>;
  devices: Array<{ device: string; clicks: number }>;
  liveStream: ConversionStreamItem[];
  onOpenBrandModal: (brand?: BrandParam) => void;
  onOpenCreateSubModal: () => void;
  onToggleUserStatus: (userId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  onDeleteBrand: (id: string) => void;
  onRefresh: () => void;
  onOpenSimulator: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  summary,
  brands,
  users,
  products,
  directVsSub,
  leaderboard,
  trafficSources,
  geography,
  devices,
  liveStream,
  onOpenBrandModal,
  onOpenCreateSubModal,
  onToggleUserStatus,
  onDeleteBrand,
  onRefresh,
  onOpenSimulator,
}) => {
  const [currentModule, setCurrentModule] = useState<AdminModule>('stats');

  const partnerCount = users.filter(u => u.role === 'sub_aff').length;

  return (
    <div className="flex flex-col md:flex-row items-start gap-6 w-full">
      {/* Sidebar with Navigation and Create Config Action Hub */}
      <AdminSidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        brandCount={brands.length}
        productCount={products.length}
        partnerCount={partnerCount}
        onQuickCreateBrand={() => {
          onOpenBrandModal();
        }}
        onQuickCreateProduct={() => {
          setCurrentModule('products');
        }}
        onQuickCreatePartner={() => {
          onOpenCreateSubModal();
        }}
        onOpenSimulator={onOpenSimulator}
      />

      {/* Main Module Content Area */}
      <div className="flex-1 w-full min-w-0">
        {currentModule === 'stats' && (
          <DashboardStatsView
            summary={summary}
            directVsSub={directVsSub}
            leaderboard={leaderboard}
            trafficSources={trafficSources}
            geography={geography}
            devices={devices}
            liveStream={liveStream}
            onRefresh={onRefresh}
            onOpenSimulator={onOpenSimulator}
            onNavigateToModule={(mod) => setCurrentModule(mod)}
          />
        )}

        {currentModule === 'url-params' && (
          <AffiliateUrlParamsConfig
            brands={brands}
            onOpenBrandModal={onOpenBrandModal}
            onDeleteBrand={onDeleteBrand}
          />
        )}

        {currentModule === 'products' && (
          <ProductsConfig
            products={products}
            brands={brands}
            onRefresh={onRefresh}
          />
        )}

        {currentModule === 'sub-affiliates' && (
          <SubAffiliatesConfig
            users={users}
            onOpenCreateSubModal={onOpenCreateSubModal}
            onToggleUserStatus={onToggleUserStatus}
            onRefresh={onRefresh}
          />
        )}

        {currentModule === 'postback-s2s' && (
          <PostbackS2SConfig
            brands={brands}
            onRefresh={onRefresh}
          />
        )}

        {currentModule === 'attribution-rules' && (
          <AttributionRulesConfig />
        )}
      </div>
    </div>
  );
};
