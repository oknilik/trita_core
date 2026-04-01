class InMemoryLocalStorage implements Storage {
  private readonly store = new Map<string, string>();

  constructor(initialValues?: Record<string, string>) {
    if (!initialValues) return;
    for (const [key, value] of Object.entries(initialValues)) {
      this.store.set(key, value);
    }
  }

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.store.entries());
  }
}

export function createLocalStorageMock(
  initialValues?: Record<string, string>,
): InMemoryLocalStorage {
  return new InMemoryLocalStorage(initialValues);
}

export function installLocalStorageMock(initialValues?: Record<string, string>): {
  localStorage: InMemoryLocalStorage;
  restore: () => void;
} {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const localStorage = createLocalStorageMock(initialValues);

  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    configurable: true,
    writable: true,
  });

  return {
    localStorage,
    restore: () => {
      if (original) {
        Object.defineProperty(globalThis, "localStorage", original);
        return;
      }

      delete (globalThis as { localStorage?: Storage }).localStorage;
    },
  };
}
