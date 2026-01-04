import { useEffect, useMemo } from 'react';
import { Card } from '@/app/components/ui/card';
import { TrendingUp, Activity, Clock, AlertCircle, Database, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboard } from '@/features/dashboard/store';
import { Trans, useTranslation } from 'react-i18next';
import { trackEvent } from '@/utils/analytics';

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

  const navigateTo = (view: string, params?: Record<string, string>) => {
    // Dispatch navigation event
    window.dispatchEvent(
      new CustomEvent('eda:navigate', {
        detail: { view, params },
      })
    );
  };

  const iconByName = useMemo(
    () => ({
      Activity,
      TrendingUp,
      Clock,
      AlertCircle,
    }),
    [],
  );

  const statKeyByLabel = useMemo(() => {
    return new Map<string, string>([
      ['API总数', 'apiTotal'],
      ['API 总数', 'apiTotal'],
      ['Total APIs', 'apiTotal'],
      ['数据源', 'dataSources'],
      ['Data sources', 'dataSources'],
      ['数据集', 'datasets'],
      ['Datasets', 'datasets'],
      ['今日调用', 'todayCalls'],
      ['Calls today', 'todayCalls'],
    ]);
  }, []);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl mb-2 font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          <Trans
            t={t}
            i18nKey="subtitle"
            components={{ strong: <strong className="font-semibold text-foreground" /> }}
          />
        </p>
      </div>

      {/* Stats Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          {t('sections.overview')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = iconByName[stat.icon];
            const key = statKeyByLabel.get(stat.label) ?? stat.label;
            return (
              <Card key={stat.label} className="p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] text-muted-foreground leading-5 truncate">
                      {t(`stats.${key}` as never, { defaultValue: stat.label })}
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <div className="text-[28px] leading-none font-semibold tracking-tight">
                        {stat.value}
                      </div>
                      <div className="text-[12px] leading-4 text-green-600 font-medium">
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
      </section>

      <div className="h-px bg-border" />

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t('sections.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="group relative overflow-hidden p-6 h-40 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] cursor-pointer"
            onClick={() => {
              trackEvent('click_quick_action', { action: 'datasets', original_action: 'createDataSource' });
              navigateTo('datasets');
            }}
          >
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <h3 className="mb-2 font-semibold text-lg">{t('quickActions.createDataSource.title')}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{t('quickActions.createDataSource.desc')}</p>
              </div>
              <div className="flex-shrink-0 size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Database className="size-6" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </Card>

          <Card 
            className="group relative overflow-hidden p-6 h-40 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] cursor-pointer"
            onClick={() => navigateTo('api-builder')}
          >
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <h3 className="mb-2 font-semibold text-lg">{t('quickActions.buildApi.title')}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{t('quickActions.buildApi.desc')}</p>
              </div>
              <div className="flex-shrink-0 size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="size-6" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </Card>

          <Card 
            className="group relative overflow-hidden p-6 h-40 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] cursor-pointer"
            onClick={() => navigateTo('api-catalog')}
          >
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <h3 className="mb-2 font-semibold text-lg">{t('quickActions.viewDocs.title')}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{t('quickActions.viewDocs.desc')}</p>
              </div>
              <div className="flex-shrink-0 size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <BookOpen className="size-6" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </Card>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* Recent APIs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t('sections.hotApis')}</h2>
        <Card className="overflow-hidden">
          <div className="divide-y">
            {recentAPIs.map((api) => (
              <a
                key={api.id}
                href={`/api/details/${api.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group block"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('api-details', { id: api.id });
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-medium truncate max-w-[220px] md:max-w-[320px] group-hover:text-primary transition-colors">
                      {api.name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0 dark:bg-blue-900/30 dark:text-blue-300">
                      {api.domain}
                    </span>
                    {api.status === 'warning' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium flex-shrink-0 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {t('hotApis.performanceWarning')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm text-muted-foreground flex-shrink-0">
                  <div className="text-right min-w-[80px]">
                    <span className="text-xs text-muted-foreground/70 block mb-0.5">{t('hotApis.calls')}</span>
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat(i18n.language).format(api.calls)}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
