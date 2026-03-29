import { GAME } from '../utils/constants';

export class ScoreManager {
  score = 0;
  distance = 0;
  speed = GAME.INITIAL_SPEED;
  multiplier = 1;
  coinsCollected = 0;

  update(dt: number): void {
    this.distance += this.speed * dt;
    const target = GAME.INITIAL_SPEED +
      Math.floor(this.distance / GAME.SPEED_RAMP_DISTANCE) * GAME.SPEED_INCREMENT;
    this.speed = Math.min(target, GAME.MAX_SPEED);
  }

  addCoin(amount = 1): void {
    this.coinsCollected += amount;
    this.score += GAME.COIN_VALUE * this.multiplier * amount;
  }

  getDisplayScore(): number {
    return this.score + Math.floor(this.distance) * this.multiplier;
  }

  reset(): void {
    this.score = 0;
    this.distance = 0;
    this.speed = GAME.INITIAL_SPEED;
    this.multiplier = 1;
    this.coinsCollected = 0;
  }
}
