import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout, NavItem } from './components/layout/AdminLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { PublishersView } from './components/publishers/PublishersView';
import { DomainsView } from './components/domains/DomainsView';
import { NetworksView } from './components/networks/NetworksView';
import { OffersView } from './components/offers/OffersView';
import { NetworksReportView } from './components/reports/NetworksReportView';
import { OffersReportView } from './components/reports/OffersReportView';
import { PublishersReportView } from './components/reports/PublishersReportView';
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
      case 'report-networks':
        return <NetworksReportView />;
      case 'report-offers':
        return <OffersReportView />;
      case 'report-publishers':
        return <PublishersReportView />;
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
