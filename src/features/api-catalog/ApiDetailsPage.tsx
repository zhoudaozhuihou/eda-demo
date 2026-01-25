import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ApiDocContent } from './ApiDocContent';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCatalogApis } from '@/features/api-catalog/store';

export function ApiDetailsPage({ apiId, apiVersion }: { apiId: string; apiVersion?: string }) {
  const { t } = useTranslation('apiCatalog');
  const dispatch = useAppDispatch();
  const apis = useAppSelector((s) => s.apiCatalog.items);
  const status = useAppSelector((s) => s.apiCatalog.status);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCatalogApis());
    }
  }, [dispatch, status]);

  const apiById = useMemo(() => apis.find((a) => a.id === apiId), [apis, apiId]);
  const api = useMemo(() => {
    if (!apiVersion) return apiById;
    return apis.find((a) => a.id === apiId && a.version === apiVersion) ?? apiById;
  }, [apiById, apiId, apiVersion, apis]);

  const versionOptions = useMemo(() => {
    if (!api) return [];
    const candidates = apis.filter(
      (a) => a.name === api.name && a.method === api.method && a.domain === api.domain,
    );
    const parseVersion = (v: string) => v.split('.').map((n) => Number(n));
    const compare = (a: string, b: string) => {
      const av = parseVersion(a);
      const bv = parseVersion(b);
      const len = Math.max(av.length, bv.length);
      for (let i = 0; i < len; i += 1) {
        const left = av[i] ?? 0;
        const right = bv[i] ?? 0;
        if (left === right) continue;
        return right - left;
      }
      return 0;
    };
    return [...candidates].sort((a, b) => compare(a.version, b.version));
  }, [api, apis]);

  const onBack = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('eda:navigate', { 
      detail: { view: 'api-catalog' } 
    }));
  };

  if (status === 'loading' && !api) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="size-4 mr-2" />
          {t('doc.dialog.actions.backToList')}
        </Button>
        <div className="text-center text-muted-foreground mt-10">
          {t('doc.dialog.apiMissing')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          {t('doc.dialog.actions.backToList')}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold truncate">{api.name}</h1>
          <div className="text-sm text-muted-foreground font-mono truncate">
            {api.method} {api.path}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ApiDocContent
          key={api.id}
          api={api}
          versions={versionOptions}
          onVersionChange={(next) => {
            window.dispatchEvent(
              new CustomEvent('eda:navigate', {
                detail: { view: 'api-details', params: { id: next.id, version: next.version } },
              }),
            );
          }}
        />
      </div>
    </div>
  );
}
