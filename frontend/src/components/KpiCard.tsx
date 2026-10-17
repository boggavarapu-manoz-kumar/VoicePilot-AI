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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative bg-slate-950/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all overflow-hidden"
    >
      {/* Subtle top edge accent glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-black tracking-tight text-white group-hover:text-blue-100 transition-colors">
          {value}
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
            {badge}
          </span>
        )}
      </div>

      {change && (
        <div className="flex items-center text-xs text-slate-400 gap-1.5 pt-1">
          <span
            className={`inline-flex items-center font-bold ${
              changeType === 'positive'
                ? 'text-emerald-400'
                : changeType === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {change}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 text-[11px] font-medium">{timeframe}</span>
        </div>
      )}
    </motion.div>
  );
};
