import type { Runner } from './Runner';
import { GAME } from '../utils/constants';

export class InputHandler {
  enabled = false;
  private startX = 0;
  private startY = 0;
  private startTime = 0;

  private isSwiping = false;

  onPause?: () => void;

  constructor(
    private runner: Runner,
    canvas: HTMLCanvasElement,
  ) {
    // Keyboard (Window level fallback to prevent focus issues)
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const key = e.key;
      if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D', 'ArrowUp', 'w', 'W', ' ', 'ArrowDown', 's', 'S', 'Escape'].includes(key)) {
        e.preventDefault();
      }
      switch (key) {
        case 'ArrowLeft': case 'a': case 'A':
          this.runner.switchLane('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D':
          this.runner.switchLane('RIGHT'); break;
        case 'ArrowUp': case 'w': case 'W': case ' ':
          this.runner.jump(); break;
        case 'ArrowDown': case 's': case 'S':
          this.runner.roll(); break;
        case 'Escape':
          if (this.onPause) this.onPause(); break;
      }
    });

    // Touch (mobile-first)
    canvas.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const t = e.touches[0];
      this.startX = t.clientX;
      this.startY = t.clientY;
      this.startTime = performance.now();
      this.isSwiping = true;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (!this.enabled || !this.isSwiping) return;
      e.preventDefault();
      this.isSwiping = false;
      
      const t = e.changedTouches[0];
      const dx = t.clientX - this.startX;
      const dy = t.clientY - this.startY;
      const dt = performance.now() - this.startTime;

      // Quick tap → jump
      if (Math.abs(dx) < GAME.SWIPE_THRESHOLD &&
          Math.abs(dy) < GAME.SWIPE_THRESHOLD &&
          dt < GAME.TAP_MAX_DURATION) {
        this.runner.jump();
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > GAME.SWIPE_THRESHOLD) this.runner.switchLane('RIGHT');
        else if (dx < -GAME.SWIPE_THRESHOLD) this.runner.switchLane('LEFT');
      } else {
        if (dy < -GAME.SWIPE_THRESHOLD) this.runner.jump();
        else if (dy > GAME.SWIPE_THRESHOLD) this.runner.roll();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchcancel', () => {
      this.isSwiping = false;
    });
  }
}
