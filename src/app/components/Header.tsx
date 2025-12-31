import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
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
import { Menu, User, LogOut, Settings, HelpCircle, Bell, Sun, Moon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { LanguageSwitcher } from './LanguageSwitcher';
import { formatDateTime } from '@/i18n/format';

interface HeaderProps {
  onToggleSidebar: () => void;
}

type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

type NotificationItem = {
  id: string;
  titleKey?: string;
  contentKey?: string;
  titleParams?: Record<string, unknown>;
  contentParams?: Record<string, unknown>;
  title?: string;
  content?: string;
  createdAt: number;
  read: boolean;
  level: NotificationLevel;
};

const notificationStorageKey = 'eda-platform-notifications';

export function Header({ onToggleSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation(['common', 'app']);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [now, setNow] = useState(0);

  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(notificationStorageKey);
      if (!raw) {
        return [
          {
            id: 'seed-1',
            titleKey: 'app:notifications.seed.publishSuccess.title',
            contentKey: 'app:notifications.seed.publishSuccess.content',
            contentParams: { apiName: 'getUserOrders' },
            createdAt: Date.now() - 1000 * 60 * 5,
            read: false,
            level: 'success',
          },
          {
            id: 'seed-2',
            titleKey: 'app:notifications.seed.performanceWarning.title',
            contentKey: 'app:notifications.seed.performanceWarning.content',
            contentParams: { apiName: 'searchProducts', latency: 220 },
            createdAt: Date.now() - 1000 * 60 * 30,
            read: false,
            level: 'warning',
          },
          {
            id: 'seed-3',
            titleKey: 'app:notifications.seed.securityAlert.title',
            contentKey: 'app:notifications.seed.securityAlert.content',
            contentParams: { ip: '203.0.113.18' },
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
    if (!now) return formatDateTime(ts, undefined, i18n.language);
    const delta = now - ts;
    if (delta < 60_000) return t('time.justNow');
    if (delta < 60 * 60_000) return t('time.minutesAgo', { count: Math.floor(delta / 60_000) });
    if (delta < 24 * 60 * 60_000) return t('time.hoursAgo', { count: Math.floor(delta / (60 * 60_000)) });
    return formatDateTime(ts, undefined, i18n.language);
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
    const raf = window.requestAnimationFrame(() => setNow(Date.now()));
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, []);

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
        {
          titleKey: 'app:notifications.seed.trafficSpike.title',
          contentKey: 'app:notifications.seed.trafficSpike.content',
          contentParams: { apiName: 'getProductInfo', percent: 18 },
          level: 'info',
        },
        {
          titleKey: 'app:notifications.seed.approvalReminder.title',
          contentKey: 'app:notifications.seed.approvalReminder.content',
          contentParams: { count: 2 },
          level: 'warning',
        },
        {
          titleKey: 'app:notifications.seed.healthCheck.title',
          contentKey: 'app:notifications.seed.healthCheck.content',
          contentParams: { name: 'ClickHouse-分析库' },
          level: 'success',
        },
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

  const resolveText = (item: NotificationItem, field: 'title' | 'content') => {
    const key = field === 'title' ? item.titleKey : item.contentKey;
    const params = field === 'title' ? item.titleParams : item.contentParams;
    if (key) return t(key, params);
    const raw = field === 'title' ? item.title : item.content;
    return raw ?? '';
  };

  return (
    <header className="border-b bg-card h-16 flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Toggle Sidebar Button */}
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} aria-label={t('a11y.toggleSidebar')}>
          <Menu className="size-5" />
        </Button>

        {/* Product Name */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg">{t('app.name')}</h1>
          <Badge variant="outline" className="text-xs">{t('app.edition')}</Badge>
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
              <span>{t('app:team.tech')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t('app:team.switch')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-xs text-primary">
                  T
                </div>
                <div>
                  <div>{t('app:team.tech')}</div>
                  <div className="text-xs text-muted-foreground">{t('app:team.current')}</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-green-100 flex items-center justify-center text-xs text-green-600">
                  P
                </div>
                <div>
                  <div>{t('app:team.product')}</div>
                  <div className="text-xs text-muted-foreground">{t('app:team.members', { count: 3 })}</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                  D
                </div>
                <div>
                  <div>{t('app:team.data')}</div>
                  <div className="text-xs text-muted-foreground">{t('app:team.members', { count: 8 })}</div>
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
            <DropdownMenuLabel>{t('app:serviceAccount.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-mono text-sm">prod-service-01</div>
                  <div className="text-xs text-muted-foreground">{t('app:serviceAccount.prod')}</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-yellow-500" />
                <div>
                  <div className="font-mono text-sm">test-service-02</div>
                  <div className="text-xs text-muted-foreground">{t('app:serviceAccount.test')}</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500" />
                <div>
                  <div className="font-mono text-sm">dev-service-03</div>
                  <div className="text-xs text-muted-foreground">{t('app:serviceAccount.dev')}</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary">
              {t('app:serviceAccount.add')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label={t('app:theme.toggle')}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          <span className="text-sm">{isDark ? t('app:theme.dark') : t('app:theme.light')}</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative" aria-label={t('app:notifications.title')}>
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
                <div>{t('app:notifications.title')}</div>
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
                    {t('app:notifications.markAllRead')}
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
                    {t('app:notifications.history')}
                  </Button>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dropdownItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">{t('app:notifications.empty')}</div>
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
                          <div className={n.read ? 'text-muted-foreground' : undefined}>{resolveText(n, 'title')}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{resolveText(n, 'content')}</div>
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
              {t('app:notifications.viewAll')}
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
                <div className="text-xs text-muted-foreground">{t('app:user.roles.admin')}</div>
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
              {t('app:userMenu.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4 mr-2" />
              {t('app:userMenu.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="size-4 mr-2" />
              {t('app:userMenu.help')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="size-4 mr-2" />
              {t('app:userMenu.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={notificationHistoryOpen} onOpenChange={setNotificationHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('app:notifications.historyTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={notificationFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setNotificationFilter('all')}
              >
                {t('app:notifications.filterAll')}
              </Button>
              <Button
                size="sm"
                variant={notificationFilter === 'unread' ? 'default' : 'outline'}
                onClick={() => setNotificationFilter('unread')}
              >
                {t('app:notifications.filterUnread')}
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
              {t('app:notifications.markAllRead')}
            </Button>
          </div>
          <div className="max-h-[520px] overflow-auto border rounded-lg">
            {historyItems.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">{t('app:notifications.empty')}</div>
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
                          <div className="truncate">{resolveText(n, 'title')}</div>
                          {!n.read && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{t('app:notifications.unreadBadge')}</span>}
                          {n.level !== 'info' && (
                            <span className="text-xs px-2 py-0.5 rounded border text-muted-foreground">
                              {t(`app:notifications.level.${n.level}`)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{resolveText(n, 'content')}</div>
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
              {t('app:actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
