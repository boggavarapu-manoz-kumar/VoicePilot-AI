import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { healthApi } from '../lib/api';
import { HealthStatus } from '../types/api';
import { Server, Database, Layers, CheckCircle, AlertTriangle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = React.useState<HealthStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);
    healthApi.checkHealth()
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message || 'Failed to connect to backend'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      <PageHeader
        title="System Overview"
        description="VoicePilot AI foundation status, telemetry, and architecture inspection."
        action={
          <Button variant="outline" size="sm" onClick={fetchHealth} isLoading={loading}>
            Refresh Telemetry
          </Button>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <div className="font-semibold">Backend Unreachable</div>
            <div className="text-xs mt-0.5">{error}. Ensure Spring Boot is running on port 8080.</div>
          </div>
        </div>
      )}

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Backend Service" subtitle="Spring Boot 3 + Java 21">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {loading ? 'Checking...' : health?.status === 'UP' ? 'Operational' : 'Unavailable'}
                </div>
                <div className="text-xs text-slate-500">v{health?.version || '0.0.1-SNAPSHOT'}</div>
              </div>
            </div>
            {health?.status === 'UP' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          </div>
        </Card>

        <Card title="Database & Migration" subtitle="MySQL 8 & Flyway">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-600" />
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {loading
                    ? 'Checking...'
                    : health?.components?.database?.status === 'UP'
                    ? 'Connected'
                    : health?.components?.database?.status || 'Deferred'}
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[180px]">
                  {health?.components?.database?.details || 'Database connection status'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Architecture" subtitle="Design Pattern">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-slate-600" />
              <div>
                <div className="text-lg font-bold text-slate-800">Modular Monolith</div>
                <div className="text-xs text-slate-500">Decoupled AI & Telephony SPI</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Architecture Verification Card */}
      <Card title="Sprint 1 Milestone Summary">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>React + TypeScript + Vite frontend foundation configured with Tailwind CSS</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>React Router established with client-side routing across all CRM domains</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Centralized typed API client connected to backend health telemetry endpoint</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Clean B2B SaaS layout with dark navy navigation and light workspace</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
