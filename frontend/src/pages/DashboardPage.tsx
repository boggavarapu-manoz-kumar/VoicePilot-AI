import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Users,
  Megaphone,
  PhoneCall,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  PhoneOutgoing
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-slate-100 border border-slate-200/90 rounded-md px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
            Prototype Notice
          </span>
          <span>Sample data shown for evaluation. Real telephony and CRM entities will be provisioned in future sprints.</span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] text-slate-400">Release 0.0.1</span>
      </div>

      {/* Page Header with Primary Action */}
      <PageHeader
        title="Voice Operations Overview"
        description="Monitor automated voice campaigns, customer reach, call completion, and lead conversion performance."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.open('/api/v1/swagger-ui.html', '_blank')}>
              API Docs
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>
        }
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Total Contacts"
          value="4,820"
          change="+12.4%"
          changeType="positive"
          timeframe="vs last month"
          icon={Users}
          badge="Sample Data"
        />
        <KpiCard
          title="Active Campaigns"
          value="8"
          change="+2"
          changeType="positive"
          timeframe="this week"
          icon={Megaphone}
          badge="Sample Data"
        />
        <KpiCard
          title="Calls Completed"
          value="12,430"
          change="+18.2%"
          changeType="positive"
          timeframe="avg 2m 14s duration"
          icon={PhoneCall}
          badge="Sample Data"
        />
        <KpiCard
          title="Qualified Leads"
          value="642"
          change="+8.6%"
          changeType="positive"
          timeframe="13.3% conversion rate"
          icon={UserCheck}
          badge="Sample Data"
        />
      </div>

      {/* Center Section: Call Outcome Visualization & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Outcomes Visualization */}
        <Card
          title="Call Outcome Distribution"
          subtitle="Illustrative telemetry from 1,200 simulated outbound voice interactions"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {/* Horizontal Bar Breakdown */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  Qualified / Interested (48%)
                </span>
                <span className="font-semibold text-slate-900">576 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                  Follow-up Requested (27%)
                </span>
                <span className="font-semibold text-slate-900">324 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '27%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  Voicemail / No Answer (17%)
                </span>
                <span className="font-semibold text-slate-900">204 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '17%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
                  Not Interested / DNC (8%)
                </span>
                <span className="font-semibold text-slate-900">96 calls</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Average Voice Agent Latency: <strong className="text-slate-800">420ms (P95)</strong>
              </span>
              <span className="text-[11px] text-slate-400">Target &lt; 600ms</span>
            </div>
          </div>
        </Card>

        {/* Recent Voice Activity Section */}
        <Card
          title="Recent Agent Activity"
          subtitle="Illustrative live call events"
          action={
            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
              View All
            </span>
          }
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
              <div key={idx} className="flex items-start justify-between text-xs border-b border-slate-50 pb-3 last:border-none last:pb-0">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <PhoneOutgoing className="w-3 h-3 text-slate-400" />
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
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">Campaign Name</th>
                <th scope="col" className="px-5 py-3.5">Assigned Agent</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Target Audience</th>
                <th scope="col" className="px-5 py-3.5">Progress</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
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
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {campaign.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    {campaign.agent}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={campaign.badge} size="sm" dot>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {campaign.audience}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{campaign.completed}</span>
                        <span>{campaign.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            campaign.progress === 100 ? 'bg-slate-400' : 'bg-blue-600'
                          }`}
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 disabled:opacity-50"
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

      {/* Illustrative Campaign Creation Modal (Local state demonstration) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">New Voice Campaign</h3>
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
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
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
          </div>
        </div>
      )}
    </div>
  );
};
