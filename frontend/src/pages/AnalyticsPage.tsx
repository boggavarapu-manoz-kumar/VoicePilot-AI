import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { BarChart3 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Voice CRM Analytics"
        description="Call completion rates, conversion funnels, latency histograms, and agent accuracy."
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Analytics & Business Intelligence</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Aggregated metrics, conversion dashboards, and exportable business reports are scheduled for Sprint 6.
          </p>
        </div>
      </Card>
    </div>
  );
};
