import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { AlertDrawer } from '../alerts/AlertDrawer';
import { api } from '../../services/api';
import type { Alert } from '../../types';

export const Layout: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts({ limit: 100 });
      setAlerts(data);
      const unread = data.filter((a) => !a.is_read && !a.is_dismissed).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Financial Overview';
      case '/transactions':
        return 'Transaction Ledger';
      case '/subscriptions':
        return 'Subscription Leakage & Creep';
      case '/anomalies':
        return 'ML Anomaly Detection';
      case '/duplicates':
        return 'Duplicate Debit Auditor';
      case '/forecasting':
        return 'Cash-Flow Forecasting';
      case '/recommendations':
        return 'Financial Actions & Insights';
      case '/insights':
        return 'Financial Insights & Forecasting';
      case '/investigator':
        return 'AI Investigator Copilot';
      case '/alerts':
        return 'Risk Alert Center';
      case '/settings':
        return 'Workspace Settings';
      default:
        return 'FinSentry AI';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-white font-sans">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        unreadAlertsCount={unreadCount}
        className="hidden md:flex"
      />

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <Sidebar
            unreadAlertsCount={unreadCount}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            className="relative z-10 w-72"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#050505]">
        <TopNavbar
          title={getPageTitle(location.pathname)}
          unreadAlertsCount={unreadCount}
          onOpenAlerts={() => setIsAlertDrawerOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050505]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Alert Drawer Component */}
      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onAlertUpdated={fetchAlerts}
      />
    </div>
  );
};
