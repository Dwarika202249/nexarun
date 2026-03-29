export class PauseScreen {
  private el: HTMLElement;

  constructor(
    private onResume: () => void,
    private onQuit: () => void,
  ) {
    this.el = document.getElementById('pause-screen')!;

    document.getElementById('btn-resume')!.addEventListener('click', () => {
      this.onResume();
    });

    document.getElementById('btn-quit')!.addEventListener('click', () => {
      this.onQuit();
    });
  }

  show(): void {
    this.el.classList.remove('ui-hidden');
    this.el.classList.add('fade-in');
  }

  hide(): void {
    this.el.classList.add('ui-hidden');
    this.el.classList.remove('fade-in');
  }
}
