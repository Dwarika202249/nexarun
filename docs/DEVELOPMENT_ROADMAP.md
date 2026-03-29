# 🗺️ NEXARUN — Development Roadmap

> Ek vibe coder ke liye sprint-by-sprint execution plan. No overthinking, just shipping.

---

## How to Use This Roadmap

- Ek sprint complete karo, tabhi next pe jao.
- Har sprint ke end pe game **playable hona chahiye** — kuch toh kaam karta dikhna chahiye.
- Perfection baad mein. Pehle **working > beautiful**.

---

## 🏁 Phase 0 — Project Setup (Day 1)

**Goal:** Blank canvas se Babylon.js engine tak.

```bash
# Vite + TypeScript project banao - taking compatible version with each other
npm create vite@5 nexarun -- --template vanilla-ts
cd nexarun

# Babylon.js install karo
npm install @babylonjs/core @babylonjs/loaders @babylonjs/inspector

# PWA aur DB libraries
npm install idb
npm install -D vite-plugin-pwa

# Dev server start karo
npm run dev
```

### Checklist

- [ ] Vite dev server `localhost:5173` pe chalta hai
- [ ] `index.html` mein `<canvas id="renderCanvas">` hai
- [ ] `main.ts` mein Babylon.js Engine initialize ho raha hai
- [ ] Black canvas dikh raha hai browser mein — yahi success hai!
- [ ] Babylon Inspector toggle ho raha hai `I` key se

**Victory condition:** Browser mein ek black 3D canvas — engine zinda hai. 🎉

---

## 🏗️ Phase 1 — Track & Camera (Day 2-3)

**Goal:** Ek moving track dikhna chahiye — runner ke bina bhi.

### Tasks

1. **Ground tile** banao — `CreateBox` se basic grey platform
2. **3 tiles ka pool** banao
3. **Tile recycling logic** — peeche jaane pe aage aao
4. **FollowCamera** setup karo ek dummy target se
5. **Render loop mein** `Track.update()` call karo

### Code Starting Point

```typescript
// Simplest possible track tile
const tile = BABYLON.MeshBuilder.CreateBox(
  "tile",
  {
    width: 9,
    height: 0.5,
    depth: 30,
  },
  scene,
);
tile.position.y = -0.25;

// Ek dummy sphere — runner baad mein aayega
const dummy = BABYLON.MeshBuilder.CreateSphere("dummy", { diameter: 1 }, scene);
dummy.position.z += 0.1; // Thoda aage badhao har frame
```

**Victory condition:** Track aage badhta dikh raha hai, camera follow kar raha hai. 🎉

---

## 🏃 Phase 2 — Runner (Day 4-5)

**Goal:** Runner track par daudna chahiye.

### Tasks

1. Basic **box/capsule mesh** as runner (3D model baad mein)
2. Runner ko **constant speed se aage** move karo
3. **3 lanes** define karo — Left, Center, Right
4. **Keyboard input** — Left/Right arrow se lane switch
5. Smooth lane switch — Lerp use karo, teleport nahi

### Simple Runner Start

```typescript
const runner = BABYLON.MeshBuilder.CreateCapsule(
  "runner",
  {
    height: 1.8,
    radius: 0.4,
  },
  scene,
);
runner.position.y = 0.9;

// Game loop mein
scene.registerAfterRender(() => {
  runner.position.z += gameSpeed * (engine.getDeltaTime() / 1000);
  track.update(runner.position.z);
});
```

**Victory condition:** Box aadmi teen lanes mein smooth switch kar raha hai. 🎉

---

## 🦘 Phase 3 — Jump & Roll (Day 6-7)

**Goal:** Runner jump aur roll kar sake.

### Tasks

1. **Physics enable** karo scene mein
2. Runner par **PhysicsImpostor** lagao
3. **Jump** — upward impulse, ground check
4. **Roll** — hitbox temporarily chota karo (scale Y)
5. Double jump prevent karo

### Ground Check (Simple)

```typescript
// Physics ke bina bhi kaam karta hai — manual gravity
let velocityY = 0;
const GRAVITY = -20;
const JUMP_FORCE = 10;
const GROUND_Y = 0.9;

scene.registerAfterRender(() => {
  const dt = engine.getDeltaTime() / 1000;
  velocityY += GRAVITY * dt;
  runner.position.y += velocityY * dt;

  if (runner.position.y <= GROUND_Y) {
    runner.position.y = GROUND_Y;
    velocityY = 0;
    isGrounded = true;
  }
});
```

**Victory condition:** Runner jump karta hai, roll karta hai, ground pe wapas aata hai. 🎉

---

## 🚧 Phase 4 — Obstacles & Collision (Day 8-10)

**Goal:** Obstacles spawn hon aur collision detect ho.

### Tasks

1. **Object Pool** banao — 10 obstacles ka
2. Simple box obstacles spawn karo
3. Runner ke aage **procedural placement**
4. **Collision detection** — AABB bounding box check
5. Hit pe runner **blink** karo (invincibility frames)
6. **3 lives** system

### Simple Collision Check (No Physics Needed)

```typescript
// AABB Intersection — enough for runner games
function checkCollision(runner: BABYLON.Mesh, obstacle: BABYLON.Mesh): boolean {
  return runner.intersectsMesh(obstacle, false); // false = AABB check
}
```

**Victory condition:** Runner obstacle se takrata hai, life ghatti hai. 🎉

---

## 🪙 Phase 5 — Coins (Day 11-12)

**Goal:** Coins collect ho, score badhe.

### Tasks

1. **Coin pool** banao — 30 coins
2. **LINE pattern** se coins spawn karo pehle
3. Coin collision pe collect + score increment
4. **Rotation animation** — coin spin kare
5. Score HUD display karo (simple HTML overlay)

**Victory condition:** Coins collect ho rahe hain, score screen pe dikh raha hai. 🎉

---

## 🎨 Phase 6 — UI Screens (Day 13-15)

**Goal:** Proper menus aur HUD.

### Tasks

1. **Main Menu** — HTML overlay, "RUN" button
2. **HUD** — Score, Distance, Lives (hearts)
3. **Game Over screen** — Final score, High Score, Restart button
4. **Loading screen** — Asset progress bar
5. Screen transitions — fade in/out

### Simple HTML HUD

```html
<!-- index.html mein canvas ke upar -->
<div
  id="hud"
  style="position:fixed; top:20px; left:20px; color:#00f5ff; 
                     font-family:monospace; font-size:24px;"
>
  <div>SCORE: <span id="score">0</span></div>
  <div>DIST: <span id="distance">0</span>m</div>
  <div id="lives">❤️❤️❤️</div>
</div>
```

```typescript
// TypeScript mein update karo
document.getElementById("score")!.textContent = score.toString();
```

**Victory condition:** Game start hota hai, khelne ke baad Game Over dikhta hai. 🎉

---

## ✨ Phase 7 — Polish & PWA (Day 16-18)

**Goal:** Game ship-ready banana.

### Tasks

1. **3D Models** replace karo — Mixamo se runner, Sketchfab se obstacles
2. **Animations** attach karo — run, jump, roll, hit
3. **Audio** add karo — BGM, SFX
4. **PWA setup** — manifest.json, Service Worker
5. **IndexedDB** — High score aur coins persist karo
6. **Cyberpunk visuals** — Neon lights, dark ground texture
7. Babylon Inspector remove karo production build se

### Free Asset Sources

- 🧍 Runner animations: **Mixamo.com** (free, CC0)
- 🏙️ City obstacles: **Sketchfab.com** (free models)
- 🎵 BGM: **freemusicarchive.org** ya **pixabay.com/music**
- 🎨 Textures: **ambientcg.com** (PBR textures, free)

**Victory condition:** Game offline khelne layak hai, phone pe install ho sakta hai. 🎉

---

## 🚀 Phase 8 — Launch (Day 19-20)

**Goal:** Internet par live.

### Tasks

1. `npm run build` — production build
2. Lighthouse audit — PWA score check karo
3. **Vercel/Netlify deploy** karo
4. HTTPS confirm karo
5. Mobile testing — Android Chrome pe install karo
6. Share karo! 🎉

### Deployment Commands

```bash
# Build
npm run build

# Vercel deploy (easiest)
npx vercel --prod

# Ya Netlify
npx netlify deploy --prod --dir=dist
```

---

## 📊 Summary Timeline

| Phase | What                  | Days  |
| ----- | --------------------- | ----- |
| 0     | Setup                 | 1     |
| 1     | Track                 | 2-3   |
| 2     | Runner + Input        | 4-5   |
| 3     | Jump + Roll           | 6-7   |
| 4     | Obstacles + Collision | 8-10  |
| 5     | Coins + Score         | 11-12 |
| 6     | UI Screens            | 13-15 |
| 7     | Polish + PWA          | 16-18 |
| 8     | Launch                | 19-20 |

**Total: ~20 days** of focused vibe coding sessions.

---

## 💡 Vibe Coding Rules for NexaRun

1. **Har din ek feature ship karo** — incomplete nahi, working.
2. **Console.log is your friend** — liberally use karo debug ke liye.
3. **Babylon Inspector always open rakho** in development.
4. **Placeholder shapes > missing features** — box runner > no runner.
5. **Commit frequently** — `git commit -m "track recycling works"` — chote commits.
6. **Stack overflow aur Babylon.js forum** — don't guess, lookup.
7. **DeltaTime ALWAYS use karo** — `engine.getDeltaTime() / 1000` — frame-rate independent movement.

---

## 🔗 Key Resources

| Resource                     | URL                                           |
| ---------------------------- | --------------------------------------------- |
| Babylon.js Docs              | https://doc.babylonjs.com                     |
| Babylon.js Playground        | https://playground.babylonjs.com              |
| Babylon.js Forum             | https://forum.babylonjs.com                   |
| Mixamo (free animations)     | https://mixamo.com                            |
| Sketchfab (free models)      | https://sketchfab.com/features/free-3d-models |
| AmbientCG (textures)         | https://ambientcg.com                         |
| Pixabay Music                | https://pixabay.com/music                     |
| PWA Builder                  | https://www.pwabuilder.com                    |
| Lighthouse (Chrome DevTools) | Built into Chrome → F12 → Lighthouse          |

---

_Ab chalo — inspector ke haath nahi aayega NexaRun ka runner. 🚀_
