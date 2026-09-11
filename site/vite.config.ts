import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, 'tools/**', 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
