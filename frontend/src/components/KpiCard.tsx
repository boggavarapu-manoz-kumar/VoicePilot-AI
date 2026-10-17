import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  timeframe?: string;
  icon: LucideIcon;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  timeframe = 'from last month',
  icon: Icon,
  badge,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {change && (
        <div className="flex items-center text-xs text-slate-500 gap-1.5">
          <span
            className={`inline-flex items-center font-medium ${
              changeType === 'positive'
                ? 'text-emerald-600'
                : changeType === 'negative'
                ? 'text-rose-600'
                : 'text-slate-600'
            }`}
          >
            {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {change}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">{timeframe}</span>
        </div>
      )}
    </div>
  );
};
