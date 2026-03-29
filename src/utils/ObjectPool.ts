import type { AbstractMesh } from '@babylonjs/core';

export class ObjectPool<T extends AbstractMesh> {
  private pool: T[] = [];

  constructor(factory: () => T, size: number) {
    for (let i = 0; i < size; i++) {
      const obj = factory();
      obj.setEnabled(false);
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    const obj = this.pool.find((o) => !o.isEnabled());
    return obj ?? null;
  }

  release(obj: T): void {
    obj.setEnabled(false);
  }

  releaseAll(): void {
    for (const obj of this.pool) {
      obj.setEnabled(false);
    }
  }

  dispose(): void {
    for (const obj of this.pool) {
      obj.dispose();
    }
    this.pool = [];
  }
}
