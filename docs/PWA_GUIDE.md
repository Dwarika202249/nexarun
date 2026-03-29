# 📱 NEXARUN — PWA Implementation Guide

> App Store ka chakkar nahi, Play Store ka commission nahi. Browser hi kaafi hai.

---

## 1. PWA Kya Achieve Karega?

| Feature | Benefit |
|---|---|
| **Installable** | "Add to Home Screen" — native app jaisa icon |
| **Offline Play** | Service Worker assets cache karta hai |
| **Fullscreen** | Browser UI hide, immersive experience |
| **Fast Launch** | Cache se load — near-instant startup |
| **Cross-Platform** | Android, iOS, Windows, Mac — ek hi codebase |

---

## 2. manifest.json

`public/manifest.json` mein ye daalo:

```json
{
  "name": "NexaRun — The Infinite Cyber Sprint",
  "short_name": "NexaRun",
  "description": "A cyberpunk endless runner game — offline, installable, addictive.",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#0a0a1a",
  "theme_color": "#00f5ff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    {
      "src": "/screenshots/gameplay.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "NexaRun Gameplay"
    }
  ]
}
```

### `index.html` mein link karo:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#00f5ff" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="NexaRun" />
  
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  
  <title>NexaRun</title>
</head>
```

---

## 3. Service Worker (`public/sw.js`)

### Caching Strategy

NexaRun ke liye hum **Cache First** strategy use karenge assets ke liye, aur **Network First** kuch runtime data ke liye.

```
Asset Request
      │
      ▼
[Cache Available?]
  YES ──► Return from Cache (fast!)
  NO  ──► Fetch from Network ──► Store in Cache ──► Return
```

### Complete Service Worker

```javascript
// public/sw.js

const CACHE_NAME = "nexarun-v1";

// Yeh sab assets pehli baar load par cache ho jayenge
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",

  // Babylon.js (bundled via Vite — actual path check karna)
  "/assets/index.js",
  "/assets/index.css",

  // 3D Models
  "/assets/models/runner.glb",
  "/assets/models/barrier.glb",
  "/assets/models/drone.glb",
  "/assets/models/nexacoin.glb",
  "/assets/models/track_tile.glb",

  // Textures
  "/assets/textures/neon_ground.jpg",
  "/assets/textures/skybox_cyber.env",

  // Audio
  "/assets/audio/cyberpunk_bgm.mp3",
  "/assets/audio/coin_pickup.mp3",
  "/assets/audio/jump.mp3",
  "/assets/audio/hit.mp3",
  "/assets/audio/game_over.mp3",

  // Icons
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// --- INSTALL EVENT ---
// Sab assets cache mein daal do
self.addEventListener("install", (event) => {
  console.log("[NexaRun SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[NexaRun SW] Precaching all game assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// --- ACTIVATE EVENT ---
// Purana cache delete karo (versioning ke liye)
self.addEventListener("activate", (event) => {
  console.log("[NexaRun SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[NexaRun SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// --- FETCH EVENT ---
// Har request intercept karo
self.addEventListener("fetch", (event) => {
  // Sirf GET requests handle karo
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Cache mein mila? Return karo — lightning fast
      if (cachedResponse) {
        return cachedResponse;
      }

      // Cache miss — network se fetch karo aur cache karo
      return fetch(event.request).then((networkResponse) => {
        // Invalid response? Return karo bina cache kiye
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache mein store karo future ke liye
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Network bhi nahi, cache bhi nahi — offline fallback
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
```

---

## 4. Service Worker Registration (`src/pwa/registerSW.ts`)

```typescript
// src/pwa/registerSW.ts

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported in this browser");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("[NexaRun] Service Worker registered:", registration.scope);

      // Update check — naya version available hai?
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Nayi update hai — user ko notify karo
            showUpdateBanner();
          }
        });
      });
    } catch (err) {
      console.error("[NexaRun] SW registration failed:", err);
    }
  });
}

function showUpdateBanner() {
  // Simple update notification
  const banner = document.createElement("div");
  banner.innerHTML = `
    <div style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
                background:#00f5ff; color:#000; padding:12px 20px; border-radius:8px;
                font-family:monospace; z-index:9999; cursor:pointer;">
      ⚡ NexaRun update available! Click to refresh.
    </div>
  `;
  banner.onclick = () => window.location.reload();
  document.body.appendChild(banner);
}
```

### `main.ts` mein call karo:

```typescript
import { registerServiceWorker } from "./pwa/registerSW";

// Game start hone se pehle SW register karo
registerServiceWorker();
```

---

## 5. IndexedDB — Data Persistence (`src/db/storage.ts`)

```typescript
// src/db/storage.ts
// idb library use karo: npm install idb

import { openDB } from "idb";

const DB_NAME = "nexarun-db";
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Player stats store
      if (!db.objectStoreNames.contains("playerData")) {
        db.createObjectStore("playerData");
      }
    },
  });
}

export const storage = {
  async getHighScore(): Promise<number> {
    const db = await getDB();
    return (await db.get("playerData", "highScore")) ?? 0;
  },

  async setHighScore(score: number): Promise<void> {
    const db = await getDB();
    await db.put("playerData", score, "highScore");
  },

  async getNexaCoins(): Promise<number> {
    const db = await getDB();
    return (await db.get("playerData", "nexaCoins")) ?? 0;
  },

  async addNexaCoins(amount: number): Promise<void> {
    const db = await getDB();
    const current = await this.getNexaCoins();
    await db.put("playerData", current + amount, "nexaCoins");
  },

  async getUnlockedSkins(): Promise<string[]> {
    const db = await getDB();
    return (await db.get("playerData", "unlockedSkins")) ?? ["default"];
  },

  async unlockSkin(skinId: string): Promise<void> {
    const db = await getDB();
    const skins = await this.getUnlockedSkins();
    if (!skins.includes(skinId)) {
      await db.put("playerData", [...skins, skinId], "unlockedSkins");
    }
  },
};
```

---

## 6. Vite PWA Plugin (Recommended)

Manual SW likhne ki jagah `vite-plugin-pwa` bhi use kar sakte ho:

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,glb,gltf,jpg,png,mp3,env}"],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20MB — 3D files bade hote hain
      },
      manifest: {
        name: "NexaRun — The Infinite Cyber Sprint",
        short_name: "NexaRun",
        theme_color: "#00f5ff",
        background_color: "#0a0a1a",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
```

> 💡 `vite-plugin-pwa` automatically Workbox-based SW generate karta hai — production-grade caching with zero manual effort.

---

## 7. PWA Checklist — Ship Karne Se Pehle

- [ ] `manifest.json` linked in `index.html`
- [ ] Icons: 192x192 aur 512x512 PNG (maskable bhi)
- [ ] Service Worker registered aur working
- [ ] All game assets precached
- [ ] Lighthouse PWA score ≥ 90
- [ ] "Add to Home Screen" tested on Android Chrome
- [ ] Offline gameplay verified (Network tab mein "Offline" toggle karo)
- [ ] HTTPS deploy karo (SW sirf HTTPS par kaam karta hai — localhost except)

---

## 8. Deployment

```bash
# Build karo
npm run build

# dist/ folder ko deploy karo — ye options hain:
# 1. Vercel (easiest — free, HTTPS auto)
# 2. Netlify (drag & drop dist/ folder)
# 3. GitHub Pages (free hosting)
# 4. Cloudflare Pages (best performance globally)

# Vercel ke liye:
npx vercel deploy
```

> ⚠️ Service Worker **sirf HTTPS par kaam karta hai**. Localhost pe development theek hai, but production deploy karne ke baad hi real PWA test karo.
