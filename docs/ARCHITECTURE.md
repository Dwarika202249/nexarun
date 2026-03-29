# 🏗️ NEXARUN — Architecture & Engine Guide

## 1. Babylon.js — Why It's The Engine

Babylon.js ek **complete game engine** hai (sirf renderer nahi). Iska matlab:

| Feature | Babylon.js | Three.js |
|---|---|---|
| Physics Engine | ✅ Built-in (Havok/Cannon.js) | ❌ Manual integration |
| Collision Detection | ✅ Native mesh intersection | ❌ Manual raycasting |
| FollowCamera | ✅ One-liner | ❌ Scratch se likhna padega |
| .glb / .gltf Loader | ✅ First-class support | ⚠️ GLTFLoader plugin |
| Animation System | ✅ AnimationGroup built-in | ⚠️ Manual AnimationMixer |
| Inspector (Debug) | ✅ Babylon Inspector overlay | ❌ Nahi hai |

> 💡 Endless runner ke liye Babylon.js = cheat code. Physics, camera, collisions — sab pre-wired.

---

## 2. Scene Graph — How Babylon.js Thinks

```
Engine
  └── Scene
        ├── Camera (FollowCamera — tracks runner)
        ├── Lights
        │     ├── HemisphericLight (ambient fill)
        │     └── PointLight (neon glow effect)
        │
        ├── Runner (Mesh + AnimationGroup)
        │     ├── runAnimation
        │     ├── jumpAnimation
        │     └── rollAnimation
        │
        ├── Track (Tile pool — recycled)
        │     ├── Tile_01 (active)
        │     ├── Tile_02 (active)
        │     └── Tile_03 (active)
        │
        ├── ObstaclePool (reuse meshes, don't destroy)
        └── CoinPool (reuse meshes)
```

---

## 3. Engine Initialization (`main.ts`)

```typescript
import * as BABYLON from "@babylonjs/core";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Engine banao — antialias ON for smooth edges
const engine = new BABYLON.Engine(canvas, true);

// Scene create karo
const scene = new BABYLON.Scene(engine);

// Game gravity set karo
scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
scene.collisionsEnabled = true;

// Render loop — yahi heartbeat hai game ki
engine.runRenderLoop(() => {
  scene.render();
});

// Responsive canvas
window.addEventListener("resize", () => {
  engine.resize();
});
```

---

## 4. Camera Setup — FollowCamera

```typescript
// FollowCamera — automatically runner ke peeche rehti hai
const camera = new BABYLON.FollowCamera(
  "followCam",
  new BABYLON.Vector3(0, 5, -10), // Initial position
  scene
);

camera.radius = 12;          // Runner se kitni door
camera.heightOffset = 5;     // Kitna upar se dekhe
camera.rotationOffset = 180; // Runner ke peeche
camera.cameraAcceleration = 0.05; // Smooth follow lag
camera.maxCameraSpeed = 20;

// Jab runner mesh ready ho jaye tab attach karo
camera.lockedTarget = runnerMesh;
```

---

## 5. Physics Setup — Havok (Recommended)

```typescript
import HavokPhysics from "@babylonjs/havok";

const havok = await HavokPhysics();
const physicsPlugin = new BABYLON.HavokPlugin(true, havok);
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), physicsPlugin);

// Runner par physics impostor lagao
runnerMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
  runnerMesh,
  BABYLON.PhysicsImpostor.CapsuleImpostor,
  { mass: 1, restitution: 0.1, friction: 0.5 },
  scene
);
```

---

## 6. Asset Loading Strategy

```typescript
// src/utils/assetLoader.ts

import { AssetsManager, Scene } from "@babylonjs/core";

export async function preloadAssets(scene: Scene) {
  const manager = new AssetsManager(scene);

  // 3D Models
  manager.addMeshTask("runner", "", "/assets/models/", "runner.glb");
  manager.addMeshTask("obstacle_barrier", "", "/assets/models/", "barrier.glb");
  manager.addMeshTask("coin", "", "/assets/models/", "nexacoin.glb");

  // Textures
  manager.addTextureTask("groundTex", "/assets/textures/neon_ground.jpg");

  // Audio
  manager.addBinaryFileTask("bgm", "/assets/audio/cyberpunk_bgm.mp3");

  // Loading screen dikha jab assets load ho rahe hain
  manager.onProgress = (remaining, total) => {
    const percent = Math.round(((total - remaining) / total) * 100);
    updateLoadingBar(percent); // Apni loading UI function
  };

  return new Promise<void>((resolve) => {
    manager.onFinish = () => resolve();
    manager.load();
  });
}
```

---

## 7. Infinite Track — Tile Pooling Pattern

Yeh NexaRun ka **most critical architectural decision** hai. Screen par teen tiles dikhte hain. Jab runner aage badhta hai, **peeche waala tile recycle** hokar aage place ho jaata hai. No memory leaks, no garbage collection spikes.

```typescript
// src/game/Track.ts

const TILE_LENGTH = 30;
const VISIBLE_TILES = 3;

class Track {
  private tiles: BABYLON.Mesh[] = [];
  private nextTileZ = 0;

  constructor(private scene: BABYLON.Scene) {
    for (let i = 0; i < VISIBLE_TILES; i++) {
      this.spawnTile();
    }
  }

  private spawnTile() {
    const tile = BABYLON.MeshBuilder.CreateBox(
      `tile_${this.tiles.length}`,
      { width: 9, height: 0.5, depth: TILE_LENGTH },
      this.scene
    );
    tile.position.z = this.nextTileZ;
    this.nextTileZ += TILE_LENGTH;
    this.tiles.push(tile);
  }

  update(runnerZ: number) {
    // Agar pehla tile runner se bahut peeche hai — recycle karo
    const firstTile = this.tiles[0];
    if (firstTile.position.z < runnerZ - TILE_LENGTH) {
      firstTile.position.z = this.nextTileZ;
      this.nextTileZ += TILE_LENGTH;
      // Array ke end pe le jao
      this.tiles.push(this.tiles.shift()!);
    }
  }
}
```

---

## 8. Object Pooling — Obstacles & Coins

**Never `dispose()` and recreate meshes in a game loop.** Garbage collector spike aayega, frame drop hoga. Pool banao, reuse karo.

```typescript
// src/game/ObstacleSpawner.ts

class ObjectPool<T extends BABYLON.AbstractMesh> {
  private pool: T[] = [];

  constructor(private factory: () => T, size: number) {
    for (let i = 0; i < size; i++) {
      const obj = factory();
      obj.setEnabled(false); // Hide karo
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    return this.pool.find((o) => !o.isEnabled()) || null;
  }

  release(obj: T) {
    obj.setEnabled(false); // Wapas pool mein
  }
}
```

---

## 9. Debug Mode — Babylon Inspector

Development ke time ye lifesaver hai:

```typescript
// Press 'I' to toggle inspector
scene.debugLayer.show({
  embedMode: true,
});
```

Isse scene hierarchy, mesh properties, physics bodies — sab real-time dekh sakte ho without console.log hell.

---

## 10. Performance Targets

| Metric | Target |
|---|---|
| FPS | 60fps stable |
| Initial Load | < 5 seconds (3G) |
| Asset Bundle | < 15MB total |
| Memory Usage | < 150MB RAM |

> Use `engine.performanceMonitor` in dev to watch FPS live.
