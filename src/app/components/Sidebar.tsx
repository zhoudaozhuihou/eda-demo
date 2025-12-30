import { Database, Layers, Zap, BookOpen, LayoutDashboard, Settings, Users, CheckSquare } from 'lucide-react';
import { cn } from './ui/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: '仪表板', icon: LayoutDashboard },
  { id: 'datasets', label: '数据集', icon: Layers },
  { id: 'api-builder', label: 'API 构建器', icon: Zap },
  { id: 'api-catalog', label: 'API 目录', icon: BookOpen },
  { id: 'approval', label: '审核中心', icon: CheckSquare },
  { id: 'management', label: '管理中心', icon: Users },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export function Sidebar({ activeView, onViewChange, isCollapsed }: SidebarProps) {
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
              <p className="text-sm">企业数据API平台</p>
              <p className="text-xs text-muted-foreground">连接 · 数据集 · API</p>
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
          v1.0.0 | © 2025 EDA
        </div>
      )}
      
      {isCollapsed && (
        <div className="p-4 border-t text-center text-xs text-muted-foreground">
          v1.0
        </div>
      )}
    </div>
  );
}
