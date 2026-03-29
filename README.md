# ⚡ NEXARUN — The Infinite Cyber Sprint

> *An endless 3D runner game built with Babylon.js, served as a fully offline-capable PWA.*

---

## 🎮 What is NexaRun?

**NexaRun** is a fast-paced, cyberpunk-themed 3D endless runner game playable directly in the browser — no app store, no installs, no friction. Set in a neon-lit futuristic city, your runner sprints across hover-rails, dodging rogue drones, energy barriers, and collapsing platforms while collecting **NexaCoins** to unlock skins and power-ups.

Think Subway Surfers, but make it **cyberpunk, make it web-native, make it yours.**

---

## 🧰 Core Tech Stack

| Layer | Technology | Why |
|---|---|---|
| 3D Engine | **Babylon.js** | Full game engine — physics, camera, collisions built-in |
| Language | **TypeScript** | Type safety = fewer runtime surprises |
| Bundler | **Vite** | Blazing fast HMR & build |
| Styling / UI | **HTML + CSS** (HUD overlay) | Lightweight UI on top of canvas |
| PWA | **Service Worker + manifest.json** | Offline play, install to home screen |
| Storage | **IndexedDB (via idb)** | Persist scores, coins, unlocks |
| Audio | **Babylon.js Sound API** | Spatial audio, BGM, SFX |
| 3D Assets | **.glb / .gltf** (Mixamo + Sketchfab) | Optimized 3D models |

---

## 🗂️ Project Folder Structure

```
nexarun/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── icons/                 # App icons (192x192, 512x512)
│   └── assets/
│       ├── models/            # .glb 3D models (runner, obstacles, coins)
│       ├── textures/          # Ground, sky, neon textures
│       └── audio/             # BGM + SFX
│
├── src/
│   ├── main.ts                # Entry point — engine init
│   ├── game/
│   │   ├── GameManager.ts     # Core game loop controller
│   │   ├── Runner.ts          # Player character logic
│   │   ├── Track.ts           # Infinite track generation
│   │   ├── ObstacleSpawner.ts # Procedural obstacle logic
│   │   ├── CoinSpawner.ts     # Coin row generation
│   │   ├── InputHandler.ts    # Keyboard + swipe input
│   │   └── ScoreManager.ts    # Score, multiplier, distance
│   │
│   ├── ui/
│   │   ├── HUD.ts             # Score, lives, distance display
│   │   ├── MainMenu.ts        # Start screen
│   │   ├── GameOver.ts        # Game over screen
│   │   └── ShopScreen.ts      # Character/skin unlock shop
│   │
│   ├── pwa/
│   │   └── registerSW.ts      # Service Worker registration
│   │
│   ├── db/
│   │   └── storage.ts         # IndexedDB wrapper (idb library)
│   │
│   └── utils/
│       ├── constants.ts       # Game config constants
│       ├── mathUtils.ts       # Lane positions, easing functions
│       └── assetLoader.ts     # Preload all assets before game start
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start

```bash
# 1. Clone karo
git clone https://github.com/yourname/nexarun.git
cd nexarun

# 2. Dependencies install karo
npm install

# 3. Dev server start karo
npm run dev

# 4. Production build
npm run build

# 5. Preview production build locally
npm run preview
```

> 💡 **Vibe Coding Tip:** `npm run dev` pe jo bhi changes karo, Vite instant HMR se browser update karega. No full refresh needed.

---

## 📱 PWA Install

1. Chrome/Edge me game open karo
2. Address bar me "Install" icon dikhega
3. Click karo → Home screen par icon aa jayega
4. Pehli baar load hone ke baad — **fully offline playable!**

---

## 🎯 Milestone Roadmap

| Phase | Goal | Status |
|---|---|---|
| Phase 1 | Engine setup, track rendering, basic runner | 🔲 |
| Phase 2 | Lane switching, jump, roll mechanics | 🔲 |
| Phase 3 | Obstacles + collision detection | 🔲 |
| Phase 4 | Coins, score, distance system | 🔲 |
| Phase 5 | PWA + Service Worker + offline caching | 🔲 |
| Phase 6 | HUD, Main Menu, Game Over screen | 🔲 |
| Phase 7 | Shop + IndexedDB persistence | 🔲 |
| Phase 8 | Audio, polish, performance tuning | 🔲 |

---

## 📄 Documentation Index

| File | Description |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Engine setup, scene graph, Babylon.js deep-dive |
| [`GAME_MECHANICS.md`](./GAME_MECHANICS.md) | Runner, lanes, obstacles, coins — full logic spec |
| [`PWA_GUIDE.md`](./PWA_GUIDE.md) | Service Worker, manifest, caching strategy |
| [`DEVELOPMENT_ROADMAP.md`](./DEVELOPMENT_ROADMAP.md) | Sprint-by-sprint implementation plan |

---

*Built with 🧠 by a frontend engineer who refused to let the inspector catch him.*
