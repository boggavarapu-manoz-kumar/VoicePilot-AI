import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { BackendStatus } from '../components/BackendStatus';
import { VoiceSphere } from '../components/VoiceSphere';
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
  Activity,
  Mic
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLiveStream, setIsLiveStream] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center justify-between text-xs text-slate-700 shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Enterprise Edition
          </span>
          <span className="font-medium text-slate-700">
            VoicePilot AI Neural Voice Engine is initialized. Sample CRM metrics shown for Sprint 1 verification.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] text-slate-400 font-medium">Release 0.0.1</span>
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

      {/* Hero Interactive 3D Neural Voice Acoustic Centerpiece */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl border border-slate-800"
      >
        {/* Subtle background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Hero Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Voice Orchestration (Three.js Powered)</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Sub-500ms Conversational Voice Agents at Scale
            </h2>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              VoicePilot AI synchronizes low-latency speech synthesis, streaming transcription, and knowledge base retrieval into automated outbound and inbound conversational calls.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
              <div>
                <div className="text-xl font-bold text-white tracking-tight">380 ms</div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Turn Latency</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400 tracking-tight">99.8%</div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Synthesis Accuracy</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-400 tracking-tight">12 Concurrent</div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Active Channels</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLiveStream(!isLiveStream)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isLiveStream
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isLiveStream ? 'Simulating Acoustic Stream' : 'Acoustic Waveform Paused'}</span>
              </button>
            </div>
          </div>

          {/* Right 3D Three.js Interactive Sphere Container */}
          <div className="lg:col-span-5 h-72 sm:h-80 w-full rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-inner">
            <VoiceSphere isLive={isLiveStream} className="w-full h-full" />
          </div>
        </div>
      </motion.div>

      {/* KPI Metrics Row with Framer Motion stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Total Contacts"
          value="4,820"
          change="+12.4%"
          changeType="positive"
          timeframe="vs last month"
          icon={Users}
          badge="Sample Data"
          delay={0.1}
        />
        <KpiCard
          title="Active Campaigns"
          value="8"
          change="+2"
          changeType="positive"
          timeframe="this week"
          icon={Megaphone}
          badge="Sample Data"
          delay={0.15}
        />
        <KpiCard
          title="Calls Completed"
          value="12,430"
          change="+18.2%"
          changeType="positive"
          timeframe="avg 2m 14s duration"
          icon={PhoneCall}
          badge="Sample Data"
          delay={0.2}
        />
        <KpiCard
          title="Qualified Leads"
          value="642"
          change="+8.6%"
          changeType="positive"
          timeframe="13.3% conversion rate"
          icon={UserCheck}
          badge="Sample Data"
          delay={0.25}
        />
      </div>

      {/* Center Section: Call Outcome Visualization & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Outcomes Visualization */}
        <Card
          title="Call Outcome Distribution"
          subtitle="Illustrative telemetry from 1,200 simulated outbound voice interactions"
          className="lg:col-span-2"
          delay={0.3}
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shadow-xs" />
                  Qualified / Interested (48%)
                </span>
                <span className="font-bold text-slate-900">576 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '48%' }}
                  transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
                  className="bg-emerald-500 h-2.5 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 shadow-xs" />
                  Follow-up Requested (27%)
                </span>
                <span className="font-bold text-slate-900">324 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '27%' }}
                  transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                  className="bg-blue-500 h-2.5 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shadow-xs" />
                  Voicemail / No Answer (17%)
                </span>
                <span className="font-bold text-slate-900">204 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '17%' }}
                  transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
                  className="bg-amber-500 h-2.5 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
                  Not Interested / DNC (8%)
                </span>
                <span className="font-bold text-slate-900">96 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '8%' }}
                  transition={{ duration: 0.8, delay: 0.65, ease: 'easeOut' }}
                  className="bg-slate-400 h-2.5 rounded-full"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>P95 End-to-End Turn Latency: <strong>420ms</strong></span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Real-time STT+LLM+TTS</span>
            </div>
          </div>
        </Card>

        {/* Recent Voice Activity Section */}
        <Card
          title="Recent Agent Activity"
          subtitle="Illustrative live call events"
          action={
            <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
              View All
            </span>
          }
          delay={0.35}
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
              <div key={idx} className="flex items-start justify-between text-xs border-b border-slate-100 pb-3 last:border-none last:pb-0">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />
                    <span>{activity.lead}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">{activity.agent}</div>
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

      {/* Bottom Section: Recent Campaigns Table */}
      <Card
        title="Active Voice Campaigns"
        subtitle="Recent campaign dispatch schedules, target audiences, and completion rates (Sample Data)"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">8 Total Campaigns</span>
          </div>
        }
        delay={0.4}
      >
        <div className="overflow-x-auto -mx-6 -my-6">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Campaign Name</th>
                <th scope="col" className="px-6 py-3.5">Assigned Agent</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Target Audience</th>
                <th scope="col" className="px-6 py-3.5">Progress</th>
                <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 text-xs">
                    {campaign.agent}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant={campaign.badge} size="sm" dot>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs">
                    {campaign.audience}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="w-36 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>{campaign.completed}</span>
                        <span>{campaign.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            campaign.progress === 100 ? 'bg-slate-400' : 'bg-blue-600'
                          }`}
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Illustrative Campaign Creation Modal with AnimatePresence */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Configure Voice Campaign</span>
                </h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Voice campaign dispatch workflows and telephony cadence management will be fully integrated with Spring Boot in <strong>Sprint 4</strong>.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 mb-1">Upcoming Sprint 4 Capabilities:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li>Twilio / SIP telephony trunk routing</li>
                    <li>Target audience CSV and CRM segment imports</li>
                    <li>Dynamic voice cadence scheduling & retry logic</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Dismiss
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Understood
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
