export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: 'Activity' | 'TrendingUp' | 'Clock' | 'AlertCircle' | 'Users' | 'Server' | 'CheckCircle' | 'Database';
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

export type UserStats = {
  totalUsers: number;
  activeUsers: number;
  retentionRate: number;
  trend: { date: string; value: number }[];
};

export type TeamStats = {
  totalTeams: number;
  activeMembers: number;
  taskCompletionRate: number;
  activityTrend: { date: string; value: number }[];
};

export type PlatformStats = {
  systemStatus: 'healthy' | 'degraded' | 'down';
  cpuUsage: number;
  memoryUsage: number;
  serviceAvailability: number;
  uptime: string;
};

export type DashboardData = {
  stats: DashboardStat[];
  hotApis: DashboardHotApi[];
  userStats: UserStats;
  teamStats: TeamStats;
  platformStats: PlatformStats;
  apiTrends: { date: string; calls: number; latency: number; errors: number }[];
};

