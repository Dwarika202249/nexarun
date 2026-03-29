import {
  Scene, MeshBuilder, Mesh, StandardMaterial, Color3, Color4,
  Vector3, PointLight, ParticleSystem, DynamicTexture, Texture,
} from '@babylonjs/core';

const COLUMNS_PER_SIDE = 10;
const COLUMN_SPACING = 18;
const TRACK_HALF_W = 4.5;
const BUILDING_X_MIN = 7;
const BUILDING_X_MAX = 22;

interface BuildingColumn {
  meshes: Mesh[];
  z: number;
  light?: PointLight;
}

export class Environment {
  private leftCols: BuildingColumn[] = [];
  private rightCols: BuildingColumn[] = [];
  private nextColZ = -20;
  private mats: StandardMaterial[] = [];
  private starSystem!: ParticleSystem;

  constructor(private scene: Scene) {
    // Fog — cyberpunk haze
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.009;
    scene.fogColor = new Color3(0.02, 0.02, 0.06);
    scene.clearColor = new Color4(0.01, 0.01, 0.04, 1);

    // Building materials (different neon accents)
    const neonColors = [
      [0, 0.6, 0.8],   // cyan
      [0.8, 0, 0.5],   // magenta
      [0.6, 0.3, 0],   // orange
      [0.1, 0.5, 0.1], // green
      [0, 0.15, 0.25],  // dark — most common
      [0, 0.1, 0.2],
    ];
    for (let i = 0; i < neonColors.length; i++) {
      const m = new StandardMaterial(`bldg_${i}`, scene);
      m.diffuseColor = new Color3(0.02, 0.02, 0.04);
      m.emissiveColor = new Color3(...(neonColors[i] as [number, number, number]));
      this.mats.push(m);
    }

    // Spawn initial building columns
    for (let i = 0; i < COLUMNS_PER_SIDE; i++) {
      this.leftCols.push(this.createColumn(-1));
      this.rightCols.push(this.createColumn(1));
      this.nextColZ += COLUMN_SPACING;
    }

    this.createStars();
    this.createGroundGlow();
  }

  private createColumn(side: -1 | 1): BuildingColumn {
    const col: BuildingColumn = { meshes: [], z: this.nextColZ };
    const numBoxes = 2 + Math.floor(Math.random() * 3);

    for (let b = 0; b < numBoxes; b++) {
      const w = 2 + Math.random() * 6;
      const h = 5 + Math.random() * 30;
      const d = 3 + Math.random() * 8;
      const mesh = MeshBuilder.CreateBox(`bldg`, { width: w, height: h, depth: d }, this.scene);
      const xOffset = BUILDING_X_MIN + Math.random() * (BUILDING_X_MAX - BUILDING_X_MIN);
      mesh.position.set(side * xOffset, h / 2, this.nextColZ + (Math.random() - 0.5) * 10);
      mesh.material = this.mats[Math.floor(Math.random() * this.mats.length)];
      col.meshes.push(mesh);
    }

    // Occasional neon point light on buildings
    if (Math.random() < 0.3) {
      const light = new PointLight(`bldgLight`, new Vector3(
        side * (BUILDING_X_MIN + 2), 4 + Math.random() * 8, this.nextColZ
      ), this.scene);
      const colors = [new Color3(0, 0.8, 1), new Color3(1, 0, 0.6), new Color3(0.5, 0, 1)];
      light.diffuse = colors[Math.floor(Math.random() * colors.length)];
      light.intensity = 0.3;
      light.range = 15;
      col.light = light;
    }

    return col;
  }

  private recycleColumn(col: BuildingColumn, side: -1 | 1): void {
    const numBoxes = col.meshes.length;
    for (let b = 0; b < numBoxes; b++) {
      const h = 5 + Math.random() * 30;
      const xOff = BUILDING_X_MIN + Math.random() * (BUILDING_X_MAX - BUILDING_X_MIN);
      col.meshes[b].position.set(side * xOff, h / 2, this.nextColZ + (Math.random() - 0.5) * 10);
      col.meshes[b].scaling.y = (5 + Math.random() * 30) / col.meshes[b].getBoundingInfo().boundingBox.extendSize.y / 2;
      col.meshes[b].material = this.mats[Math.floor(Math.random() * this.mats.length)];
    }
    if (col.light) {
      col.light.position.z = this.nextColZ;
    }
    col.z = this.nextColZ;
  }

  private createStars(): void {
    const tex = new DynamicTexture('starTex', 32, this.scene, false);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(200,220,255,0.5)');
    grad.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    tex.update();

    this.starSystem = new ParticleSystem('stars', 200, this.scene);
    this.starSystem.particleTexture = tex as unknown as Texture;
    this.starSystem.emitter = Vector3.Zero();
    this.starSystem.minEmitBox = new Vector3(-80, 25, -30);
    this.starSystem.maxEmitBox = new Vector3(80, 50, 200);
    this.starSystem.minSize = 0.05;
    this.starSystem.maxSize = 0.2;
    this.starSystem.minLifeTime = 5;
    this.starSystem.maxLifeTime = 10;
    this.starSystem.emitRate = 30;
    this.starSystem.color1 = new Color4(0.8, 0.9, 1, 0.6);
    this.starSystem.color2 = new Color4(0.5, 0.7, 1, 0.3);
    this.starSystem.gravity = Vector3.Zero();
    this.starSystem.direction1 = Vector3.Zero();
    this.starSystem.direction2 = Vector3.Zero();
    this.starSystem.start();
  }

  private createGroundGlow(): void {
    // Subtle ground reflection strips alongside the track
    const stripMat = new StandardMaterial('stripMat', this.scene);
    stripMat.diffuseColor = Color3.Black();
    stripMat.emissiveColor = new Color3(0, 0.15, 0.2);
    stripMat.alpha = 0.4;

    for (const sx of [-TRACK_HALF_W - 0.5, TRACK_HALF_W + 0.5]) {
      const strip = MeshBuilder.CreateBox('gstrip', { width: 0.3, height: 0.01, depth: 500 }, this.scene);
      strip.position.set(sx, 0.01, 100);
      strip.material = stripMat;
    }
  }

  update(runnerZ: number): void {
    // Recycle left columns
    if (this.leftCols[0].z < runnerZ - COLUMN_SPACING * 2) {
      const col = this.leftCols.shift()!;
      this.nextColZ += COLUMN_SPACING;
      this.recycleColumn(col, -1);
      this.leftCols.push(col);
    }
    // Recycle right columns
    if (this.rightCols[0].z < runnerZ - COLUMN_SPACING * 2) {
      const col = this.rightCols.shift()!;
      this.recycleColumn(col, 1);
      this.rightCols.push(col);
    }
    // Move star emitter with runner
    (this.starSystem.emitter as Vector3).z = runnerZ + 80;
  }
}
