import {
  Scene, MeshBuilder, Mesh, StandardMaterial, Color3,
} from '@babylonjs/core';
import { GAME, LANES, LANE_POSITIONS } from '../utils/constants';
import { ObjectPool } from '../utils/ObjectPool';

type Pattern = 'LINE' | 'ARC' | 'ZIGZAG';
const PATTERNS: Pattern[] = ['LINE', 'ARC', 'ZIGZAG'];

export class CoinSpawner {
  private pool: ObjectPool<Mesh>;
  private active: Mesh[] = [];
  private timer = 0;

  constructor(scene: Scene) {
    const mat = new StandardMaterial('coinMat', scene);
    mat.diffuseColor = new Color3(1, 0.85, 0);
    mat.emissiveColor = new Color3(0.6, 0.45, 0);

    this.pool = new ObjectPool<Mesh>(() => {
      const coin = MeshBuilder.CreateTorus('coin', {
        diameter: 0.55,
        thickness: 0.14,
        tessellation: 16,
      }, scene);
      coin.material = mat;
      return coin;
    }, GAME.COIN_POOL_SIZE);
  }

  canSpawnThisFrame(dt: number): boolean {
    return (this.timer + dt) >= GAME.COIN_SPAWN_INTERVAL;
  }

  resetTimer(): void {
    this.timer = 0;
  }

  update(dt: number, runnerZ: number): void {
    this.timer += dt;
    if (this.timer >= GAME.COIN_SPAWN_INTERVAL) {
      this.spawnPattern(runnerZ + GAME.SPAWN_DISTANCE);
      this.timer = 0;
    }
    // Spin active coins
    for (const c of this.active) c.rotation.y += dt * 4;
    this.recycle(runnerZ);
  }

  private spawnPattern(startZ: number): void {
    const pat = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const laneX = LANE_POSITIONS[Math.floor(Math.random() * 3)];

    switch (pat) {
      case 'LINE':
        for (let i = 0; i < 7; i++) this.place(laneX, 1, startZ + i * 1.5);
        break;
      case 'ARC':
        for (let i = 0; i < 6; i++) {
          const h = Math.sin((i / 5) * Math.PI) * 3;
          this.place(laneX, 1 + h, startZ + i * 1.5);
        }
        break;
      case 'ZIGZAG': {
        const xs = [LANES.LEFT, LANES.CENTER, LANES.RIGHT, LANES.CENTER];
        for (let i = 0; i < 8; i++) this.place(xs[i % 4], 1, startZ + i * 2);
        break;
      }
    }
  }

  private place(x: number, y: number, z: number): void {
    const c = this.pool.acquire();
    if (!c) return;
    c.position.set(x, y, z);
    c.setEnabled(true);
    this.active.push(c);
  }

  collect(coin: Mesh): void {
    const i = this.active.indexOf(coin);
    if (i !== -1) {
      this.pool.release(coin);
      this.active.splice(i, 1);
    }
  }

  getActive(): Mesh[] { return this.active; }

  private recycle(runnerZ: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.active[i].position.z < runnerZ - GAME.DESPAWN_DISTANCE) {
        this.pool.release(this.active[i]);
        this.active.splice(i, 1);
      }
    }
  }

  reset(): void {
    for (const c of this.active) this.pool.release(c);
    this.active = [];
    this.timer = 0;
  }
}
