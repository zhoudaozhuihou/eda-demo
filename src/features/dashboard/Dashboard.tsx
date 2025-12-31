import { useEffect, useMemo } from 'react';
import { Card } from '@/app/components/ui/card';
import { TrendingUp, Activity, Clock, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboard } from '@/features/dashboard/store';
import { Trans, useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t, i18n } = useTranslation('dashboard');
  const dispatch = useAppDispatch();
  const stats = useAppSelector((s) => s.dashboard.stats);
  const recentAPIs = useAppSelector((s) => s.dashboard.hotApis);
  const status = useAppSelector((s) => s.dashboard.status);

  useEffect(() => {
    if (status !== 'idle') return;
    dispatch(fetchDashboard());
  }, [dispatch, status]);

  const iconByName = useMemo(
    () => ({
      Activity,
      TrendingUp,
      Clock,
      AlertCircle,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          <Trans
            t={t}
            i18nKey="subtitle"
            components={{ strong: <strong /> }}
          />
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = iconByName[stat.icon];
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] text-muted-foreground leading-5 truncate">
                    {t(`stats.${stat.label}` as never, { defaultValue: stat.label })}
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
          <h3 className="mb-2">{t('quickActions.createDataSource.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('quickActions.createDataSource.desc')}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="mb-2">{t('quickActions.buildApi.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('quickActions.buildApi.desc')}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="mb-2">{t('quickActions.viewDocs.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('quickActions.viewDocs.desc')}</p>
        </Card>
      </div>

      {/* Recent APIs */}
      <Card className="p-6">
        <h2 className="mb-4">{t('hotApis.title')}</h2>
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
                      {t('hotApis.performanceWarning')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                <div>
                  <span className="text-xs block">{t('hotApis.calls')}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat(i18n.language).format(api.calls)}
                  </span>
                </div>
                <div>
                  <span className="text-xs block">{t('hotApis.latency')}</span>
                  <span className="font-medium">{t('hotApis.latencyValue', { ms: api.latency })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
