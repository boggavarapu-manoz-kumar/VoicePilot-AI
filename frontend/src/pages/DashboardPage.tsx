import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { BackendStatus } from '../components/BackendStatus';
import { AnimatedTabs } from '../components/AnimatedTabs';
import { healthApi } from '../lib/api';
import { HealthStatus } from '../types/api';
import {
  Users,
  Megaphone,
  PhoneCall,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  PhoneOutgoing,
  Sparkles,
  Zap,
  Radio,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('telemetry');

  const fetchHealth = React.useCallback(() => {
    setIsLoading(true);
    healthApi.checkHealth()
      .then((data) => {
        setHealth(data);
        setError(null);
        setLastChecked(new Date());
      })
      .catch((err) => {
        setHealth(null);
        setError(err.message || 'Connection to backend failed');
        setLastChecked(new Date());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 30000);
    return () => clearInterval(timer);
  }, [fetchHealth]);

  const dashboardTabs = [
    { id: 'telemetry', label: 'Live Telemetry', count: 12 },
    { id: 'analytics', label: 'Call Analytics', count: '12.4k' },
    { id: 'campaigns', label: 'Active Campaigns', count: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900/60 backdrop-blur-md border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-300 shadow-lg"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Enterprise Edition
          </span>
          <span className="font-medium text-slate-300">
            VoicePilot AI Neural Voice Engine running with fluid page transitions & low-latency streaming pipeline.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] text-slate-500 font-medium">Release 0.0.1</span>
      </motion.div>

      {/* Page Header with Action Controls */}
      <PageHeader
        title="Voice Operations & Telemetry"
        description="Real-time multi-agent dispatch oversight, acoustic synthesis telemetry, and customer reach analytics."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/v1/swagger-ui.html', '_blank')}
            >
              OpenAPI Console
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Voice Campaign
            </Button>
          </div>
        }
      />

      {/* Backend Live Telemetry */}
      <BackendStatus
        health={health}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchHealth}
        lastChecked={lastChecked}
      />

      {/* Interactive Tabs with Fluid Spring Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <AnimatedTabs
          tabs={dashboardTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Streaming pipeline connected (420ms p95 latency)</span>
        </div>
      </div>

      {/* Tab Content with Fluid AnimatePresence Transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'telemetry' && (
          <motion.div
            key="tab-telemetry"
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Telemetry Highlight Banner */}
            <div className="relative bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-md overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" /> Turn Latency
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">380 <span className="text-sm font-normal text-slate-400">ms</span></div>
                  <p className="text-xs text-slate-400">Low-latency acoustic loop</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Synthesis Fidelity
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 tracking-tight">99.8%</div>
                  <p className="text-xs text-slate-400">Zero phoneme drop rate</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5" /> Active Channels
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">12 <span className="text-sm font-normal text-slate-400">Concurrent</span></div>
                  <p className="text-xs text-slate-400">SIP trunk connected</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5" /> Neural Engine
                  </div>
                  <div className="text-3xl font-bold text-cyan-400 tracking-tight">v2.4</div>
                  <p className="text-xs text-slate-400">Full-duplex conversation</p>
                </div>
              </div>
            </div>

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <KpiCard
                title="Total Contacts"
                value="4,820"
                change="+12.4%"
                changeType="positive"
                timeframe="vs last month"
                icon={Users}
                badge="Verified"
                delay={0.05}
              />
              <KpiCard
                title="Active Campaigns"
                value="8"
                change="+2"
                changeType="positive"
                timeframe="this week"
                icon={Megaphone}
                badge="Dispatching"
                delay={0.1}
              />
              <KpiCard
                title="Calls Completed"
                value="12,430"
                change="+18.2%"
                changeType="positive"
                timeframe="avg 2m 14s duration"
                icon={PhoneCall}
                badge="Real-time"
                delay={0.15}
              />
              <KpiCard
                title="Qualified Leads"
                value="642"
                change="+8.6%"
                changeType="positive"
                timeframe="13.3% conversion rate"
                icon={UserCheck}
                badge="High Intent"
                delay={0.2}
              />
            </div>

            {/* Center Section: Call Outcomes & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card
                title="Call Outcome Distribution"
                subtitle="Live telemetry from 1,200 simulated outbound voice interactions"
                className="lg:col-span-2"
                delay={0.25}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shadow-xs" />
                        Qualified / Interested (48%)
                      </span>
                      <span className="font-semibold text-white">576 calls</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '48%' }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        className="bg-emerald-500 h-2.5 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 shadow-xs" />
                        Follow-up Requested (27%)
                      </span>
                      <span className="font-semibold text-white">324 calls</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '27%' }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        className="bg-blue-500 h-2.5 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shadow-xs" />
                        Voicemail / No Answer (17%)
                      </span>
                      <span className="font-semibold text-white">204 calls</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '17%' }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="bg-amber-500 h-2.5 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-slate-500" />
                        Not Interested / DNC (8%)
                      </span>
                      <span className="font-semibold text-white">96 calls</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '8%' }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        className="bg-slate-500 h-2.5 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>P95 End-to-End Turn Latency: <strong className="text-white">420ms</strong></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Real-time STT+LLM+TTS</span>
                  </div>
                </div>
              </Card>

              {/* Recent Voice Activity Section */}
              <Card
                title="Recent Agent Activity"
                subtitle="Live acoustic agent events"
                action={
                  <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline">
                    View All
                  </span>
                }
                delay={0.3}
              >
                <div className="space-y-4">
                  {[
                    {
                      lead: 'Acme Corp — Sarah Jenkins',
                      outcome: 'Qualified Lead',
                      badge: 'success' as const,
                      agent: 'Outbound SDR Agent #2',
                      time: '4 mins ago',
                    },
                    {
                      lead: 'Pinnacle Labs — David Miller',
                      outcome: 'Follow-up Set',
                      badge: 'info' as const,
                      agent: 'Demo Booking Agent #1',
                      time: '18 mins ago',
                    },
                    {
                      lead: 'Starlight Retail — Emma Watson',
                      outcome: 'Voicemail Left',
                      badge: 'warning' as const,
                      agent: 'Lead Qualifier #3',
                      time: '34 mins ago',
                    },
                    {
                      lead: 'Nexus Health — Robert Chen',
                      outcome: 'Transferred to Rep',
                      badge: 'primary' as const,
                      agent: 'Triage Voice Agent #1',
                      time: '1 hour ago',
                    },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs border-b border-slate-800/60 pb-3 last:border-none last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />
                          <span>{activity.lead}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">{activity.agent}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={activity.badge} size="sm">
                          {activity.outcome}
                        </Badge>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="tab-analytics"
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card title="Average Call Duration" subtitle="Distribution across SDR vs Support agents" delay={0.05}>
                <div className="text-3xl font-bold text-white mb-2">2m 14s</div>
                <p className="text-xs text-slate-400 leading-relaxed">Optimal engagement window before drop-off rate increases by 34%.</p>
              </Card>
              <Card title="Sentiment Index" subtitle="Analyzed from speech acoustics and prosody" delay={0.1}>
                <div className="text-3xl font-bold text-emerald-400 mb-2">+82.4</div>
                <p className="text-xs text-slate-400 leading-relaxed">High user affinity score across affirmative conversation segments.</p>
              </Card>
              <Card title="Interruption Recovery" subtitle="Turn-taking interruption handling" delay={0.15}>
                <div className="text-3xl font-bold text-blue-400 mb-2">120 ms</div>
                <p className="text-xs text-slate-400 leading-relaxed">Instant acoustic cessation when human speaker begins speaking.</p>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'campaigns' && (
          <motion.div
            key="tab-campaigns"
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Active Voice Campaigns Table */}
            <Card
              title="Active Voice Campaigns"
              subtitle="Recent campaign dispatch schedules, target audiences, and completion rates (Sample Data)"
              action={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">8 Total Campaigns</span>
                </div>
              }
              delay={0.05}
            >
              <div className="overflow-x-auto -mx-6 -my-6">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">Campaign Name</th>
                      <th scope="col" className="px-6 py-3.5">Assigned Agent</th>
                      <th scope="col" className="px-6 py-3.5">Status</th>
                      <th scope="col" className="px-6 py-3.5">Target Audience</th>
                      <th scope="col" className="px-6 py-3.5">Progress</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[
                      {
                        name: 'Q4 Enterprise Inbound Follow-up',
                        agent: 'Enterprise Closer Agent',
                        status: 'Active',
                        badge: 'success' as const,
                        audience: 'High-intent MQLs (US-East)',
                        progress: 74,
                        completed: '740 / 1,000',
                      },
                      {
                        name: 'Product Update Re-engagement',
                        agent: 'Product Specialist Agent',
                        status: 'Active',
                        badge: 'success' as const,
                        audience: 'Churned Users & Trials',
                        progress: 42,
                        completed: '525 / 1,250',
                      },
                      {
                        name: 'Healthcare Compliance Webinar Invite',
                        agent: 'Event Outreach Agent',
                        status: 'Scheduled',
                        badge: 'warning' as const,
                        audience: 'Healthcare CTOs & VPs',
                        progress: 0,
                        completed: '0 / 800',
                      },
                      {
                        name: 'Q3 Post-Conference Lead Triage',
                        agent: 'Triage Voice Agent #2',
                        status: 'Completed',
                        badge: 'neutral' as const,
                        audience: 'SaaS Expo Attendee List',
                        progress: 100,
                        completed: '1,500 / 1,500',
                      },
                    ].map((campaign, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-white">
                          {campaign.name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 text-xs">
                          {campaign.agent}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={campaign.badge} size="sm">
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-400">
                          {campaign.audience}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="w-36">
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>{campaign.progress}%</span>
                              <span>{campaign.completed}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${campaign.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Create Voice Campaign</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Configure your automated conversational voice dispatch campaign. Select an assigned AI Agent, assign target contacts, and configure turn pacing.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 SaaS Enterprise Re-engagement"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Voice Agent</label>
                  <select className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Outbound SDR Agent #2 (Conversational English)</option>
                    <option>Enterprise Closer Agent (High Latency Priority)</option>
                    <option>Product Specialist Agent (Interactive Q&A)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Launch Campaign
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
