import { Database, Layers, Zap, BookOpen, LayoutDashboard, Users, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from './ui/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
}

export function Sidebar({ activeView, onViewChange, isCollapsed }: SidebarProps) {
  const { t } = useTranslation('common');
  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'datasets', label: t('nav.datasets'), icon: Layers },
    { id: 'api-builder', label: t('nav.apiBuilder'), icon: Zap },
    { id: 'api-catalog', label: t('nav.apiCatalog'), icon: BookOpen },
    { id: 'approval', label: t('nav.approval'), icon: CheckSquare },
    { id: 'management', label: t('nav.management'), icon: Users },
  ];

  return (
    <div 
      className={cn(
        "border-r bg-card h-full flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {!isCollapsed && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded flex items-center justify-center">
              <Database className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm">{t('sidebar.title')}</p>
              <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
            </div>
          </div>
        </div>
      )}
      
      {isCollapsed && (
        <div className="p-4 border-b flex justify-center">
          <div className="size-8 bg-primary rounded flex items-center justify-center">
            <Database className="size-5 text-primary-foreground" />
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full flex items-center rounded-lg transition-colors',
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2 text-left',
                  activeView === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
      
      {!isCollapsed && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          {t('footer.version', { version: '1.0.0' })} | {t('footer.copyright', { year: 2025 })}
        </div>
      )}
      
      {isCollapsed && (
        <div className="p-4 border-t text-center text-xs text-muted-foreground">
          {t('footer.version', { version: '1.0' })}
        </div>
      )}
    </div>
  );
}
