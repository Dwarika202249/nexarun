# 🕹️ NEXARUN — Game Mechanics Specification

## 1. Core Game Loop

```
START
  │
  ▼
[MainMenu] ──► [Loading Screen] ──► [Game Active]
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                         [Track]    [Runner]   [Spawners]
                         update()   update()   update()
                              │          │          │
                              └──────────┼──────────┘
                                         │
                                    [Collision?]
                                    YES ──► [Lives--]
                                    NO  ──► continue
                                         │
                                    [Lives == 0?]
                                    YES ──► [GameOver]
                                    NO  ──► continue loop
```

---

## 2. Lane System

NexaRun mein **3 lanes** hain — Left, Center, Right.

```typescript
// src/utils/constants.ts

export const LANES = {
  LEFT: -3,
  CENTER: 0,
  RIGHT: 3,
} as const;

export type Lane = keyof typeof LANES; // "LEFT" | "CENTER" | "RIGHT"
```

Lane switch smooth hoga — not teleport. Lerp use karenge:

```typescript
// src/game/Runner.ts

const TARGET_X = LANES[this.currentLane]; // -3, 0, or 3
runnerMesh.position.x = BABYLON.Scalar.Lerp(
  runnerMesh.position.x,
  TARGET_X,
  0.2 // Smoothing factor — tweak for feel
);
```

---

## 3. Runner States

Runner ek time par sirf ek state mein ho sakta hai:

```typescript
enum RunnerState {
  RUNNING,  // Default
  JUMPING,  // Space / Swipe Up
  ROLLING,  // Shift / Swipe Down
  HIT,      // Collision — brief stagger
  DEAD,     // Lives = 0
}
```

### State Transitions

```
RUNNING ──[Jump Input]──► JUMPING ──[Land]──► RUNNING
RUNNING ──[Roll Input]──► ROLLING ──[Timer]──► RUNNING
RUNNING ──[Collision]──► HIT ──[Invincible Timer]──► RUNNING
HIT + 0 lives ──────────► DEAD
```

---

## 4. Input Handling

### Keyboard (Desktop)

```typescript
// src/game/InputHandler.ts

export class InputHandler {
  constructor(private runner: Runner, private scene: BABYLON.Scene) {
    scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type !== BABYLON.KeyboardEventTypes.KEYDOWN) return;

      switch (kbInfo.event.key) {
        case "ArrowLeft":
        case "a":
          runner.switchLane("LEFT");
          break;
        case "ArrowRight":
        case "d":
          runner.switchLane("RIGHT");
          break;
        case "ArrowUp":
        case " ":
          runner.jump();
          break;
        case "ArrowDown":
        case "s":
          runner.roll();
          break;
      }
    });
  }
}
```

### Touch / Swipe (Mobile)

```typescript
// Swipe detection
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30; // px

canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > SWIPE_THRESHOLD) runner.switchLane("RIGHT");
    else if (dx < -SWIPE_THRESHOLD) runner.switchLane("LEFT");
  } else {
    // Vertical swipe
    if (dy < -SWIPE_THRESHOLD) runner.jump();
    else if (dy > SWIPE_THRESHOLD) runner.roll();
  }
});
```

---

## 5. Jump Mechanics

```typescript
// src/game/Runner.ts

private readonly JUMP_FORCE = 12;
private readonly GROUND_Y = 0.5;
private isGrounded = true;

jump() {
  if (!this.isGrounded) return; // Double jump nahi — ek hi jump
  if (this.state === RunnerState.ROLLING) return;

  this.state = RunnerState.JUMPING;
  this.isGrounded = false;
  this.playAnimation("jump");

  // Physics impulse apply karo
  this.mesh.physicsImpostor?.applyImpulse(
    new BABYLON.Vector3(0, this.JUMP_FORCE, 0),
    this.mesh.getAbsolutePosition()
  );
}

// Ground check — har frame mein
private checkGrounded() {
  if (this.mesh.position.y <= this.GROUND_Y + 0.1) {
    this.mesh.position.y = this.GROUND_Y;
    this.isGrounded = true;
    if (this.state === RunnerState.JUMPING) {
      this.state = RunnerState.RUNNING;
      this.playAnimation("run");
    }
  }
}
```

---

## 6. Obstacle System

### Obstacle Types

| Type | How to Avoid | Shape |
|---|---|---|
| **Energy Barrier** | Jump over ya lane change | Horizontal beam across 1 lane |
| **Rogue Drone** | Roll under | Low-flying object |
| **Wall Block** | Lane change only | Full-height block |
| **Double Barrier** | Jump + lane change | 2 lanes blocked |
| **Coin Magnet Gate** | Pass through | Optional (gives bonus) |

### Procedural Spawning

```typescript
// src/game/ObstacleSpawner.ts

const SPAWN_DISTANCE_AHEAD = 60; // Runner se kitna aage spawn ho

class ObstacleSpawner {
  private timeSinceLastSpawn = 0;
  private spawnInterval = 2.5; // seconds — game speed ke saath kam hota jayega

  update(deltaTime: number, runnerZ: number, speed: number) {
    this.timeSinceLastSpawn += deltaTime;

    // Difficulty scaling — speed badhne ke saath interval ghata do
    this.spawnInterval = Math.max(1.2, 2.5 - speed * 0.01);

    if (this.timeSinceLastSpawn >= this.spawnInterval) {
      this.spawnObstacle(runnerZ + SPAWN_DISTANCE_AHEAD);
      this.timeSinceLastSpawn = 0;
    }
  }

  private spawnObstacle(z: number) {
    const type = this.pickRandomObstacleType();
    const lane = this.pickRandomLane();
    const mesh = this.pool.acquire();

    if (!mesh) return; // Pool empty — skip

    mesh.position.set(LANES[lane], 0, z);
    mesh.setEnabled(true);
    this.applyObstacleConfig(mesh, type);
  }
}
```

---

## 7. Coin System

### Coin Patterns (Procedural)

```typescript
// Coins ko patterns mein spawn karo — line, arc, zigzag
type CoinPattern = "LINE" | "ARC" | "ZIGZAG" | "LANE_SWITCH";

function spawnCoinPattern(pattern: CoinPattern, startZ: number, lane: Lane) {
  switch (pattern) {
    case "LINE":
      // 8 coins straight line mein
      for (let i = 0; i < 8; i++) {
        spawnCoin(LANES[lane], 0.5, startZ + i * 1.5);
      }
      break;

    case "ARC":
      // Parabolic arc — jump karte time collect ho
      for (let i = 0; i < 6; i++) {
        const height = Math.sin((i / 5) * Math.PI) * 3;
        spawnCoin(LANES[lane], height + 0.5, startZ + i * 1.5);
      }
      break;

    case "ZIGZAG":
      // Alternate lanes mein coins
      const zigLanes: Lane[] = ["LEFT", "CENTER", "RIGHT", "CENTER"];
      for (let i = 0; i < 8; i++) {
        spawnCoin(LANES[zigLanes[i % 4]], 0.5, startZ + i * 2);
      }
      break;
  }
}
```

---

## 8. Score & Difficulty System

```typescript
// src/game/ScoreManager.ts

class ScoreManager {
  score = 0;
  distance = 0;
  speed = 8; // m/s — starting speed
  multiplier = 1;

  readonly MAX_SPEED = 25;
  readonly SPEED_INCREMENT = 0.5; // Har 500m par speed badhti hai

  update(deltaTime: number) {
    // Distance track karo
    this.distance += this.speed * deltaTime;

    // Score = distance + (coins * multiplier)
    this.score = Math.floor(this.distance) * this.multiplier;

    // Speed scaling — gradual difficulty ramp
    const targetSpeed = 8 + Math.floor(this.distance / 500) * this.SPEED_INCREMENT;
    this.speed = Math.min(targetSpeed, this.MAX_SPEED);
  }

  addCoin(value = 1) {
    this.score += value * 10 * this.multiplier;
  }

  setMultiplier(x: number) {
    this.multiplier = x; // Power-up se activate hoga
  }
}
```

---

## 9. Lives & Hit System

```typescript
// 3 lives system — shield power-up se temporary invincibility

class Runner {
  lives = 3;
  isInvincible = false;
  private invincibleTimer = 0;
  private readonly INVINCIBLE_DURATION = 2; // seconds

  onHit() {
    if (this.isInvincible) return;

    this.lives--;
    this.isInvincible = true;
    this.invincibleTimer = this.INVINCIBLE_DURATION;
    this.playHitEffect(); // Blink animation

    if (this.lives <= 0) {
      this.state = RunnerState.DEAD;
      GameManager.triggerGameOver();
    }
  }

  updateInvincibility(deltaTime: number) {
    if (!this.isInvincible) return;
    this.invincibleTimer -= deltaTime;
    if (this.invincibleTimer <= 0) {
      this.isInvincible = false;
    }
  }
}
```

---

## 10. Power-Ups

| Power-Up | Effect | Duration |
|---|---|---|
| 🧲 **NexaMagnet** | Coins automatically attract to runner | 10s |
| ⚡ **SpeedBoost** | 2x speed + invincibility | 5s |
| 🛡️ **CyberShield** | Block one hit | Until hit |
| ✖️ **ScoreX2** | Score multiplier 2x | 15s |
| 🚀 **HoverJet** | Runner flies above track | 8s |

---

## 11. Game Over & Persistence

```typescript
// src/game/GameManager.ts

async function triggerGameOver() {
  const currentScore = scoreManager.score;
  const highScore = await storage.getHighScore();

  if (currentScore > highScore) {
    await storage.setHighScore(currentScore);
    await storage.addNexaCoins(Math.floor(currentScore / 100));
  }

  showGameOverScreen({
    score: currentScore,
    highScore: Math.max(currentScore, highScore),
    distance: Math.floor(scoreManager.distance),
    isNewRecord: currentScore > highScore,
  });
}
```
