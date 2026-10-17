import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Settings & System Configuration"
        description="Telephony credentials, local LLM endpoints, team management, and API keys."
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Platform Settings</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Environment overrides, provider webhook secrets, and user access controls will be introduced in subsequent sprints.
          </p>
        </div>
      </Card>
    </div>
  );
};
