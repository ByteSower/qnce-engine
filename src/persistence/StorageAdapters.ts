// QNCE Engine - Storage Adapter Implementations
// Provides pluggable persistence backends implementing StorageAdapter

import { SerializedState, StorageAdapter, PersistenceResult, SerializationOptions, LoadOptions } from '../engine/types';

// Utility: safe JSON parse with error capture
function safeParse(data: string): SerializedState | null {
  try {
    return JSON.parse(data) as SerializedState;
  } catch {
    return null;
  }
}

// Base adapter with common helpers
abstract class BaseAdapter implements StorageAdapter {
  abstract save(key: string, data: SerializedState, options?: SerializationOptions): Promise<PersistenceResult>;
  abstract load(key: string, options?: LoadOptions): Promise<SerializedState | null>;
  abstract delete(key: string): Promise<boolean>;
  abstract list(): Promise<string[]>;
  abstract exists(key: string): Promise<boolean>;
  abstract getStats(): Promise<{ totalSize: number; keyCount: number; [key: string]: unknown }>;
  abstract clear(): Promise<boolean>;

  protected buildResult(success: boolean, data?: Partial<PersistenceResult['data']>, error?: string): PersistenceResult {
    return success ? { success, data } : { success, error };
  }
}

// In-memory adapter (useful for tests & ephemeral sessions)
export class MemoryStorageAdapter extends BaseAdapter {
  private store = new Map<string, SerializedState>();

  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    const start = performance.now();
    this.store.set(key, data);
    return this.buildResult(true, { size: JSON.stringify(data).length, duration: performance.now() - start });
  }
  async load(key: string): Promise<SerializedState | null> { return this.store.get(key) || null; }
  async delete(key: string): Promise<boolean> { return this.store.delete(key); }
  async list(): Promise<string[]> { return Array.from(this.store.keys()); }
  async exists(key: string): Promise<boolean> { return this.store.has(key); }
  async getStats() { return { totalSize: Array.from(this.store.values()).reduce((s,v)=>s+JSON.stringify(v).length,0), keyCount: this.store.size }; }
  async clear(): Promise<boolean> { this.store.clear(); return true; }
}

// Browser localStorage adapter
export class LocalStorageAdapter extends BaseAdapter {
  protected prefix: string;
  constructor(prefix: string = 'qnce:') { super(); this.prefix = prefix; }
  protected k(key: string) { return this.prefix + key; }

  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    if (typeof localStorage === 'undefined') return this.buildResult(false, undefined, 'localStorage not available');
    const start = performance.now();
    const serialized = JSON.stringify(data);
    try { localStorage.setItem(this.k(key), serialized); } catch (e:any) { return this.buildResult(false, undefined, e.message); }
    return this.buildResult(true, { size: serialized.length, duration: performance.now() - start });
  }
  async load(key: string): Promise<SerializedState | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.k(key));
    return raw ? safeParse(raw) : null;
  }
  async delete(key: string): Promise<boolean> { if (typeof localStorage === 'undefined') return false; localStorage.removeItem(this.k(key)); return true; }
  async list(): Promise<string[]> {
    if (typeof localStorage === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) keys.push(k.substring(this.prefix.length));
    }
    return keys;
  }
  async exists(key: string): Promise<boolean> { if (typeof localStorage === 'undefined') return false; return localStorage.getItem(this.k(key)) !== null; }
  async getStats() {
    if (typeof localStorage === 'undefined') return { totalSize: 0, keyCount: 0 };
    let total = 0; let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        const v = localStorage.getItem(k) || '';
        total += v.length; count++;
      }
    }
    return { totalSize: total, keyCount: count };
  }
  async clear(): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    const keys = await this.list();
    keys.forEach(k => localStorage.removeItem(this.prefix + k));
    return true;
  }
}

// Browser sessionStorage adapter
export class SessionStorageAdapter extends BaseAdapter {
  private prefix: string;
  constructor(prefix: string = 'qnce:') { super(); this.prefix = prefix; }
  private k(key: string) { return this.prefix + key; }
  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    if (typeof sessionStorage === 'undefined') return this.buildResult(false, undefined, 'sessionStorage not available');
    const start = performance.now();
    const serialized = JSON.stringify(data);
    try { sessionStorage.setItem(this.k(key), serialized); } catch (e:any) { return this.buildResult(false, undefined, e.message); }
    return this.buildResult(true, { size: serialized.length, duration: performance.now() - start });
  }
  async load(key: string): Promise<SerializedState | null> {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(this.k(key));
    return raw ? safeParse(raw) : null;
  }
  async delete(key: string): Promise<boolean> { if (typeof sessionStorage === 'undefined') return false; sessionStorage.removeItem(this.k(key)); return true; }
  async list(): Promise<string[]> {
    if (typeof sessionStorage === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(this.prefix)) keys.push(k.substring(this.prefix.length));
    }
    return keys;
  }
  async exists(key: string): Promise<boolean> { if (typeof sessionStorage === 'undefined') return false; return sessionStorage.getItem(this.k(key)) !== null; }
  async getStats() {
    if (typeof sessionStorage === 'undefined') return { totalSize: 0, keyCount: 0 };
    let total = 0; let count = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        const v = sessionStorage.getItem(k) || '';
        total += v.length; count++;
      }
    }
    return { totalSize: total, keyCount: count };
  }
  async clear(): Promise<boolean> {
    if (typeof sessionStorage === 'undefined') return false;
    const keys = await this.list();
    keys.forEach(k => sessionStorage.removeItem(this.prefix + k));
    return true;
  }
}

// File system adapter (Node.js only)
export class FileStorageAdapter extends BaseAdapter {
  private dir: string;
  constructor(directory: string) { super(); this.dir = directory; }

  private async ensureDir() {
    const fs = await import('fs/promises');
    await fs.mkdir(this.dir, { recursive: true });
  }
  private pathFor(key: string) { return `${this.dir}/${key}.json`; }

  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    const start = performance.now();
    await this.ensureDir();
    const fs = await import('fs/promises');
    const serialized = JSON.stringify(data, null, 0);
    await fs.writeFile(this.pathFor(key), serialized, 'utf-8');
    return this.buildResult(true, { size: serialized.length, duration: performance.now() - start });
  }
  async load(key: string): Promise<SerializedState | null> {
    try {
      const fs = await import('fs/promises');
      const raw = await fs.readFile(this.pathFor(key), 'utf-8');
      return safeParse(raw);
    } catch { return null; }
  }
  async delete(key: string): Promise<boolean> {
    try { const fs = await import('fs/promises'); await fs.unlink(this.pathFor(key)); return true; } catch { return false; }
  }
  async list(): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.dir);
      return files.filter(f=>f.endsWith('.json')).map(f=>f.replace(/\.json$/,''));
    } catch { return []; }
  }
  async exists(key: string): Promise<boolean> {
    try { const fs = await import('fs/promises'); await fs.access(this.pathFor(key)); return true; } catch { return false; }
  }
  async getStats() {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.dir);
      let total = 0; let count = 0;
      for (const f of files) if (f.endsWith('.json')) { const raw = await fs.readFile(`${this.dir}/${f}`,'utf-8'); total += raw.length; count++; }
      return { totalSize: total, keyCount: count };
    } catch { return { totalSize: 0, keyCount: 0 }; }
  }
  async clear(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.dir);
      await Promise.all(files.filter(f=>f.endsWith('.json')).map(f=>fs.unlink(`${this.dir}/${f}`)));
      return true;
    } catch { return false; }
  }
}

// IndexedDB adapter (browser) - minimal implementation
export class IndexedDBStorageAdapter extends BaseAdapter {
  private dbName: string;
  private storeName: string = 'qnce_state';
  constructor(databaseName: string = 'QNCE_DB') { super(); this.dbName = databaseName; }

  private async withStore(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(this.dbName, 1);
      openReq.onupgradeneeded = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName);
      };
      openReq.onerror = () => reject(openReq.error);
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction(this.storeName, mode);
        const store = tx.objectStore(this.storeName);
        const result = fn(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      };
    });
  }

  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    if (typeof indexedDB === 'undefined') return this.buildResult(false, undefined, 'indexedDB not available');
    const start = performance.now();
    await this.withStore('readwrite', store => { store.put(data, key); });
    return this.buildResult(true, { size: JSON.stringify(data).length, duration: performance.now() - start });
  }
  async load(key: string): Promise<SerializedState | null> {
    if (typeof indexedDB === 'undefined') return null;
    return new Promise((resolve, reject) => {
      this.withStore('readonly', store => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  }
  async delete(key: string): Promise<boolean> {
    if (typeof indexedDB === 'undefined') return false;
    await this.withStore('readwrite', store => { store.delete(key); });
    return true;
  }
  async list(): Promise<string[]> {
    if (typeof indexedDB === 'undefined') return [];
    return new Promise((resolve, reject) => {
      this.withStore('readonly', store => {
        const keys: string[] = [];
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
            if (cursor) {
              keys.push(cursor.key as string);
              cursor.continue();
            } else {
              resolve(keys);
            }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    });
  }
  async exists(key: string): Promise<boolean> { const val = await this.load(key); return !!val; }
  async getStats() {
    const keys = await this.list();
    let total = 0;
    for (const k of keys) { const v = await this.load(k); if (v) total += JSON.stringify(v).length; }
    return { totalSize: total, keyCount: keys.length };
  }
  async clear(): Promise<boolean> {
    if (typeof indexedDB === 'undefined') return false;
    await this.withStore('readwrite', store => { store.clear(); });
    return true;
  }
}

export type AnyAdapter = MemoryStorageAdapter | LocalStorageAdapter | SessionStorageAdapter | FileStorageAdapter | IndexedDBStorageAdapter;

export function createStorageAdapter(type: 'memory'): MemoryStorageAdapter;
export function createStorageAdapter(type: 'localStorage', options?: { prefix?: string }): LocalStorageAdapter;
export function createStorageAdapter(type: 'sessionStorage', options?: { prefix?: string }): SessionStorageAdapter;
export function createStorageAdapter(type: 'file', options: { directory: string }): FileStorageAdapter;
export function createStorageAdapter(type: 'indexedDB', options?: { databaseName?: string }): IndexedDBStorageAdapter;
export function createStorageAdapter(type: string, options: any = {}): AnyAdapter {
  switch (type) {
    case 'memory': return new MemoryStorageAdapter();
    case 'localStorage': return new LocalStorageAdapter(options.prefix);
    case 'sessionStorage': return new SessionStorageAdapter(options.prefix);
    case 'file': return new FileStorageAdapter(options.directory || './qnce_saves');
    case 'indexedDB': return new IndexedDBStorageAdapter(options.databaseName);
    default: throw new Error(`Unknown storage adapter type: ${type}`);
  }
}
