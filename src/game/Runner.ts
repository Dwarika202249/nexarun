import {
  Scene, MeshBuilder, Mesh, StandardMaterial, Color3,
} from '@babylonjs/core';
import { GAME, LANES, LANE_POSITIONS, type LaneDirection } from '../utils/constants';
import { lerp } from '../utils/mathUtils';

export enum RunnerState {
  RUNNING,
  JUMPING,
  ROLLING,
  HIT,
  DEAD,
}

export class Runner {
  mesh: Mesh;
  speed = GAME.INITIAL_SPEED;
  lives = GAME.INITIAL_LIVES;
  isInvincible = false;
  
  // Powerups
  hasMagnet = false;
  hasScore2X = false;
  private powerupTimers: Record<string, number> = {};
  
  private material!: StandardMaterial;

  // Event callbacks (wired by GameManager)
  onJump?: () => void;
  onRoll?: () => void;
  onHitEvent?: () => void;
  onDeath?: () => void;

  private state = RunnerState.RUNNING;
  private laneIndex = 1;  // 0=LEFT, 1=CENTER, 2=RIGHT
  private targetX: number = LANES.CENTER;
  private velocityY = 0;
  private isGrounded = true;
  private invTimer = 0;
  private rollTimer = 0;
  private blinkClock = 0;

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateCapsule('runner', {
      height: GAME.RUNNER_HEIGHT,
      radius: GAME.RUNNER_RADIUS,
    }, scene);
    this.mesh.position.y = GAME.GROUND_Y;

    this.material = new StandardMaterial('runnerMat', scene);
    this.material.diffuseColor = new Color3(0, 0.7, 0.9);
    this.material.emissiveColor = new Color3(0, 0.35, 0.5);
    this.mesh.material = this.material;
  }

  applySkin(diffuseHex: string, emissiveHex: string): void {
    this.material.diffuseColor = Color3.FromHexString(diffuseHex);
    this.material.emissiveColor = Color3.FromHexString(emissiveHex);
  }

  get isDead(): boolean { return this.state === RunnerState.DEAD; }

  switchLane(dir: LaneDirection): void {
    if (this.state === RunnerState.DEAD) return;
    if (dir === 'LEFT' && this.laneIndex > 0) this.laneIndex--;
    else if (dir === 'RIGHT' && this.laneIndex < 2) this.laneIndex++;
    this.targetX = LANE_POSITIONS[this.laneIndex];
  }

  activatePowerup(type: string): void {
    const dur = GAME.POWERUP_DURATION;
    if (type === 'MAGNET') {
      this.hasMagnet = true;
      this.powerupTimers.MAGNET = dur;
    } else if (type === 'SCORE2X') {
      this.hasScore2X = true;
      this.powerupTimers.SCORE2X = dur;
    } else if (type === 'SHIELD') {
      this.isInvincible = true;
      this.invTimer = dur;
      this.blinkClock = 0;
    }
  }

  jump(): void {
    if (!this.isGrounded || this.state === RunnerState.DEAD) return;
    if (this.state === RunnerState.ROLLING) this.endRoll();
    this.state = RunnerState.JUMPING;
    this.isGrounded = false;
    this.velocityY = GAME.JUMP_FORCE;
    this.onJump?.();
  }

  roll(): void {
    if (!this.isGrounded || this.state === RunnerState.DEAD) return;
    if (this.state === RunnerState.JUMPING) return;
    this.state = RunnerState.ROLLING;
    this.rollTimer = GAME.ROLL_DURATION;
    this.mesh.scaling.y = GAME.ROLL_SCALE_Y;
    this.mesh.position.y = GAME.GROUND_Y * GAME.ROLL_SCALE_Y;
    this.onRoll?.();
  }

  onHit(): void {
    if (this.isInvincible || this.state === RunnerState.DEAD) return;
    this.lives--;
    if (this.lives <= 0) {
      this.state = RunnerState.DEAD;
      this.onDeath?.();
      return;
    }
    this.state = RunnerState.HIT;
    this.isInvincible = true;
    this.invTimer = GAME.INVINCIBLE_DURATION;
    this.blinkClock = 0;
    this.onHitEvent?.();
  }

  update(dt: number): void {
    if (this.state === RunnerState.DEAD) return;

    // Update powerup timers
    if (this.hasMagnet) {
      this.powerupTimers.MAGNET -= dt;
      if (this.powerupTimers.MAGNET <= 0) this.hasMagnet = false;
    }
    if (this.hasScore2X) {
      this.powerupTimers.SCORE2X -= dt;
      if (this.powerupTimers.SCORE2X <= 0) this.hasScore2X = false;
    }

    // Forward
    this.mesh.position.z += this.speed * dt;

    // Lane lerp
    this.mesh.position.x = lerp(this.mesh.position.x, this.targetX, GAME.LANE_SWITCH_SPEED);

    // Gravity
    if (!this.isGrounded) {
      this.velocityY += GAME.GRAVITY * dt;
      this.mesh.position.y += this.velocityY * dt;
      if (this.mesh.position.y <= GAME.GROUND_Y) {
        this.mesh.position.y = GAME.GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
        if (this.state === RunnerState.JUMPING) this.state = RunnerState.RUNNING;
      }
    }

    // Roll timer
    if (this.state === RunnerState.ROLLING) {
      this.rollTimer -= dt;
      if (this.rollTimer <= 0) this.endRoll();
    }

    // Invincibility blink
    if (this.isInvincible) {
      this.invTimer -= dt;
      this.blinkClock += dt;
      this.mesh.isVisible = Math.sin(this.blinkClock * 20) > 0;
      if (this.invTimer <= 0) {
        this.isInvincible = false;
        this.mesh.isVisible = true;
        this.blinkClock = 0;
        if (this.state === RunnerState.HIT) this.state = RunnerState.RUNNING;
      }
    }
  }

  private endRoll(): void {
    this.state = RunnerState.RUNNING;
    this.mesh.scaling.y = 1;
    this.mesh.position.y = GAME.GROUND_Y;
  }

  reset(): void {
    this.state = RunnerState.RUNNING;
    this.laneIndex = 1;
    this.targetX = LANES.CENTER;
    this.mesh.position.set(0, GAME.GROUND_Y, 0);
    this.mesh.scaling.y = 1;
    this.mesh.isVisible = true;
    this.speed = GAME.INITIAL_SPEED;
    this.lives = GAME.INITIAL_LIVES;
    this.isInvincible = false;
    this.hasMagnet = false;
    this.hasScore2X = false;
    this.powerupTimers = {};
    this.invTimer = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.rollTimer = 0;
    this.blinkClock = 0;
  }
}
