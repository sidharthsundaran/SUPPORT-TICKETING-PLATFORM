import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  PieChart,
  Building2,
  Layers,
} from 'lucide-react';
import { useGetDashboardMetricsQuery } from '../features/reports/reportingApi';
import { useGetMyProjectsQuery } from '../features/projects/projectApi';
import { Project } from '../features/projects/types';
import TicketStatusBadge from '../features/tickets/components/TicketStatusBadge';
import TicketSeverityBadge from '../features/tickets/components/TicketSeverityBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30d');

  // Compute startDate based on dateRange selection (stabilized to midnight)
  const getStartDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateRange === '7d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      return d.toISOString();
    }
    if (dateRange === '30d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 30);
      return d.toISOString();
    }
    if (dateRange === 'ytd') {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    return undefined;
  };

  const { data: projectsData } = useGetMyProjectsQuery();
  const userMemberships = projectsData || [];

  const startDate = getStartDate();

  const { data: metricsResponse, isLoading, isError } = useGetDashboardMetricsQuery({
    projectId: selectedProjectId || undefined,
    startDate,
  });

  const metrics = metricsResponse?.data;
  const kpis = metrics?.kpis;
  const sla = metrics?.sla;

  const severityColors: Record<string, string> = {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-indigo-500',
    low: 'bg-emerald-500',
    enhancement: 'bg-purple-500',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500',
    triaged: 'bg-cyan-500',
    in_progress: 'bg-indigo-500',
    awaiting_client_response: 'bg-amber-500',
    resolved: 'bg-emerald-500',
    closed: 'bg-slate-500',
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center font-bold">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Platform Analytics & Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time metric summaries, SLA compliance tracking, and issue distributions.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          {userMemberships.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">All Projects</option>
                {userMemberships.map((m) => {
                  const p = typeof m.projectId === 'object' ? (m.projectId as Project) : null;
                  if (!p) return null;
                  return (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="ytd">Year to Date</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading analytics dashboard...</div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl">
          Failed to load dashboard metrics. Please refresh.
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Tickets
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {kpis?.totalTickets || 0}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-indigo-600" />
                  Active scope
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
            </div>

            {/* Open vs Resolved Ratio */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Open / Resolved
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-amber-600">
                    {kpis?.openTickets || 0}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">/</span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {kpis?.resolvedTickets || 0}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Open vs Closed ratio</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Avg First Response */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Avg First Response
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {kpis?.avgFirstResponseFormatted || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Response SLA target</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Avg Resolution Time */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Avg Resolution Time
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {kpis?.avgResolutionFormatted || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Resolution target</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* BR-RPT-001: Time-Series Trend Chart (Tickets Created vs Resolved Over Time) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tickets Created vs. Resolved Over Time (BR-RPT-001)
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-indigo-600" />
                  Created
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  Resolved
                </span>
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
              {(metrics?.overTime || []).length === 0 ? (
                <div className="w-full text-center text-xs text-slate-400 my-auto">
                  No time-series data available for the selected period
                </div>
              ) : (
                (metrics?.overTime || []).map((point) => {
                  const maxVal = Math.max(
                    ...metrics!.overTime.flatMap((p) => [p.created, p.resolved]),
                    1
                  );
                  const createdPct = Math.round((point.created / maxVal) * 100);
                  const resolvedPct = Math.round((point.resolved / maxVal) * 100);

                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md pointer-events-none z-10 whitespace-nowrap">
                        {point.date}: {point.created} created, {point.resolved} resolved
                      </div>

                      {/* Bar Group */}
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-2.5 bg-indigo-600 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(createdPct, 8)}%` }}
                        />
                        <div
                          className="w-2.5 bg-emerald-500 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(resolvedPct, 8)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 truncate w-full text-center mt-1">
                        {point.date.substring(5)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Visual Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets by Status */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Status Distribution
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(metrics?.byStatus || {}).map(([stKey, count]) => {
                  const total = kpis?.totalTickets || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={stKey} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="capitalize">{stKey.replace(/_/g, ' ')}</span>
                        <span className="font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColors[stKey] || 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tickets by Severity */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Severity Breakdown
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(metrics?.bySeverity || {}).map(([sevKey, count]) => {
                  const total = kpis?.totalTickets || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={sevKey} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="capitalize">{sevKey}</span>
                        <span className="font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${severityColors[sevKey] || 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BR-RPT-001: Tickets by Client Organisation */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    By Client Organisation (BR-RPT-001)
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {(metrics?.byClientOrg || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No organisation data</p>
                ) : (
                  (metrics?.byClientOrg || []).slice(0, 5).map((org) => {
                    const total = kpis?.totalTickets || 1;
                    const pct = Math.round((org.count / total) * 100);
                    return (
                      <div key={org.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span className="truncate max-w-[180px]">{org.name}</span>
                          <span className="font-bold">{org.count}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* BR-RPT-004: Top Affected Module & Issue Type Combination Patterns */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Top Issue Patterns (Module + Issue Type Pairings - BR-RPT-004)
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(metrics?.byModuleAndIssueType || []).length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2 py-4">No pattern data</p>
              ) : (
                (metrics?.byModuleAndIssueType || []).slice(0, 6).map((item) => (
                  <div
                    key={item.pattern}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {item.pattern}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-bold shrink-0">
                      {item.count} tickets
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Section: SLA Gauge & Active Breaches */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SLA Compliance Gauge Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                SLA Compliance Rate
              </h3>

              <div className="my-4 relative flex items-center justify-center">
                <div
                  className={`text-4xl font-extrabold tracking-tight ${
                    (sla?.compliancePercentage || 0) >= 90
                      ? 'text-emerald-600'
                      : (sla?.compliancePercentage || 0) >= 80
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {sla?.compliancePercentage || 100}%
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Met: {sla?.slaMetCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Breached: {sla?.slaBreachedCount || 0}
                </span>
              </div>
            </div>

            {/* Active Breaches Mini-Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Active SLA Breaches & Overdue Tickets
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tickets')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-2">Ticket #</th>
                      <th className="py-2 px-2">Title</th>
                      <th className="py-2 px-2">Severity</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(metrics?.activeBreaches || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No active SLA breaches! All tickets are on track. 🎉
                        </td>
                      </tr>
                    ) : (
                      (metrics?.activeBreaches || []).map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-2 font-mono font-bold text-indigo-600">
                            {t.ticketNumber}
                          </td>
                          <td className="py-2.5 px-2 font-semibold text-slate-800 max-w-[200px] truncate">
                            {t.title}
                          </td>
                          <td className="py-2.5 px-2">
                            <TicketSeverityBadge severity={t.severity as any} />
                          </td>
                          <td className="py-2.5 px-2">
                            <TicketStatusBadge status={t.status as any} />
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => navigate(`/tickets/${t._id}`)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                            >
                              Triage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
