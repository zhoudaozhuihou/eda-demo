import { useEffect, useState } from 'react';
import { Header } from '@/app/components/Header';
import { Sidebar } from '@/app/components/Sidebar';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Datasets } from '@/features/datasets/Datasets';
import { APIBuilder, type APIBuilderContext } from '@/features/api-builder/APIBuilder';
import { APICatalog } from '@/features/api-catalog/APICatalog';
import { Approval } from '@/features/approval/Approval';
import { Management } from '@/features/management/Management';
import { Settings } from '@/features/settings/Settings';
import { Toaster } from './components/ui/sonner';
import i18n, { setAppLanguage } from '@/i18n';
import { getLanguageFromPathname, stripLanguagePrefix, withLanguagePrefix } from '@/i18n/routing';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [apiBuilderContext, setApiBuilderContext] = useState<APIBuilderContext | null>(null);

  useEffect(() => {
    const syncFromLocation = () => {
      const pathLang = getLanguageFromPathname(window.location.pathname);
      if (pathLang && pathLang !== i18n.language) {
        void setAppLanguage(pathLang);
      }

      const stripped = stripLanguagePrefix(window.location.pathname);
      const parts = stripped.split('/').filter(Boolean);
      const nextView = parts[0] || 'dashboard';
      setActiveView(nextView);
    };

    syncFromLocation();

    const onNavigate = (e: Event) => {
      const evt = e as CustomEvent<{ view?: string; apiBuilderContext?: APIBuilderContext }>;
      const view = evt.detail?.view;
      if (!view) return;
      if (view === 'api-builder') {
        setApiBuilderContext(evt.detail?.apiBuilderContext ?? null);
      }
      setActiveView(view);
      window.history.pushState(null, '', withLanguagePrefix(`/${view}`, i18n.language as 'en-US' | 'zh-CN'));
    };

    window.addEventListener('eda:navigate', onNavigate as EventListener);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('eda:navigate', onNavigate as EventListener);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

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
      case 'approval':
        return <Approval />;
      case 'management':
        return <Management />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
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
