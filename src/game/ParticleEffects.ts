import {
  Scene, Vector3, Color4, ParticleSystem, DynamicTexture, Texture,
  AbstractMesh,
} from '@babylonjs/core';

/** Creates a soft-circle DynamicTexture usable by all particle systems. */
function makeParticleTex(scene: Scene): Texture {
  const dt = new DynamicTexture('ptex', 32, scene, false);
  const ctx = dt.getContext();
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  dt.update();
  return dt as unknown as Texture;
}

export class ParticleEffects {
  private tex: Texture;
  private speedLines!: ParticleSystem;
  private flashEl: HTMLElement;

  constructor(private scene: Scene, private runner: AbstractMesh) {
    this.tex = makeParticleTex(scene);
    this.createSpeedLines();

    // Screen flash overlay (CSS)
    this.flashEl = document.createElement('div');
    this.flashEl.id = 'screen-flash';
    this.flashEl.style.cssText = `
      position:fixed; inset:0; z-index:20; pointer-events:none;
      opacity:0; transition: opacity 0.08s;
    `;
    document.body.appendChild(this.flashEl);
  }

  // ─── Speed Lines ───

  private createSpeedLines(): void {
    const ps = new ParticleSystem('speedLines', 60, this.scene);
    ps.particleTexture = this.tex;
    ps.emitter = this.runner;
    ps.minEmitBox = new Vector3(-5, 0.5, 4);
    ps.maxEmitBox = new Vector3(5, 4, 8);
    ps.direction1 = new Vector3(-0.2, 0, -6);
    ps.direction2 = new Vector3(0.2, 0, -8);
    ps.minSize = 0.02;
    ps.maxSize = 0.06;
    ps.minScaleX = 1;
    ps.maxScaleX = 1;
    ps.minScaleY = 8;
    ps.maxScaleY = 20;
    ps.minLifeTime = 0.15;
    ps.maxLifeTime = 0.3;
    ps.emitRate = 0;
    ps.color1 = new Color4(0.3, 0.8, 1, 0.4);
    ps.color2 = new Color4(0.5, 0.9, 1, 0.2);
    ps.colorDead = new Color4(0, 0, 0, 0);
    ps.gravity = Vector3.Zero();
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.start();
    this.speedLines = ps;
  }

  /** Adjust speed line intensity based on current speed. */
  setSpeed(speed: number): void {
    // Start showing lines at speed 12, full at 20+
    const t = Math.max(0, (speed - 12) / 10);
    this.speedLines.emitRate = t * 50;
  }

  // ─── Coin Collect Burst ───

  burstCoin(position: Vector3): void {
    const ps = new ParticleSystem('coinBurst', 30, this.scene);
    ps.particleTexture = this.tex;
    ps.emitter = position.clone();
    ps.minEmitBox = Vector3.Zero();
    ps.maxEmitBox = Vector3.Zero();
    ps.direction1 = new Vector3(-1, 1, -1);
    ps.direction2 = new Vector3(1, 2, 1);
    ps.minSize = 0.08;
    ps.maxSize = 0.18;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.5;
    ps.color1 = new Color4(1, 0.85, 0, 1);
    ps.color2 = new Color4(1, 0.6, 0, 0.8);
    ps.colorDead = new Color4(1, 0.4, 0, 0);
    ps.gravity = new Vector3(0, -3, 0);
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.emitRate = 0;
    ps.manualEmitCount = 20;
    ps.targetStopDuration = 0.6;
    ps.onStoppedObservable.add(() => ps.dispose(false));
    ps.start();
  }

  // ─── Hit Flash ───

  flashHit(): void {
    this.flashEl.style.background = 'radial-gradient(circle, rgba(255,0,60,0.35) 0%, rgba(255,0,0,0) 70%)';
    this.flashEl.style.opacity = '1';
    setTimeout(() => { this.flashEl.style.opacity = '0'; }, 120);
  }

  // ─── Game Over Flash ───

  flashGameOver(): void {
    this.flashEl.style.background = 'rgba(255,0,40,0.5)';
    this.flashEl.style.opacity = '1';
    setTimeout(() => { this.flashEl.style.opacity = '0'; }, 400);
  }
}
