import { storage } from '../db/storage';

export class GameOverScreen {
  private el: HTMLElement;

  constructor(
    private onRetry: () => void,
    private onMenu: () => void,
  ) {
    this.el = document.getElementById('game-over')!;
  }

  async show(score: number, distance: number, coins: number): Promise<void> {
    const highScore = await storage.getHighScore();
    const isNew = score > highScore;

    if (isNew) {
      await storage.setHighScore(score);
    }
    await storage.addNexaCoins(coins);
    await storage.addTotalCoins(coins);

    this.el.innerHTML = `
      <div class="menu-card gameover-card">
        <h2 class="gameover-title">GAME OVER</h2>
        ${isNew ? '<p class="new-record">⚡ NEW RECORD! ⚡</p>' : ''}

        <div class="gameover-stats">
          <div class="stat-item">
            <span class="stat-label">SCORE</span>
            <span class="stat-value">${score.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">DISTANCE</span>
            <span class="stat-value">${distance.toLocaleString()}m</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">COINS</span>
            <span class="stat-value">🪙 ${coins}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">BEST</span>
            <span class="stat-value">${Math.max(score, highScore).toLocaleString()}</span>
          </div>
        </div>

        <div class="gameover-buttons">
          <button id="btn-retry" class="btn-neon btn-retry" type="button">
            🔄 RETRY
          </button>
          <button id="btn-menu" class="btn-neon btn-secondary" type="button">
            MENU
          </button>
        </div>
      </div>
    `;

    this.el.classList.remove('ui-hidden');
    this.el.classList.add('fade-in');

    document.getElementById('btn-retry')!.addEventListener('click', () => this.onRetry());
    document.getElementById('btn-menu')!.addEventListener('click', () => this.onMenu());
  }

  hide(): void {
    this.el.classList.add('ui-hidden');
    this.el.classList.remove('fade-in');
  }
}
