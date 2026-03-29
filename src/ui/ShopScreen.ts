import { storage } from '../db/storage';

export interface Skin {
  id: string;
  name: string;
  diffuseHex: string;
  emissiveHex: string;
  cost: number;
}

export const SKINS: Skin[] = [
  { id: 'skin_cyan', name: 'CYAN DRIFT (Default)', diffuseHex: '#00b3e6', emissiveHex: '#005980', cost: 0 },
  { id: 'skin_pink', name: 'NEON PINK', diffuseHex: '#ff00aa', emissiveHex: '#990066', cost: 100 },
  { id: 'skin_gold', name: 'SOLAR GOLD', diffuseHex: '#ffcc00', emissiveHex: '#b38f00', cost: 300 },
  { id: 'skin_green', name: 'MATRIX GREEN', diffuseHex: '#00ff33', emissiveHex: '#00801a', cost: 500 },
  { id: 'skin_red', name: 'CRIMSON BLAZE', diffuseHex: '#ff1a1a', emissiveHex: '#800000', cost: 1000 },
];

export class ShopScreen {
  private el: HTMLElement;
  private listEl: HTMLElement;
  private coinsDisplay: HTMLElement;

  constructor(private onClose: () => void) {
    this.el = document.getElementById('shop-screen')!;
    this.listEl = document.getElementById('shop-skin-list')!;
    this.coinsDisplay = document.getElementById('shop-coins-display')!;

    document.getElementById('btn-shop-close')!.addEventListener('click', () => {
      this.onClose();
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

  private async render(): Promise<void> {
    const coins = await storage.getNexaCoins();
    const equipped = await storage.getEquippedSkin();
    const purchased = await storage.getPurchasedSkins();

    this.coinsDisplay.innerText = coins.toLocaleString();
    this.listEl.innerHTML = '';

    SKINS.forEach(skin => {
      const isOwned = skin.cost === 0 || purchased.includes(skin.id);
      const isEquipped = equipped === skin.id;

      let btnHTML = '';
      if (isEquipped) {
        btnHTML = `<button class="btn-neon btn-secondary btn-buy" disabled>EQUIPPED</button>`;
      } else if (isOwned) {
        btnHTML = `<button class="btn-neon btn-secondary btn-buy" data-action="equip" data-id="${skin.id}">EQUIP</button>`;
      } else {
        const affordable = coins >= skin.cost;
        const cls = affordable ? 'btn-neon' : 'btn-neon btn-secondary';
        btnHTML = `<button class="${cls} btn-buy" data-action="buy" data-id="${skin.id}" ${affordable ? '' : 'disabled'}>
          ${affordable ? 'BUY' : 'LOCKED'}
        </button>`;
      }

      const item = document.createElement('div');
      item.className = `skin-item ${isEquipped ? 'equipped' : ''}`;
      item.innerHTML = `
        <div class="skin-preview" style="background-color: ${skin.emissiveHex}; box-shadow: 0 0 10px ${skin.emissiveHex}"></div>
        <div class="skin-info">
          <div class="skin-name">${skin.name}</div>
          <div class="skin-cost">${isOwned ? 'OWNED' : '🪙 ' + skin.cost}</div>
        </div>
        ${btnHTML}
      `;

      item.querySelector('button')?.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id')!;
        if (action === 'buy') this.handleBuy(id);
        else if (action === 'equip') this.handleEquip(id);
      });

      this.listEl.appendChild(item);
    });
  }

  private async handleBuy(id: string): Promise<void> {
    const skin = SKINS.find(s => s.id === id);
    if (!skin) return;
    
    const coins = await storage.getNexaCoins();
    if (coins >= skin.cost) {
      await storage.addNexaCoins(-skin.cost);
      await storage.addPurchasedSkin(id);
      this.render(); // Re-render silently to update buttons
    }
  }

  private async handleEquip(id: string): Promise<void> {
    await storage.setEquippedSkin(id);
    this.render();
  }
}
