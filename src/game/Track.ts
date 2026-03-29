import {
  Scene, MeshBuilder, Mesh, StandardMaterial, Color3, GlowLayer,
} from '@babylonjs/core';
import { GAME } from '../utils/constants';

export class Track {
  private tiles: Mesh[] = [];
  private laneLines: Mesh[][] = [];
  private nextTileZ = 0;
  private tileMat: StandardMaterial;
  private lineMat: StandardMaterial;
  glow: GlowLayer;

  constructor(private scene: Scene) {
    // Glow layer for neon bloom
    this.glow = new GlowLayer('glow', scene);
    this.glow.intensity = 0.6;

    // Dark cyberpunk ground
    this.tileMat = new StandardMaterial('trackMat', scene);
    this.tileMat.diffuseColor = new Color3(0.04, 0.04, 0.08);
    this.tileMat.specularColor = new Color3(0.1, 0.1, 0.2);

    // Neon lane line material
    this.lineMat = new StandardMaterial('lineMat', scene);
    this.lineMat.diffuseColor = new Color3(0, 0.3, 0.35);
    this.lineMat.emissiveColor = new Color3(0, 0.6, 0.7);

    for (let i = 0; i < GAME.VISIBLE_TILES; i++) {
      this.spawnTile();
    }
  }

  private spawnTile(): void {
    const idx = this.tiles.length;
    const tile = MeshBuilder.CreateBox(`tile_${idx}`, {
      width: GAME.TILE_WIDTH,
      height: 0.5,
      depth: GAME.TILE_LENGTH,
    }, this.scene);
    tile.position.y = -0.25;
    tile.position.z = this.nextTileZ + GAME.TILE_LENGTH / 2;
    tile.material = this.tileMat;
    tile.receiveShadows = true;

    // Lane line positions: edges at ±4.5, dividers at ±1.5
    const lines: Mesh[] = [];
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      const line = MeshBuilder.CreateBox(`line_${idx}_${x}`, {
        width: 0.06, height: 0.02, depth: GAME.TILE_LENGTH - 0.2,
      }, this.scene);
      line.position.set(x, 0.01, 0);
      line.material = this.lineMat;
      line.parent = tile;
      lines.push(line);
    }

    // Center dashed line
    for (let d = 0; d < GAME.TILE_LENGTH; d += 3) {
      const dash = MeshBuilder.CreateBox(`dash_${idx}_${d}`, {
        width: 0.08, height: 0.02, depth: 1.5,
      }, this.scene);
      dash.position.set(0, 0.01, -GAME.TILE_LENGTH / 2 + d + 0.75);
      dash.material = this.lineMat;
      dash.parent = tile;
    }

    this.laneLines.push(lines);
    this.nextTileZ += GAME.TILE_LENGTH;
    this.tiles.push(tile);
  }

  update(runnerZ: number): void {
    const first = this.tiles[0];
    if (first.position.z < runnerZ - GAME.TILE_LENGTH * 1.5) {
      first.position.z = this.nextTileZ + GAME.TILE_LENGTH / 2;
      this.nextTileZ += GAME.TILE_LENGTH;
      this.tiles.push(this.tiles.shift()!);
      this.laneLines.push(this.laneLines.shift()!);
    }
  }

  reset(): void {
    this.nextTileZ = 0;
    for (const tile of this.tiles) {
      tile.position.z = this.nextTileZ + GAME.TILE_LENGTH / 2;
      this.nextTileZ += GAME.TILE_LENGTH;
    }
  }
}
