export type LanguagePrefix = 'en' | 'zh';

export type SupportedLanguage = 'en-US' | 'zh-CN';

export const languagePrefixMap: Record<LanguagePrefix, SupportedLanguage> = {
  en: 'en-US',
  zh: 'zh-CN',
};

export const languageToPrefixMap: Record<SupportedLanguage, LanguagePrefix> = {
  'en-US': 'en',
  'zh-CN': 'zh',
};

export function normalizeLanguage(language: string | undefined | null): SupportedLanguage {
  if (language === 'en-US' || language === 'en') return 'en-US';
  return 'zh-CN';
}

export function getLanguageFromPathname(pathname: string): SupportedLanguage | null {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const prefix = trimmed.split('/')[0] as string | undefined;
  if (prefix === 'en') return 'en-US';
  if (prefix === 'zh') return 'zh-CN';
  return null;
}

export function stripLanguagePrefix(pathname: string): string {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const parts = trimmed.split('/');
  const first = parts[0];
  if (first === 'en' || first === 'zh') {
    const rest = parts.slice(1).join('/');
    return `/${rest}`;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function withLanguagePrefix(pathname: string, language: SupportedLanguage): string {
  const prefix = languageToPrefixMap[language] ?? 'zh';
  const stripped = stripLanguagePrefix(pathname);
  const path = stripped === '/' ? '' : stripped;
  return `/${prefix}${path}`;
}

