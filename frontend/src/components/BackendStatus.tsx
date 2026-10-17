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
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isLoading
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <Server className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Spring Boot Monolith</span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  isLoading
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : isHealthy
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLoading
                      ? 'bg-amber-400 animate-pulse'
                      : isHealthy
                      ? 'bg-emerald-400'
                      : 'bg-rose-400'
                  }`}
                />
                {isLoading ? 'Checking' : isHealthy ? 'Operational' : 'Unavailable'}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 mt-0.5">
              <span>Endpoint: <code className="text-blue-400 font-mono text-[11px]">/api/v1/health</code></span>
              <span>·</span>
              <span>v{health?.version || '0.0.1-SNAPSHOT'}</span>
              <span>·</span>
              <span>
                Database:{' '}
                <strong
                  className={
                    isDbHealthy
                      ? 'text-emerald-400 font-medium'
                      : 'text-amber-400 font-medium'
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Refresh backend status"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Backend Unreachable: </span>
            <span>{error}. Verify that the Spring Boot server is started (`./mvnw spring-boot:run`) on port 8080.</span>
          </div>
        </div>
      )}

      {isHealthy && !error && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
