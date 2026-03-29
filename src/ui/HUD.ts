export class HUD {
  private el: HTMLElement;
  private scoreEl: HTMLElement;
  private coinsEl: HTMLElement;
  private livesEl: HTMLElement;

  constructor(private onPause: () => void) {
    this.el = document.getElementById('hud')!;
    
    // We removed innerHTML setting here because it's now statically in index.html!
    // We just bind to the HTMLElements.
    this.scoreEl = document.getElementById('hud-score')!;
    this.coinsEl = document.getElementById('hud-coins')!;
    this.livesEl = document.getElementById('hud-lives')!;

    document.getElementById('btn-pause')!.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent swipe triggers
      this.onPause();
    });
    
    // Also bind touchstart to avoid delays
    document.getElementById('btn-pause')!.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.onPause();
    }, { passive: false });
  }

  update(score: number, coins: number, lives: number): void {
    this.scoreEl.textContent = score.toLocaleString();
    this.coinsEl.textContent = coins.toLocaleString();
    this.livesEl.innerHTML = Array(lives).fill('❤️').join('');
  }

  show(): void { this.el.classList.remove('ui-hidden'); }
  hide(): void { this.el.classList.add('ui-hidden'); }
}
