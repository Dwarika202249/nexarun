import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,glb,gltf,jpg,png,mp3,env,wasm}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
      manifest: {
        name: 'NexaRun — The Infinite Cyber Sprint',
        short_name: 'NexaRun',
        description: 'A cyberpunk endless runner game — offline, installable, addictive.',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#0a0a1a',
        theme_color: '#00f5ff',
        categories: ['games', 'entertainment'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true, // Listen on all local IPs
  },
});
