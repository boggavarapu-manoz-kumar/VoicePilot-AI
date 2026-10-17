import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Bot,
  PhoneCall,
  BarChart3,
  BookOpen,
  Settings,
  Bell,
  Menu,
  X,
  Radio,
  ChevronRight,
  User
} from 'lucide-react';
import { healthApi } from '../lib/api';
import { HealthStatus } from '../types/api';

const navigationItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Contacts', path: '/contacts', icon: Users },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { name: 'AI Agents', path: '/ai-agents', icon: Bot },
  { name: 'Call History', path: '/call-history', icon: PhoneCall },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const MainLayout: React.FC = () => {
  const [health, setHealth] = React.useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Find active navigation item title
  const currentNav = navigationItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || { name: 'Overview', path: '/' };

  React.useEffect(() => {
    let mounted = true;
    healthApi.checkHealth()
      .then((data) => {
        if (mounted) setHealth(data);
      })
      .catch(() => {
        if (mounted) setHealth(null);
      })
      .finally(() => {
        if (mounted) setIsHealthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close mobile sidebar on route transition
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Fixed on mobile, sticky/static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Professional Product Mark */}
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white tracking-tight text-sm flex items-center gap-1.5">
                VoicePilot <span className="text-blue-400 font-mono text-xs">AI</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-none">Voice CRM Platform</div>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Live Backend Telemetry Indicator */}
        <div className="p-3.5 mx-3 mb-3 rounded-lg border border-slate-800 bg-slate-950/70 text-xs flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-medium">Core Monolith</span>
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
          <div className="text-slate-400 text-[11px] flex items-center justify-between">
            <span>Spring Boot 3</span>
            <span>MySQL 8</span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="h-14 border-t border-slate-800 px-4 flex items-center justify-between flex-shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate text-xs">
              <div className="font-medium text-slate-200 truncate">Workspace Admin</div>
              <div className="text-slate-400 truncate text-[11px]">admin@voicepilot.ai</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-sm" aria-label="Breadcrumb">
              <span className="text-slate-400">VoicePilot AI</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-800">{currentNav.name}</span>
            </nav>
          </div>

          {/* Top Bar Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
              Demo Workspace · Sprint 1
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 relative focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            {/* User Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
