import React from 'react';
import { RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import { HealthStatus } from '../types/api';

interface BackendStatusProps {
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  lastChecked?: Date | null;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({
  health,
  isLoading,
  error,
  onRefresh,
  lastChecked,
}) => {
  const isHealthy = !error && health?.status === 'UP';
  const isDbHealthy = health?.components?.database?.status === 'UP';

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
              isLoading
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : isHealthy
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            <Server className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Spring Boot Monolith</span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  isLoading
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isHealthy
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLoading
                      ? 'bg-amber-500 animate-pulse'
                      : isHealthy
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                />
                {isLoading ? 'Checking' : isHealthy ? 'Operational' : 'Unavailable'}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
              <span>Endpoint: <code className="text-slate-700 font-mono text-[11px]">/api/v1/health</code></span>
              <span>·</span>
              <span>v{health?.version || '0.0.1-SNAPSHOT'}</span>
              <span>·</span>
              <span>
                Database:{' '}
                <strong
                  className={
                    isDbHealthy
                      ? 'text-emerald-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {health?.components?.database?.status || (isLoading ? 'Checking' : 'Offline')}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {lastChecked && (
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Refresh backend status"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-rose-700 bg-rose-50/50 p-2.5 rounded border border-rose-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Backend Unreachable: </span>
            <span>{error}. Verify that the Spring Boot server is started (`./mvnw spring-boot:run`) on port 8080.</span>
          </div>
        </div>
      )}

      {isHealthy && !error && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end verified via CORS-enabled REST API client.</span>
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            {health?.timestamp ? new Date(health.timestamp).toISOString() : ''}
          </span>
        </div>
      )}
    </div>
  );
};
