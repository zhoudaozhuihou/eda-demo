import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import {
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  Database,
  Users,
  Server,
  CheckCircle,
  ArrowUpRight,
  Library,
  PenTool,
  CheckSquare,
  Shield,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboard, setFilter } from '@/features/dashboard/store';
import { Trans, useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

export function Dashboard() {
  const { t } = useTranslation('dashboard');
  const dispatch = useAppDispatch();
  
  const {
    stats,
    hotApis,
    userStats,
    teamStats,
    platformStats,
    apiTrends,
    status,
    filter
  } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDashboard());
    }
  }, [dispatch, status]);

  // Real-time update simulation (every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(fetchDashboard());
    }, 30000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const handleTimeRangeChange = (value: string) => {
    dispatch(setFilter({ timeRange: value as '1h' | '24h' | '7d' | '30d' }));
  };

  const iconByName: Record<string, React.ElementType> = {
    Activity,
    TrendingUp,
    Clock,
    AlertCircle,
    Database,
    Users,
    Server,
    CheckCircle,
  };

  const navigateTo = (view: string) => {
    window.dispatchEvent(new CustomEvent('eda:navigate', { detail: view }));
  };

  const coreModules = [
    {
      id: 'api-catalog',
      title: t('modules.apiCatalog.title'),
      description: t('modules.apiCatalog.description'),
      icon: Library,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: 'api-builder',
      title: t('modules.apiBuilder.title'),
      description: t('modules.apiBuilder.description'),
      icon: PenTool,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      id: 'datasets',
      title: t('modules.datasets.title'),
      description: t('modules.datasets.description'),
      icon: Database,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      id: 'approval',
      title: t('modules.approval.title'),
      description: t('modules.approval.description'),
      icon: CheckSquare,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      id: 'management',
      title: t('modules.management.title'),
      description: t('modules.management.description'),
      icon: Shield,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
    },
  ];

  const getStatLabel = (label: string) => {
    const map: Record<string, string> = {
      'Total APIs': 'stats.apiTotal',
      'API 总数': 'stats.apiTotal',
      'Data sources': 'stats.dataSources',
      '数据源': 'stats.dataSources',
      'Datasets': 'stats.datasets',
      '数据集': 'stats.datasets',
      'Calls today': 'stats.todayCalls',
      '今日调用': 'stats.todayCalls',
    };
    return map[label] ? t(map[label]) : label;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
             <Trans
                t={t}
                i18nKey="subtitle"
                components={{ strong: <strong className="font-semibold text-foreground" /> }}
              />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={filter.timeRange} onValueChange={handleTimeRangeChange} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="1h">{t('filters.1h')}</TabsTrigger>
              <TabsTrigger value="24h">{t('filters.24h')}</TabsTrigger>
              <TabsTrigger value="7d">{t('filters.7d')}</TabsTrigger>
              <TabsTrigger value="30d">{t('filters.30d')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Core Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {coreModules.map((module) => (
          <Card 
            key={module.id} 
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => navigateTo(module.id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${module.bg}`}>
                <module.icon className={`size-5 ${module.color}`} />
              </div>
              <div>
                <h3 className="font-medium text-sm">{module.title}</h3>
                <p className="text-xs text-muted-foreground">{module.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = iconByName[stat.icon] || Activity;
          return (
            <Card key={stat.label} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">{getStatLabel(stat.label)}</p>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                    {stat.change}
                    <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* API Trends - Main Chart */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('charts.apiTraffic.title')}</CardTitle>
            <CardDescription>{t('charts.apiTraffic.description')}</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiTrends}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="calls" stroke="#8884d8" fillOpacity={1} fill="url(#colorCalls)" />
                  <Area yAxisId="right" type="monotone" dataKey="latency" stroke="#82ca9d" fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User & Team Stats - Side Charts */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          {/* User Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{t('charts.userGrowth.title')}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                   <p className="text-xs text-muted-foreground">{t('charts.userGrowth.totalUsers')}</p>
                 </div>
                 <div>
                   <div className="text-2xl font-bold">{userStats.activeUsers}</div>
                   <p className="text-xs text-muted-foreground">{t('charts.userGrowth.activeUsers')}</p>
                 </div>
                 <div>
                   <div className="text-2xl font-bold">{userStats.retentionRate}%</div>
                   <p className="text-xs text-muted-foreground">{t('charts.userGrowth.retention')}</p>
                 </div>
               </div>
               <div className="h-[120px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={userStats.trend}>
                     <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                     <Tooltip cursor={{fill: 'transparent'}} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card>
             <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{t('charts.teamActivity.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[120px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={teamStats.activityTrend}>
                     <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
                     <Tooltip />
                   </LineChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Hot APIs & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hot APIs Table */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('hotApis.title')}</CardTitle>
            <CardDescription>{t('hotApis.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hotApis.map((api) => (
                <div key={api.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="font-medium">{api.name}</div>
                    <div className="text-sm text-muted-foreground">{api.domain}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-medium">{api.calls.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{t('hotApis.calls')}</div>
                    </div>
                    <div className="text-right w-16">
                      <div className={`font-medium ${api.latency > 100 ? 'text-red-500' : 'text-green-600'}`}>
                        {api.latency}ms
                      </div>
                      <div className="text-xs text-muted-foreground">{t('hotApis.latency')}</div>
                    </div>
                    <Badge variant={api.status === 'healthy' ? 'outline' : 'destructive'}>
                      {api.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('system.title')}</CardTitle>
            <CardDescription>{t('system.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('system.status')}</span>
              <Badge className={platformStats.systemStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'}>
                {platformStats.systemStatus.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('stats.cpuUsage')}</span>
                <span className="font-medium">{platformStats.cpuUsage}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${platformStats.cpuUsage}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('stats.memoryUsage')}</span>
                <span className="font-medium">{platformStats.memoryUsage}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${platformStats.memoryUsage}%` }} 
                />
              </div>
            </div>

             <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                   <div className="text-2xl font-bold">{platformStats.serviceAvailability}%</div>
                   <p className="text-xs text-muted-foreground">{t('system.availability')}</p>
                </div>
                <div>
                   <div className="text-2xl font-bold">{platformStats.uptime}</div>
                   <p className="text-xs text-muted-foreground">{t('system.uptime')}</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
