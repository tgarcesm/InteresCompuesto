import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REPO_NAME = 'InteresCompuesto';

/** Local: /. Producción (GitHub Pages): /InteresCompuesto/ */
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${REPO_NAME}/` : '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          chart: ['chart.js'],
        },
      },
    },
  },
  server: {
    port: 8080,
    open: true,
  },
  preview: {
    port: 8080,
  },
});
