import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  timeframe?: string;
  icon: LucideIcon;
  badge?: string;
  delay?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  timeframe = 'from last month',
  icon: Icon,
  badge,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all overflow-hidden"
    >
      {/* Subtle top accent gradient bar that reveals on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50/50 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-950 transition-colors">
          {value}
        </div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200/70">
            {badge}
          </span>
        )}
      </div>

      {change && (
        <div className="flex items-center text-xs text-slate-500 gap-1.5 pt-1">
          <span
            className={`inline-flex items-center font-semibold ${
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
          <span className="text-slate-300">·</span>
          <span className="text-slate-400 text-[11px]">{timeframe}</span>
        </div>
      )}
    </motion.div>
  );
};
