import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles
} from 'lucide-react';
import { healthApi } from '../lib/api';
import { HealthStatus } from '../types/api';
import { AmbientCanvas } from '../components/AmbientCanvas';

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
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentNav = navigationItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || { name: 'Overview', path: '/' };

  useEffect(() => {
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 antialiased font-sans selection:bg-blue-600 selection:text-white">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Deep Obsidian/Sapphire Slate */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950/95 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight text-sm flex items-center gap-1.5">
                VoicePilot <span className="text-blue-400 font-mono text-[11px] font-semibold bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">Enterprise Voice CRM</div>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation with Animated Sliding Active Indicator */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group"
              >
                {/* Framer motion animated pill sliding behind active item */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 35,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm shadow-blue-500/25 -z-10"
                  />
                )}

                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Live Backend Telemetry Pill */}
        <div className="p-3 mx-3 mb-3 rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md text-xs flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-medium text-[11px]">System Status</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthLoading
                    ? 'bg-amber-400 animate-pulse'
                    : health?.status === 'UP'
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-200 font-mono text-[11px] font-semibold">
                {isHealthLoading ? 'Connecting' : health?.status === 'UP' ? 'Operational' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="text-slate-400 text-[10px] flex items-center justify-between font-mono">
            <span>Spring Boot 3.3</span>
            <span>MySQL 8.0</span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="h-14 border-t border-slate-800/80 px-4 flex items-center justify-between flex-shrink-0 bg-slate-950/70">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              AD
            </div>
            <div className="truncate text-xs">
              <div className="font-semibold text-slate-200 truncate">Workspace Admin</div>
              <div className="text-slate-400 truncate text-[11px]">admin@voicepilot.ai</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900/40 relative">
        {/* Subtle Ambient Particle Mesh */}
        <AmbientCanvas />

        {/* Top Header Bar */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/70 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium" aria-label="Breadcrumb">
              <span className="text-slate-400">VoicePilot AI</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="font-bold text-white">{currentNav.name}</span>
            </nav>
          </div>

          {/* Top Bar Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-800/80 text-blue-300 px-2.5 py-1 rounded-full border border-slate-700/80">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Sprint 1 Foundation</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition-colors focus:outline-none"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport with Smooth Page Transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
