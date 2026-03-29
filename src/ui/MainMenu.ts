import { storage } from '../db/storage';

export class MainMenu {
  private el: HTMLElement;

  constructor(
    private onStart: () => void,
    private onShop: () => void
  ) {
    this.el = document.getElementById('main-menu')!;
    this.render();
  }

  private async render(): Promise<void> {
    const highScore = await storage.getHighScore();
    const coins = await storage.getNexaCoins();

    this.el.innerHTML = `
      <div class="menu-card">
        <h1 class="game-title menu-title">
          <span class="title-nexa">NEXA</span><span class="title-run">RUN</span>
        </h1>
        <p class="menu-subtitle">THE INFINITE CYBER SPRINT</p>

        <div class="menu-stats">
          <div class="stat-item">
            <span class="stat-label">HIGH SCORE</span>
            <span class="stat-value">${highScore.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">COINS</span>
            <span class="stat-value">🪙 ${coins.toLocaleString()}</span>
          </div>
        </div>

        <button id="btn-play" class="btn-neon btn-play" type="button">
          ▶ TAP TO RUN
        </button>

        <button id="btn-shop-open" class="btn-neon btn-secondary" type="button" style="margin-top: 1rem;">
          🛒 SHOP
        </button>

        <div class="menu-controls-hint">
          <p>SWIPE ← → to switch lanes</p>
          <p>SWIPE ↑ or TAP to jump</p>
          <p>SWIPE ↓ to roll</p>
        </div>
      </div>
    `;

    document.getElementById('btn-play')!.addEventListener('click', () => {
      this.onStart();
    });

    // Also start on any touch outside the button
    document.getElementById('btn-play')!.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onStart();
    });

    document.getElementById('btn-shop-open')!.addEventListener('click', () => {
      this.onShop();
    });
  }

  async show(): Promise<void> {
    await this.render();
    this.el.classList.remove('ui-hidden');
    this.el.classList.add('fade-in');
  }

  hide(): void {
    this.el.classList.add('ui-hidden');
    this.el.classList.remove('fade-in');
  }
}
