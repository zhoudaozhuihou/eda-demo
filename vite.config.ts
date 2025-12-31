import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteMockServe } from 'vite-plugin-mock';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command, mode }) => ({
  publicDir: 'locales',
  plugins: [
    react(),
    tailwindcss(),
    viteMockServe({
      mockPath: 'src/mocks',
      enable: command === 'serve' && mode !== 'production',
      watchFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));
