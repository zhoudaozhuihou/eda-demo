import { Globe } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/i18n';
import { withLanguagePrefix, type SupportedLanguage } from '@/i18n/routing';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');

  const current = (i18n.language === 'en-US' ? 'en-US' : 'zh-CN') as SupportedLanguage;

  const label = useMemo(() => {
    if (current === 'en-US') return t('language.enUS');
    return t('language.zhCN');
  }, [current, t]);

  const setLanguage = async (next: SupportedLanguage) => {
    await setAppLanguage(next);
    const nextPath = withLanguagePrefix(window.location.pathname, next);
    window.history.pushState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" />
          <span className="text-sm">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => void setLanguage('zh-CN')}
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('language.zhCN')}</span>
            {current === 'zh-CN' && <span>✓</span>}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => void setLanguage('en-US')}
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('language.enUS')}</span>
            {current === 'en-US' && <span>✓</span>}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

