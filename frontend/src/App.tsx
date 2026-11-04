import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout, NavItem } from './components/layout/AdminLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { PublishersView } from './components/publishers/PublishersView';
import { DomainsView } from './components/domains/DomainsView';
import { NetworksView } from './components/networks/NetworksView';
import { OffersView } from './components/offers/OffersView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';

export function App() {
  const [currentNav, setCurrentNav] = useState<NavItem>('dashboard');

  const renderActiveView = () => {
    switch (currentNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'publishers':
        return <PublishersView />;
      case 'domains':
        return <DomainsView />;
      case 'networks':
        return <NetworksView />;
      case 'offers':
        return <OffersView />;
      case 'notifications':
        return <NotificationsView />;
      case 'reports':
      case 'report-overview':
        return <ReportsView initialTab="overview" />;
      case 'report-offers':
        return <ReportsView initialTab="offers" />;
      case 'report-networks':
        return <ReportsView initialTab="networks" />;
      case 'report-publishers':
        return <ReportsView initialTab="publishers" />;
      case 'report-conversions':
        return <ReportsView initialTab="conversions" />;
      case 'report-traffic':
        return <ReportsView initialTab="traffic" />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ThemeProvider>
      <AdminLayout currentNav={currentNav} onNavigate={setCurrentNav}>
        {renderActiveView()}
      </AdminLayout>
    </ThemeProvider>
  );
}

export default App;
