import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { DuplicatesPage } from './pages/DuplicatesPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { InsightsPage } from './pages/InsightsPage';
import { InvestigatorPage } from './pages/InvestigatorPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="anomalies" element={<AnomaliesPage />} />
          <Route path="duplicates" element={<DuplicatesPage />} />
          <Route path="forecasting" element={<ForecastingPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="investigator" element={<InvestigatorPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
