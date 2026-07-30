import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Miklens Bio R&D Platform',
        short_name: 'MiklensRND',
        description: 'Enterprise AI Powered Research & Development Management Platform',
        theme_color: '#059669',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024 // 8MB
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('react')) return 'vendor-react';
          }
        }
      }
    }
  }
})
