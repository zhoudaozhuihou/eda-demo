import { useEffect, useState } from 'react';
import { Header } from '@/app/components/Header';
import { Sidebar } from '@/app/components/Sidebar';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Datasets } from '@/features/datasets/Datasets';
import { APIBuilder, type APIBuilderContext } from '@/features/api-builder/APIBuilder';
import { APICatalog } from '@/features/api-catalog/APICatalog';
import { ApiDetailsPage } from '@/features/api-catalog/ApiDetailsPage';
import { DatasetDetailsPage } from '@/features/datasets/DatasetDetailsPage';
import { Approval } from '@/features/approval/Approval';
import { Management } from '@/features/management/Management';
import { Settings } from '@/features/settings/Settings';
import { Toaster } from './components/ui/sonner';
import i18n, { setAppLanguage } from '@/i18n';
import { getLanguageFromPathname, stripLanguagePrefix, withLanguagePrefix } from '@/i18n/routing';

import { NotFound } from '@/app/pages/NotFound';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [apiBuilderContext, setApiBuilderContext] = useState<APIBuilderContext | null>(null);
  const [detailApiId, setDetailApiId] = useState<string | null>(null);
  const [detailApiVersion, setDetailApiVersion] = useState<string | null>(null);
  const [detailDatasetId, setDetailDatasetId] = useState<string | null>(null);
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const syncFromLocation = () => {
      const pathLang = getLanguageFromPathname(window.location.pathname);
      if (pathLang && pathLang !== i18n.language) {
        void setAppLanguage(pathLang);
      }

      const stripped = stripLanguagePrefix(window.location.pathname);
      const parts = stripped.split('/').filter(Boolean);
      
      // Handle /api/details/:id/:version?
      if (parts[0] === 'api' && parts[1] === 'details' && parts[2]) {
        setActiveView('api-details');
        setDetailApiId(parts[2]);
        setDetailApiVersion(parts[3] ?? null);
        return;
      }

      // Handle /dataset/details/:id
      if (parts[0] === 'dataset' && parts[1] === 'details' && parts[2]) {
        setActiveView('dataset-details');
        setDetailDatasetId(parts[2]);
        return;
      }

      // Default to 'dashboard' only if root path, otherwise keep the view segment
      const nextView = parts[0] || 'dashboard';
      setActiveView(nextView);
    };

    syncFromLocation();

    const onNavigate = (e: Event) => {
      const evt = e as CustomEvent<{ view?: string; params?: Record<string, string>; apiBuilderContext?: APIBuilderContext }>;
      const view = evt.detail?.view;
      if (!view) return;
      
      if (view === 'api-builder') {
        setApiBuilderContext(evt.detail?.apiBuilderContext ?? null);
      }
      
      if (view === 'api-details') {
        const id = evt.detail?.params?.id;
        const version = evt.detail?.params?.version;
        if (id) {
          setDetailApiId(id);
          setDetailApiVersion(version ?? null);
          setActiveView(view);
          const suffix = version ? `/${id}/${version}` : `/${id}`;
          window.history.pushState(null, '', withLanguagePrefix(`/api/details${suffix}`, i18n.language as 'en-US' | 'zh-CN'));
          return;
        }
      }

      if (view === 'dataset-details') {
        const id = evt.detail?.params?.id;
        if (id) {
          setDetailDatasetId(id);
          setActiveView(view);
          window.history.pushState(null, '', withLanguagePrefix(`/dataset/details/${id}`, i18n.language as 'en-US' | 'zh-CN'));
          return;
        }
      }

      setActiveView(view);
      
      let search = '';
      if (evt.detail?.params) {
        search = '?' + new URLSearchParams(evt.detail.params).toString();
      }
      
      window.history.pushState(null, '', withLanguagePrefix(`/${view}${search}`, i18n.language as 'en-US' | 'zh-CN'));
    };

    window.addEventListener('eda:navigate', onNavigate as EventListener);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('eda:navigate', onNavigate as EventListener);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  useEffect(() => {
    const onChanged = (lng: string) => setLanguage(lng);
    i18n.on('languageChanged', onChanged);
    return () => {
      i18n.off('languageChanged', onChanged);
    };
  }, []);

  useEffect(() => {
    const nsByView: Record<string, string | null> = {
      dashboard: 'dashboard',
      datasets: 'datasets',
      'api-builder': 'apiBuilder',
      'api-catalog': 'apiCatalog',
      'api-details': 'apiCatalog',
      'dataset-details': 'datasets',
      approval: 'approval',
      management: 'management',
      settings: 'settings',
    };
    const ns = nsByView[activeView] ?? null;
    if (!ns) return;
    void i18n.loadNamespaces([ns]);
  }, [activeView, language]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'datasets':
        return <Datasets />;
      case 'api-builder':
        return <APIBuilder context={apiBuilderContext} onClearContext={() => setApiBuilderContext(null)} />;
      case 'api-catalog':
        return <APICatalog />;
      case 'api-details':
        return detailApiId ? <ApiDetailsPage apiId={detailApiId} apiVersion={detailApiVersion ?? undefined} /> : <NotFound />;
      case 'dataset-details':
        return detailDatasetId ? <DatasetDetailsPage datasetId={detailDatasetId} /> : <NotFound />;
      case 'approval':
        return <Approval />;
      case 'management':
        return <Management />;
      case 'settings':
        return <Settings />;
      default:
        // If activeView is 'dashboard' (default) but we fell through, render Dashboard.
        // Otherwise, it's an unknown view.
        if (activeView === 'dashboard') {
          return <Dashboard />;
        }
        return <NotFound />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeView={activeView} 
          onViewChange={(view) => {
            setActiveView(view);
            window.history.pushState(null, '', withLanguagePrefix(`/${view}`, i18n.language as 'en-US' | 'zh-CN'));
          }}
          isCollapsed={isSidebarCollapsed}
        />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-8">
            <div key={activeView} className="animate-in fade-in duration-200">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
