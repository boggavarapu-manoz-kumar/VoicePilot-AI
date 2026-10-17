import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ContactsPage } from '../pages/ContactsPage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { AIAgentsPage } from '../pages/AIAgentsPage';
import { CallHistoryPage } from '../pages/CallHistoryPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="ai-agents" element={<AIAgentsPage />} />
          <Route path="call-history" element={<CallHistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
