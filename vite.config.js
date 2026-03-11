import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/gym/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'assets/icons/*.webp', 'assets/sounds/*.mp3'],
      manifest: {
        name: 'Valhalla - Dark Nordic Fitness',
        short_name: 'Valhalla',
        description: 'Dark Nordic fitness: entrenamiento y progreso',
        theme_color: '#071A17',
        background_color: '#071A17',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/gym/',
        scope: '/gym/',
        icons: [
          {
            src: 'assets/icons/icon-48.webp',
            sizes: '48x48',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-72.webp',
            sizes: '72x72',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-96.webp',
            sizes: '96x96',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-128.webp',
            sizes: '128x128',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-192.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-256.webp',
            sizes: '256x256',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
    host: '0.0.0.0',
    port: 3000,
    cors: true
  }
})
