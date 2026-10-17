import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { PhoneCall } from 'lucide-react';

export const CallHistoryPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Call History & Telemetry"
        description="Call session logs, call recording transcripts, sentiment scoring, and latency metrics."
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Telephony Call Sessions</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Telephony event webhooks, call logs, recording playback, and transcript streams will be introduced in Sprint 4.
          </p>
        </div>
      </Card>
    </div>
  );
};
