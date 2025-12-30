import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Datasets } from './components/Datasets';
import { APIBuilder, type APIBuilderContext } from './components/APIBuilder';
import { APICatalog } from './components/APICatalog';
import { Approval } from './components/Approval';
import { Management } from './components/Management';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [apiBuilderContext, setApiBuilderContext] = useState<APIBuilderContext | null>(null);

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const evt = e as CustomEvent<{ view?: string; apiBuilderContext?: APIBuilderContext }>;
      const view = evt.detail?.view;
      if (!view) return;
      if (view === 'api-builder') {
        setApiBuilderContext(evt.detail?.apiBuilderContext ?? null);
      }
      setActiveView(view);
    };

    window.addEventListener('eda:navigate', onNavigate as EventListener);
    return () => window.removeEventListener('eda:navigate', onNavigate as EventListener);
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
          onViewChange={setActiveView}
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
