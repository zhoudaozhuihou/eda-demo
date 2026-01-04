import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteMockServe } from 'vite-plugin-mock';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const enableMock = env.VITE_ENABLE_MOCK === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      viteMockServe({
        mockPath: 'src/mocks',
        enable: enableMock && command === 'serve',
        watchFiles: true,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['react-router-dom'],
    },
  };
});
