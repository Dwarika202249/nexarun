import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'nexarun-db';
const DB_VER = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VER, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('playerData')) {
          db.createObjectStore('playerData');
        }
      },
    });
  }
  return dbPromise;
}

export const storage = {
  async getHighScore(): Promise<number> {
    const db = await getDB();
    return (await db.get('playerData', 'highScore')) ?? 0;
  },

  async setHighScore(score: number): Promise<void> {
    const db = await getDB();
    await db.put('playerData', score, 'highScore');
  },

  async getNexaCoins(): Promise<number> {
    const db = await getDB();
    return (await db.get('playerData', 'nexaCoins')) ?? 0;
  },

  async addNexaCoins(amount: number): Promise<void> {
    const db = await getDB();
    const current = await this.getNexaCoins();
    await db.put('playerData', current + amount, 'nexaCoins');
  },

  async getTotalCoins(): Promise<number> {
    const db = await getDB();
    return (await db.get('playerData', 'totalCoinsEarned')) ?? 0;
  },

  async addTotalCoins(amount: number): Promise<void> {
    const db = await getDB();
    const current = await this.getTotalCoins();
    await db.put('playerData', current + amount, 'totalCoinsEarned');
  },

  async getPurchasedSkins(): Promise<string[]> {
    const db = await getDB();
    return (await db.get('playerData', 'purchasedSkins')) ?? ['skin_cyan'];
  },

  async addPurchasedSkin(skinId: string): Promise<void> {
    const db = await getDB();
    const current = await this.getPurchasedSkins();
    if (!current.includes(skinId)) {
      current.push(skinId);
      await db.put('playerData', current, 'purchasedSkins');
    }
  },

  async getEquippedSkin(): Promise<string> {
    const db = await getDB();
    return (await db.get('playerData', 'equippedSkin')) ?? 'skin_cyan';
  },

  async setEquippedSkin(skinId: string): Promise<void> {
    const db = await getDB();
    await db.put('playerData', skinId, 'equippedSkin');
  },
};
