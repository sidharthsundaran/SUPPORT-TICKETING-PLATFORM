export interface DashboardKpis {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgFirstResponseFormatted: string;
  avgResolutionFormatted: string;
}

export interface SlaCompliance {
  slaMetCount: number;
  slaBreachedCount: number;
  compliancePercentage: number;
}

export interface ActiveBreachItem {
  _id: string;
  ticketNumber: string;
  title: string;
  severity: string;
  status: string;
  slaResolutionDueAt?: string;
  slaResolutionStatus: string;
}

export interface DashboardMetrics {
  kpis: DashboardKpis;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byModule: Array<{ name: string; count: number }>;
  byClientOrg: Array<{ name: string; count: number }>;
  byModuleAndIssueType: Array<{ pattern: string; count: number }>;
  overTime: Array<{ date: string; created: number; resolved: number }>;
  sla: SlaCompliance;
  activeBreaches: ActiveBreachItem[];
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: DashboardMetrics;
}

export interface ReportQueryParams {
  projectId?: string;
  startDate?: string;
  endDate?: string;
}
