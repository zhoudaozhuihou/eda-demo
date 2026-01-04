export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: 'Activity' | 'TrendingUp' | 'Clock' | 'AlertCircle';
  color: string;
};

export type DashboardHotApi = {
  id: string;
  name: string;
  domain: string;
  calls: number;
  latency: number;
  status: 'healthy' | 'warning';
};

