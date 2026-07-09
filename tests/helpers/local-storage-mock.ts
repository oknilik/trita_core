class InMemoryLocalStorage implements Storage {
  private readonly store = new Map<string, string>();
  private setItemCalls = 0;
  private removeItemCalls = 0;

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
    this.removeItemCalls += 1;
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.setItemCalls += 1;
    this.store.set(key, value);
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.store.entries());
  }

  getSetItemCallCount(): number {
    return this.setItemCalls;
  }

  getRemoveItemCallCount(): number {
    return this.removeItemCalls;
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

export function installBrowserLocalStorageMock(initialValues?: Record<string, string>): {
  localStorage: InMemoryLocalStorage;
  restore: () => void;
} {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const { localStorage, restore: restoreLocalStorage } = installLocalStorageMock(initialValues);

  const windowValue: Record<string, unknown> =
    typeof globalThis.window === "undefined"
      ? {}
      : (globalThis.window as unknown as Record<string, unknown>);
  Object.defineProperty(globalThis, "window", {
    value: {
      ...windowValue,
      localStorage,
    },
    configurable: true,
    writable: true,
  });

  return {
    localStorage,
    restore: () => {
      restoreLocalStorage();
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
        return;
      }
      delete (globalThis as { window?: Window }).window;
    },
  };
}
