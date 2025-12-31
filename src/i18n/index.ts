import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { getLanguageFromPathname, normalizeLanguage, type SupportedLanguage } from './routing';

const storageKey = 'eda-platform-language';

export const supportedLanguages: SupportedLanguage[] = ['zh-CN', 'en-US'];
export const defaultLanguage: SupportedLanguage = 'zh-CN';

export const namespaces = [
  'common',
  'app',
  'dashboard',
  'datasets',
  'apiBuilder',
  'apiCatalog',
  'approval',
  'management',
  'settings',
  'datetime',
] as const;

export type AppNamespace = (typeof namespaces)[number];

function readStoredLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  return normalizeLanguage(raw);
}

export async function setAppLanguage(language: SupportedLanguage) {
  const next = normalizeLanguage(language);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, next);
  }
  await i18n.changeLanguage(next);
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return defaultLanguage;
  const fromPath = getLanguageFromPathname(window.location.pathname);
  if (fromPath) return fromPath;
  const fromStorage = readStoredLanguage();
  if (fromStorage) return fromStorage;
  return defaultLanguage;
}

let inited = false;

export function ensureI18n() {
  if (inited) return i18n;
  inited = true;

  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      lng: getInitialLanguage(),
      fallbackLng: defaultLanguage,
      supportedLngs: supportedLanguages,
      ns: namespaces as unknown as string[],
      defaultNS: 'common',
      backend: {
        loadPath: '/{{lng}}/{{ns}}.json',
      },
      load: 'currentOnly',
      returnNull: false,
      returnEmptyString: false,
      keySeparator: '.',
      nsSeparator: ':',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'b', 'i', 'em', 'span'],
      },
      saveMissing: false,
    });

  if (typeof window !== 'undefined') {
    const applyDir = () => {
      document.documentElement.lang = i18n.language;
      document.documentElement.dir = i18n.dir();
    };
    applyDir();
    i18n.on('languageChanged', applyDir);
  }

  return i18n;
}

ensureI18n();

export default i18n;

