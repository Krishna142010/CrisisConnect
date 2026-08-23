import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'CrisisConnect - AI Disaster Response',
        short_name: 'CrisisConnect',
        description: 'AI-Powered Real-Time Disaster Response Coordination Platform',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['emergency', 'safety', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // Cache map tiles for offline use
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 4000,
                maxAgeInSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache OpenStreetMap tiles
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 2000,
                maxAgeInSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Hugging Face model files for offline AI
            urlPattern: /^https:\/\/huggingface\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-model-cache',
              expiration: {
                maxEntries: 50,
                maxAgeInSeconds: 90 * 24 * 60 * 60 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache CDN model files
            urlPattern: /^https:\/\/cdn-lfs\.hf\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-model-cache',
              expiration: {
                maxEntries: 50,
                maxAgeInSeconds: 90 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeInSeconds: 365 * 24 * 60 * 60 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  }
});
