import { Card } from './ui/card';
import { TrendingUp, Activity, Clock, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { label: 'API 总数', value: '156', change: '+12%', icon: Activity, color: 'text-blue-500' },
    { label: '数据源', value: '23', change: '+3', icon: TrendingUp, color: 'text-green-500' },
    { label: '数据集', value: '89', change: '+8', icon: Clock, color: 'text-purple-500' },
    { label: '今日调用', value: '45.2K', change: '+23%', icon: AlertCircle, color: 'text-orange-500' },
  ];

  const recentAPIs = [
    { name: 'getUserOrders', domain: '订单域', calls: 1234, latency: 45, status: 'healthy' },
    { name: 'getProductInfo', domain: '商品域', calls: 5678, latency: 32, status: 'healthy' },
    { name: 'getCustomerProfile', domain: '用户域', calls: 890, latency: 128, status: 'warning' },
    { name: 'getInventoryData', domain: '库存域', calls: 2345, latency: 67, status: 'healthy' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">仪表板</h1>
        <p className="text-muted-foreground">数据 API 平台运营概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] text-muted-foreground leading-5 truncate">
                    {stat.label}
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-[28px] leading-none font-semibold tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-[12px] leading-4 text-green-600">
                      {stat.change}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 size-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="mb-2">创建数据源</h3>
          <p className="text-sm text-muted-foreground">连接新的数据库实例</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="mb-2">构建 API</h3>
          <p className="text-sm text-muted-foreground">从数据集快速生成 API</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="mb-2">查看文档</h3>
          <p className="text-sm text-muted-foreground">浏览 API 使用文档</p>
        </Card>
      </div>

      {/* Recent APIs */}
      <Card className="p-6">
        <h2 className="mb-4">热门 API</h2>
        <div className="space-y-3">
          {recentAPIs.map((api) => (
            <div
              key={api.name}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono truncate max-w-[220px] md:max-w-[320px]">
                    {api.name}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 flex-shrink-0">
                    {api.domain}
                  </span>
                  {api.status === 'warning' && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 flex-shrink-0">
                      性能预警
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                <div>
                  <span className="text-xs block">调用量</span>
                  <span className="font-medium">{api.calls.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs block">延迟</span>
                  <span className="font-medium">{api.latency}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
