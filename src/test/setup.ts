import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

function buildResources(modules: Record<string, unknown>) {
  return Object.entries(modules).reduce<Record<string, unknown>>((acc, [path, data]) => {
    const filename = path.split('/').pop() ?? '';
    const ns = filename.replace(/\.json$/i, '');
    if (!ns) return acc;
    acc[ns] = data;
    return acc;
  }, {});
}

const zhModules = import.meta.glob('../../public/locales/zh-CN/*.json', { eager: true, import: 'default' });
const enModules = import.meta.glob('../../public/locales/en-US/*.json', { eager: true, import: 'default' });

const resources = {
  'zh-CN': buildResources(zhModules),
  'en-US': buildResources(enModules),
} as unknown as Record<string, Record<string, Record<string, unknown>>>;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    resources,
    ns: Object.keys(resources['zh-CN'] ?? {}),
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'b', 'i', 'em', 'span'],
    },
  } as never);
}

afterEach(() => {
  cleanup();
});
