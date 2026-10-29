import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@mars/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MARS — Meditative Anatomy Learning',
        short_name: 'MARS',
        description: 'Coursera-like anatomy learning platform with video lessons, practice questions, and timed test series.',
        theme_color: '#090941',
        background_color: '#090941',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  esbuild: {
    target: 'esnext',
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5053',
        changeOrigin: true,
      },
    },
  },
});
