/**
 * Environment Configuration Module
 * 
 * This module is responsible for loading, validating, and exporting
 * environment-specific configuration variables.
 */

// Define the shape of our configuration
interface EnvConfig {
  appName: string;
  apiBaseUrl: string;
  defaultLocale: string;
  features: {
    mock: boolean;
    analytics: boolean;
    devTools: boolean;
  };
  sentryDsn?: string;
  isDev: boolean;
  isProd: boolean;
  mode: string;
}

// Helper to convert "true"/"false" strings to booleans
const toBool = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true';
};

// Validate required environment variables
const requiredVars: (keyof ImportMetaEnv)[] = [
  'VITE_APP_NAME',
  'VITE_API_BASE_URL',
  'VITE_DEFAULT_LOCALE'
];

const missingVars = requiredVars.filter((key) => !import.meta.env[key]);

if (missingVars.length > 0) {
  console.error(`
    Configuration Error:
    Missing required environment variables: ${missingVars.join(', ')}
    Please check your .env file or environment configuration.
  `);
  // In development, we might want to throw to stop execution.
  // In production, we might want to log securely and maybe fallback if possible,
  // but for critical configs like API URL, stopping is usually safer.
  if (import.meta.env.DEV) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Export the typed configuration object
export const env: EnvConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'API Platform',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE || 'zh-CN',
  features: {
    mock: toBool(import.meta.env.VITE_ENABLE_MOCK),
    analytics: toBool(import.meta.env.VITE_ENABLE_ANALYTICS),
    devTools: toBool(import.meta.env.VITE_ENABLE_DEV_TOOLS, import.meta.env.DEV),
  },
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Debug log in development
if (import.meta.env.DEV) {
  console.log('Environment Configuration Loaded:', env);
}
