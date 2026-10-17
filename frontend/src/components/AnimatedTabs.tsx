import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}

            {/* Fluid sliding active pill using Framer Motion layoutId */}
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                }}
                className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/90 -z-10"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
