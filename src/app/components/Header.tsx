import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Menu, Globe, User, LogOut, Settings, HelpCircle, Bell, Sun, Moon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface HeaderProps {
  onToggleSidebar: () => void;
}

type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  read: boolean;
  level: NotificationLevel;
};

const notificationStorageKey = 'eda-platform-notifications';

export function Header({ onToggleSidebar }: HeaderProps) {
  const [language, setLanguage] = useState('zh-CN');
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(notificationStorageKey);
      if (!raw) {
        return [
          {
            id: 'seed-1',
            title: 'API 发布成功',
            content: 'getUserOrders 已发布到生产环境',
            createdAt: Date.now() - 1000 * 60 * 5,
            read: false,
            level: 'success',
          },
          {
            id: 'seed-2',
            title: '性能预警',
            content: 'searchProducts 平均延迟升高至 220ms',
            createdAt: Date.now() - 1000 * 60 * 30,
            read: false,
            level: 'warning',
          },
          {
            id: 'seed-3',
            title: '安全提醒',
            content: '检测到异常访问：IP 203.0.113.18',
            createdAt: Date.now() - 1000 * 60 * 90,
            read: true,
            level: 'error',
          },
        ];
      }
      const parsed = JSON.parse(raw) as NotificationItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((n) => n && typeof n === 'object');
    } catch {
      return [];
    }
  });

  const unreadCount = useMemo(() => notificationItems.filter((n) => !n.read).length, [notificationItems]);

  const formatTime = (ts: number) => {
    const delta = Date.now() - ts;
    if (delta < 60_000) return '刚刚';
    if (delta < 60 * 60_000) return `${Math.floor(delta / 60_000)} 分钟前`;
    if (delta < 24 * 60 * 60_000) return `${Math.floor(delta / (60 * 60_000))} 小时前`;
    return new Date(ts).toLocaleString('zh-CN');
  };

  const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const pushNotification = (n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    setNotificationItems((prev) => [
      {
        id: createId(),
        createdAt: Date.now(),
        read: false,
        ...n,
      },
      ...prev,
    ]);
  };

  const markAllRead = () => {
    setNotificationItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotificationItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(notificationStorageKey, JSON.stringify(notificationItems));
  }, [notificationItems]);

  useEffect(() => {
    const onPush = (event: Event) => {
      const ce = event as CustomEvent<Partial<Pick<NotificationItem, 'title' | 'content' | 'level'>>>;
      const detail = ce.detail ?? {};
      if (!detail.title || !detail.content) return;
      pushNotification({
        title: detail.title,
        content: detail.content,
        level: detail.level ?? 'info',
      });
    };
    window.addEventListener('eda:notification', onPush as EventListener);
    return () => window.removeEventListener('eda:notification', onPush as EventListener);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const candidates: Array<Omit<NotificationItem, 'id' | 'createdAt' | 'read'>> = [
        { title: '调用量波动', content: 'getProductInfo 今日调用量上涨 18%', level: 'info' },
        { title: '审核提醒', content: '有 2 个 API 等待审批', level: 'warning' },
        { title: '连接健康检查', content: 'ClickHouse-分析库 健康检查通过', level: 'success' },
      ];
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      pushNotification(pick);
    }, 45_000);
    return () => window.clearInterval(interval);
  }, []);

  const dropdownItems = useMemo(() => notificationItems.slice(0, 8), [notificationItems]);
  const historyItems = useMemo(
    () => (notificationFilter === 'unread' ? notificationItems.filter((n) => !n.read) : notificationItems),
    [notificationItems, notificationFilter],
  );

  return (
    <header className="border-b bg-card h-16 flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Toggle Sidebar Button */}
        <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
          <Menu className="size-5" />
        </Button>

        {/* Product Name */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg">EDA Platform</h1>
          <Badge variant="outline" className="text-xs">企业版</Badge>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Team Name */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-xs text-primary">
                T
              </div>
              <span>技术团队</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>切换团队</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-xs text-primary">
                  T
                </div>
                <div>
                  <div>技术团队</div>
                  <div className="text-xs text-muted-foreground">当前团队</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-green-100 flex items-center justify-center text-xs text-green-600">
                  P
                </div>
                <div>
                  <div>产品团队</div>
                  <div className="text-xs text-muted-foreground">3 成员</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                  D
                </div>
                <div>
                  <div>数据团队</div>
                  <div className="text-xs text-muted-foreground">8 成员</div>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Service Account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <div className="size-4 rounded-full bg-green-500" />
              <span className="text-sm">prod-service-01</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>服务账号</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-mono text-sm">prod-service-01</div>
                  <div className="text-xs text-muted-foreground">生产环境</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-yellow-500" />
                <div>
                  <div className="font-mono text-sm">test-service-02</div>
                  <div className="text-xs text-muted-foreground">测试环境</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500" />
                <div>
                  <div className="font-mono text-sm">dev-service-03</div>
                  <div className="text-xs text-muted-foreground">开发环境</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary">
              + 添加服务账号
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="size-4" />
              <span className="text-sm">
                {language === 'zh-CN' ? '简体中文' : 'English'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>选择语言</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLanguage('zh-CN')}>
              <div className="flex items-center justify-between w-full">
                <span>简体中文</span>
                {language === 'zh-CN' && <span>✓</span>}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en-US')}>
              <div className="flex items-center justify-between w-full">
                <span>English</span>
                {language === 'en-US' && <span>✓</span>}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('ja-JP')}>
              <div className="flex items-center justify-between w-full">
                <span>日本語</span>
                {language === 'ja-JP' && <span>✓</span>}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="切换白天/黑夜主题"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          <span className="text-sm">{isDark ? '黑夜' : '白天'}</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative" aria-label="通知">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px]">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between gap-3">
                <div>通知</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      markAllRead();
                    }}
                    disabled={unreadCount === 0}
                  >
                    全部已读
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      setNotificationHistoryOpen(true);
                    }}
                  >
                    历史
                  </Button>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dropdownItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">暂无通知</div>
            ) : (
              <div className="max-h-[360px] overflow-auto">
                {dropdownItems.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div
                        className={[
                          'mt-1 size-2 rounded-full',
                          n.read ? 'bg-muted-foreground/30' : 'bg-primary',
                        ].join(' ')}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className={n.read ? 'text-muted-foreground' : undefined}>{n.title}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{n.content}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => setNotificationHistoryOpen(true)}
              className="justify-center text-sm text-primary"
            >
              查看全部
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2">
              <Avatar className="size-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm">张三</div>
                <div className="text-xs text-muted-foreground">管理员</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <div>张三</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    zhangsan@company.com
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4 mr-2" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4 mr-2" />
              账号设置
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="size-4 mr-2" />
              帮助中心
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="size-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={notificationHistoryOpen} onOpenChange={setNotificationHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>通知历史</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={notificationFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setNotificationFilter('all')}
              >
                全部
              </Button>
              <Button
                size="sm"
                variant={notificationFilter === 'unread' ? 'default' : 'outline'}
                onClick={() => setNotificationFilter('unread')}
              >
                未读
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
              全部已读
            </Button>
          </div>
          <div className="max-h-[520px] overflow-auto border rounded-lg">
            {historyItems.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">暂无通知</div>
            ) : (
              <div className="divide-y">
                {historyItems.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="w-full text-left p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate">{n.title}</div>
                          {!n.read && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">未读</span>}
                          {n.level !== 'info' && (
                            <span className="text-xs px-2 py-0.5 rounded border text-muted-foreground">
                              {n.level === 'success' ? '成功' : n.level === 'warning' ? '警告' : '错误'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{n.content}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(n.createdAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationHistoryOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
