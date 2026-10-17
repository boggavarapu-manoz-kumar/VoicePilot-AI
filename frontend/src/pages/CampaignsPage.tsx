import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Megaphone, Plus } from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Voice Campaigns"
        description="Outbound conversational voice campaigns and scheduling cadences."
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-1.5" />
            New Campaign
          </Button>
        }
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Campaign Management Module</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Campaign cadence builders, audience segmentation, and call dispatch engines are planned for Sprint 4.
          </p>
        </div>
      </Card>
    </div>
  );
};
