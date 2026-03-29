import {
  Engine, Scene, FollowCamera, Camera, HemisphericLight, PointLight,
  Vector3, Color3, Color4,
} from '@babylonjs/core';
import { Track } from './Track';
import { Runner } from './Runner';
import { InputHandler } from './InputHandler';
import { ObstacleSpawner } from './ObstacleSpawner';
import { CoinSpawner } from './CoinSpawner';
import { PowerupSpawner } from './PowerupSpawner';
import { ScoreManager } from './ScoreManager';
import { Environment } from './Environment';
import { AudioManager } from './AudioManager';
import { ParticleEffects } from './ParticleEffects';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { GameOverScreen } from '../ui/GameOver';
import { ShopScreen, SKINS } from '../ui/ShopScreen';
import { PauseScreen } from '../ui/PauseScreen';
import { storage } from '../db/storage';

enum GameState {
  LOADING,
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
}

export class GameManager {
  private state = GameState.LOADING;
  private track!: Track;
  private runner!: Runner;
  private input!: InputHandler;
  private obstacles!: ObstacleSpawner;
  private coins!: CoinSpawner;
  private powerups!: PowerupSpawner;
  private score!: ScoreManager;
  private env!: Environment;
  private audio!: AudioManager;
  private fx!: ParticleEffects;
  private hud!: HUD;
  private menu!: MainMenu;
  private gameOver!: GameOverScreen;
  private shop!: ShopScreen;
  private pauseScreen!: PauseScreen;
  private mainCam!: FollowCamera;

  constructor(
    private engine: Engine,
    private scene: Scene,
    private canvas: HTMLCanvasElement,
  ) {
    this.canvas.tabIndex = 1;
  }

  init(): void {
    // Sky / scene color
    this.scene.clearColor = new Color4(0.01, 0.01, 0.04, 1);

    // Camera
    this.mainCam = new FollowCamera('cam', new Vector3(0, 8, -15), this.scene);
    this.mainCam.rotationOffset = 180;
    this.mainCam.cameraAcceleration = 0.1;
    this.mainCam.maxCameraSpeed = 45;
    
    // Fix mobile FOV (keeps horizontal field wide enough for 3 lanes and buildings)
    this.mainCam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.mainCam.fov = 1.2;

    this.applyDynamicCamera();
    window.addEventListener('resize', () => this.applyDynamicCamera());

    // Lights
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.35;
    ambient.diffuse = new Color3(0.4, 0.4, 0.6);

    const neonL = new PointLight('neonL', new Vector3(-5, 8, 10), this.scene);
    neonL.diffuse = new Color3(0, 0.8, 1);
    neonL.intensity = 0.5;

    const neonR = new PointLight('neonR', new Vector3(5, 8, 20), this.scene);
    neonR.diffuse = new Color3(1, 0, 0.6);
    neonR.intensity = 0.35;

    // Game systems
    this.track = new Track(this.scene);
    this.runner = new Runner(this.scene);
    this.input = new InputHandler(this.runner, this.canvas);
    this.input.onPause = () => this.pauseGame();
    this.obstacles = new ObstacleSpawner(this.scene);
    this.coins = new CoinSpawner(this.scene);
    this.powerups = new PowerupSpawner(this.scene);
    this.score = new ScoreManager();

    // Environment (buildings, fog, stars)
    this.env = new Environment(this.scene);

    // Audio (Web Audio API synth)
    this.audio = new AudioManager();

    // Particle effects
    this.fx = new ParticleEffects(this.scene, this.runner.mesh);

    // Wire runner callbacks → audio + effects
    this.runner.onJump = () => this.audio.playJump();
    this.runner.onRoll = () => this.audio.playRoll();
    this.runner.onHitEvent = () => {
      this.audio.playHit();
      this.fx.flashHit();
    };
    this.runner.onDeath = () => {
      this.audio.playGameOver();
      this.fx.flashGameOver();
    };

    // UI
    this.hud = new HUD(() => this.pauseGame());
    this.shop = new ShopScreen(() => {
      this.shop.hide();
      this.menu.show();
      this.updateRunnerSkin();
    });
    this.pauseScreen = new PauseScreen(
      () => this.resumeGame(),
      () => {
        this.pauseScreen.hide();
        this.showMenu();
      }
    );
    this.menu = new MainMenu(
      () => this.startGame(),
      () => {
        this.menu.hide();
        this.shop.show();
      }
    );
    this.gameOver = new GameOverScreen(
      () => this.startGame(),
      () => this.showMenu(),
    );

    // Initial skin configuration
    this.updateRunnerSkin();

    // Camera target
    this.mainCam.lockedTarget = this.runner.mesh;

    // Follow lights with runner
    this.scene.registerBeforeRender(() => {
      const rz = this.runner.mesh.position.z;
      neonL.position.z = rz + 10;
      neonR.position.z = rz + 20;
    });

    // Game loop
    this.scene.registerAfterRender(() => this.update());

    // Show menu after brief loading
    setTimeout(() => this.showMenu(), 600);
  }

  private async updateRunnerSkin(): Promise<void> {
    const skinId = await storage.getEquippedSkin();
    const skinData = SKINS.find(s => s.id === skinId) || SKINS[0];
    this.runner.applySkin(skinData.diffuseHex, skinData.emissiveHex);
  }

  private applyDynamicCamera(): void {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const aspect = width / height;

    // Default Desktop (Landscape)
    let radius = 14;
    let heightOffset = 6;

    if (aspect < 1) {
      // Mobile (Portrait)
      // Scale radius and height down based on aspect
      // At aspect 0.5 (9:18), we want radius ~9-10
      const t = Math.max(0, Math.min(1, (1 - aspect) / 0.5));
      radius = 14 - (t * 5); // 14 -> 9
      heightOffset = 6 - (t * 2.2); // 6 -> 3.8
    }

    this.mainCam.radius = radius;
    this.mainCam.heightOffset = heightOffset;
  }

  private update(): void {
    if (this.state !== GameState.PLAYING) return;

    const dt = this.engine.getDeltaTime() / 1000;

    // Core systems
    this.score.update(dt);
    this.runner.speed = this.score.speed;
    this.runner.update(dt);
    this.track.update(this.runner.mesh.position.z);
    this.obstacles.update(dt, this.runner.mesh.position.z, this.score.speed);
    
    // Instead of spawning coins randomly, chance to spawn powerup
    const shouldSpawnCoin = this.coins.shouldSpawn();
    this.powerups.update(dt, this.runner.mesh.position.z, shouldSpawnCoin);
    if (!shouldSpawnCoin) this.coins.update(dt, this.runner.mesh.position.z); // proceed normally if didn't try to spawn powerup
    
    this.env.update(this.runner.mesh.position.z);

    // Speed lines intensity
    this.fx.setSpeed(this.score.speed);

    // Collision: obstacles
    if (!this.runner.isInvincible && !this.runner.isDead) {
      for (const obs of this.obstacles.getActive()) {
        if (this.runner.mesh.intersectsMesh(obs, false)) {
          this.runner.onHit();
          break;
        }
      }
    }

    // Collision: coins
    for (const coin of [...this.coins.getActive()]) {
      if (this.runner.hasMagnet) {
        // Magnet pull logic
        const dist = Vector3.Distance(this.runner.mesh.position, coin.position);
        if (dist < 15) {
          const dir = this.runner.mesh.position.subtract(coin.position).normalize();
          coin.position.addInPlace(dir.scale(dt * 30));
        }
      }

      if (this.runner.mesh.intersectsMesh(coin, false)) {
        this.score.addCoin(this.runner.hasScore2X ? 2 : 1);
        this.audio.playCoin();
        this.fx.burstCoin(coin.position);
        this.coins.collect(coin);
      }
    }

    // Collision: powerups
    for (const pu of [...this.powerups.getActive()]) {
      if (this.runner.mesh.intersectsMesh(pu.mesh, false)) {
        this.audio.playCoin(); // Reuse coin sound or add powerup sound
        this.runner.activatePowerup(pu.type);
        this.powerups.collect(pu);
      }
    }

    // HUD
    this.hud.update(
      this.score.getDisplayScore(),
      this.score.coinsCollected,
      this.runner.lives,
    );

    // Game over check
    if (this.runner.isDead) {
      this.onGameOver();
    }
  }

  private async startGame(): Promise<void> {
    // Init audio (needs user gesture)
    await this.audio.init();
    this.audio.startBGM();

    this.state = GameState.PLAYING;
    this.runner.reset();
    this.track.reset();
    this.obstacles.reset();
    this.coins.reset();
    this.powerups.reset();
    this.score.reset();
    
    // Ensure canvas gets input immediately
    this.canvas.focus();
    this.input.enabled = true;

    this.menu.hide();
    this.gameOver.hide();
    this.pauseScreen.hide();
    this.hud.show();
  }

  private pauseGame(): void {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.PAUSED;
    this.input.enabled = false;
    this.audio.suspend(); // Stop audio cleanly
    this.pauseScreen.show();
  }

  private resumeGame(): void {
    if (this.state !== GameState.PAUSED) return;
    this.state = GameState.PLAYING;
    this.audio.resume();
    
    this.pauseScreen.hide();
    
    // Prevent immediate swipe from resume button click
    setTimeout(() => {
      this.input.enabled = true;
      this.canvas.focus();
    }, 100);
  }

  private async onGameOver(): Promise<void> {
    this.state = GameState.GAME_OVER;
    this.input.enabled = false;
    this.audio.stopBGM();
    this.hud.hide();
    await this.gameOver.show(
      this.score.getDisplayScore(),
      Math.floor(this.score.distance),
      this.score.coinsCollected,
    );
  }

  private showMenu(): void {
    this.state = GameState.MENU;
    this.input.enabled = false;
    this.audio.stopBGM();
    this.hud.hide();
    this.gameOver.hide();
    document.getElementById('loading-screen')!.classList.add('ui-hidden');
    this.menu.show();
  }
}
