import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: GitHub Pages เสิร์ฟใต้ /exercise-app/ (ตั้ง env GHPAGES=true)
// โฮสต์อื่น (Netlify/Cloudflare/โดเมนเอง) เสิร์ฟที่ root "/"
const base = process.env.GHPAGES ? "/exercise-app/" : "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // ลงทะเบียนเองใน main.jsx (เช็กอัปเดตเป็นระยะ + รีโหลดอัตโนมัติ)
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'th-steps.json', 'th-names.json'],
      manifest: {
        name: 'FitPedia — คลังท่าออกกำลังกาย',
        short_name: 'FitPedia',
        description: 'ค้นหาท่าออกกำลังกาย 1,324 ท่า พร้อม GIF และวิธีทำภาษาไทย',
        lang: 'th',
        theme_color: '#ff5a3c',
        background_color: '#0f1115',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // precache คำแปลไทย (json) ด้วย เพื่อให้ใช้ออฟไลน์ได้เต็มที่
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // ดาต้าหลัก + รูป/GIF จาก GitHub raw → cache ไว้ใช้ออฟไลน์
            urlPattern: ({ url }) => url.hostname === 'raw.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-data',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
