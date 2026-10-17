import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Bot,
  PhoneCall,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react';
import { healthApi } from '../lib/api';
import { HealthStatus } from '../types/api';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Contacts', path: '/contacts', icon: Users },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { name: 'AI Agents', path: '/ai-agents', icon: Bot },
  { name: 'Call History', path: '/call-history', icon: PhoneCall },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const MainLayout: React.FC = () => {
  const [health, setHealth] = React.useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = React.useState(true);

  React.useEffect(() => {
    healthApi.checkHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setIsHealthLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar - Dark Navy/Charcoal Palette */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
            VP
          </div>
          <div>
            <div className="font-semibold text-white tracking-wide text-sm">VoicePilot AI</div>
            <div className="text-xs text-slate-400">Enterprise Voice CRM</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Backend Connectivity Status Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Backend Status</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthLoading
                    ? 'bg-amber-400 animate-pulse'
                    : health?.status === 'UP'
                    ? 'bg-emerald-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {isHealthLoading ? 'Connecting' : health?.status === 'UP' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center justify-between">
            <span>API v{health?.version || '0.0.1'}</span>
            <span className="capitalize">{health?.environment || 'local'}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-sm text-slate-500">
            Workspace: <span className="font-medium text-slate-700">Sprint 1 Foundation</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Modular Monolith Core</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
