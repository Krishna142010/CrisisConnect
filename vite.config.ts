import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      workbox: {
        // Increase precache size limit to 30 MiB for ONNX WASM binaries and bundles
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
      },
      manifest: {
        name: 'CrisisConnect',
        short_name: 'CrisisConnect',
        description: 'AI-Powered Real-Time Disaster Response Coordination Platform',
        theme_color: '#111827',
        background_color: '#0a0e1a',
        display: 'standalone',
        icons: []
      }
    })
  ],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 3000
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  worker: {
    format: 'es'
  }
});
