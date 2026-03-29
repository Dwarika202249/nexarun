import { Scene, MeshBuilder, Mesh, Vector3, StandardMaterial, Color3 } from '@babylonjs/core';
import { GAME, LANE_POSITIONS } from '../utils/constants';

export type PowerupType = 'MAGNET' | 'SHIELD' | 'SCORE2X';

export interface Powerup {
  mesh: Mesh;
  type: PowerupType;
  active: boolean;
}

export class PowerupSpawner {
  private activePowerups: Powerup[] = [];
  private mats: Record<string, StandardMaterial> = {};

  constructor(private scene: Scene) {
    // Magnet (Blue glow)
    this.mats.MAGNET = new StandardMaterial('magMat', scene);
    this.mats.MAGNET.emissiveColor = new Color3(0, 0.5, 1);
    this.mats.MAGNET.diffuseColor = new Color3(0, 0.5, 1);
    
    // Shield (Green glow)
    this.mats.SHIELD = new StandardMaterial('shieldMat', scene);
    this.mats.SHIELD.emissiveColor = new Color3(0, 1, 0.2);
    this.mats.SHIELD.diffuseColor = new Color3(0, 1, 0.2);

    // Score2X (Magenta glow)
    this.mats.SCORE2X = new StandardMaterial('x2Mat', scene);
    this.mats.SCORE2X.emissiveColor = new Color3(1, 0, 1);
    this.mats.SCORE2X.diffuseColor = new Color3(1, 0, 1);
  }

  update(dt: number, currentZ: number, shouldTrySpawn: boolean): boolean {
    // Move slightly
    for (const p of this.activePowerups) {
      if (p.active) {
        p.mesh.rotation.y += dt * 3;
        p.mesh.rotation.x += dt * 2;
      }
    }

    // Cleanup passed powerups
    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const p = this.activePowerups[i];
      if (currentZ - p.mesh.position.z > 20) {
        p.mesh.dispose();
        this.activePowerups.splice(i, 1);
      }
    }

    if (shouldTrySpawn && Math.random() < GAME.POWERUP_SPAWN_CHANCE) {
      this.spawn(currentZ + GAME.SPAWN_DISTANCE);
      return true;
    }
    return false;
  }

  private spawn(zPos: number): void {
    const laneIndex = Math.floor(Math.random() * 3);
    const xPos = LANE_POSITIONS[laneIndex];
    
    // Pick random type
    const r = Math.random();
    let type: PowerupType = 'MAGNET';
    if (r > 0.66) type = 'SHIELD';
    else if (r > 0.33) type = 'SCORE2X';

    // Different shapes for powerups based on type
    let mesh: Mesh;
    if (type === 'MAGNET') {
      mesh = MeshBuilder.CreateTorus('pu_mag', { diameter: 1.5, thickness: 0.4 }, this.scene);
    } else if (type === 'SHIELD') {
      mesh = MeshBuilder.CreateSphere('pu_shield', { diameter: 1.5 }, this.scene);
    } else {
      // Hexagonal prism for 2X multiplier (safe from Polyhedra payload requirements)
      mesh = MeshBuilder.CreateCylinder('pu_x2', { height: 1.2, diameter: 1.2, tessellation: 6 }, this.scene);
      mesh.rotation.x = Math.PI / 2; // Flat face forward
    }

    mesh.position.set(xPos, GAME.GROUND_Y + 1.5, zPos);
    mesh.material = this.mats[type];
    
    // Add pulsing action
    const pulse = () => {
      if (!mesh.isDisposed()) {
        mesh.scaling = Vector3.One().scale(1 + Math.sin(performance.now() * 0.005) * 0.2);
        requestAnimationFrame(pulse);
      }
    };
    pulse();

    this.activePowerups.push({ mesh, type, active: true });
  }

  collect(p: Powerup): void {
    p.active = false;
    p.mesh.dispose();
  }

  getActive(): Powerup[] {
    return this.activePowerups.filter(p => p.active);
  }

  reset(): void {
    for (const p of this.activePowerups) {
      p.mesh.dispose();
    }
    this.activePowerups = [];
  }
}
