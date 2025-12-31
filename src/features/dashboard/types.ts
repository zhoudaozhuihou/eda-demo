export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: 'Activity' | 'TrendingUp' | 'Clock' | 'AlertCircle';
  color: string;
};

export type DashboardHotApi = {
  name: string;
  domain: string;
  calls: number;
  latency: number;
  status: 'healthy' | 'warning';
};

