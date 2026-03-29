import {
  Scene, MeshBuilder, Mesh, StandardMaterial, Color3,
} from '@babylonjs/core';
import { GAME, LANE_POSITIONS } from '../utils/constants';
import { ObjectPool } from '../utils/ObjectPool';

// 0 = barrier (jump), 1 = overhead (roll), 2 = wall (lane change)
type ObstacleType = 0 | 1 | 2;

const TYPE_CONFIGS: Record<ObstacleType, {
  sy: number; py: number; color: [number, number, number]; emissive: [number, number, number];
}> = {
  0: { sy: 1.0, py: 0.5, color: [1, 0.1, 0.2], emissive: [0.5, 0, 0.1] },
  1: { sy: 0.7, py: 2.4, color: [1, 0.5, 0], emissive: [0.5, 0.25, 0] },
  2: { sy: 2.5, py: 1.25, color: [0.7, 0, 1], emissive: [0.35, 0, 0.5] },
};

export class ObstacleSpawner {
  private pool: ObjectPool<Mesh>;
  private active: Mesh[] = [];
  private timer = 0;
  private mats: Map<ObstacleType, StandardMaterial> = new Map();

  constructor(private scene: Scene) {
    // Pre-create materials per type
    for (const key of [0, 1, 2] as ObstacleType[]) {
      const c = TYPE_CONFIGS[key];
      const m = new StandardMaterial(`obsMat${key}`, scene);
      m.diffuseColor = new Color3(...c.color);
      m.emissiveColor = new Color3(...c.emissive);
      this.mats.set(key, m);
    }

    this.pool = new ObjectPool<Mesh>(
      () => this.createMesh(),
      GAME.OBSTACLE_POOL_SIZE,
    );
  }

  private createMesh(): Mesh {
    return MeshBuilder.CreateBox('obs', { size: 1 }, this.scene);
  }

  update(dt: number, runnerZ: number, speed: number): void {
    this.timer += dt;
    const interval = Math.max(
      GAME.OBSTACLE_MIN_INTERVAL,
      GAME.OBSTACLE_INITIAL_INTERVAL - speed * 0.06,
    );

    if (this.timer >= interval) {
      this.spawn(runnerZ + GAME.SPAWN_DISTANCE);
      this.timer = 0;
    }
    this.recycle(runnerZ);
  }

  private spawn(z: number): void {
    const mesh = this.pool.acquire();
    if (!mesh) return;

    const type = ([0, 1, 2] as ObstacleType[])[Math.floor(Math.random() * 3)];
    const cfg = TYPE_CONFIGS[type];
    const laneX = LANE_POSITIONS[Math.floor(Math.random() * 3)];

    mesh.scaling.set(2.5, cfg.sy, 0.8);
    mesh.position.set(laneX, cfg.py, z);
    mesh.material = this.mats.get(type)!;
    mesh.setEnabled(true);
    this.active.push(mesh);
  }

  private recycle(runnerZ: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.active[i].position.z < runnerZ - GAME.DESPAWN_DISTANCE) {
        this.pool.release(this.active[i]);
        this.active.splice(i, 1);
      }
    }
  }

  getActive(): Mesh[] { return this.active; }

  reset(): void {
    for (const o of this.active) this.pool.release(o);
    this.active = [];
    this.timer = 0;
  }
}
