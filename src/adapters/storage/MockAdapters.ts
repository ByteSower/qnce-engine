/* eslint-disable @typescript-eslint/no-unused-vars */
import type { StorageAdapter, SerializedState, PersistenceResult, SerializationOptions, LoadOptions } from '../../engine/types';

/** Simple in-memory backing store shared across mock adapters */
const store = new Map<string, SerializedState>();

export interface FailingAdapterOptions {
  failSaves?: boolean;
  failLoads?: boolean;
  failDeletes?: boolean;
  delayMs?: number;
}

/** Adapter that can be configured to fail certain operations */
export class FailingStorageAdapter implements StorageAdapter {
  constructor(private opts: FailingAdapterOptions = {}) {}
  async save(key: string, data: SerializedState, _options?: SerializationOptions): Promise<PersistenceResult> { // options unused by mock
    if (this.opts.delayMs) await new Promise(r => setTimeout(r, this.opts.delayMs));
    if (this.opts.failSaves) return { success: false, error: 'mock-save-failed' };
    store.set(key, data);
    return { success: true };
  }
  async load(key: string, _options?: LoadOptions): Promise<SerializedState | null> { // options unused by mock
    if (this.opts.delayMs) await new Promise(r => setTimeout(r, this.opts.delayMs));
    if (this.opts.failLoads) throw new Error('mock-load-failed');
    return store.get(key) ?? null;
  }
  async delete(key: string): Promise<boolean> {
    if (this.opts.failDeletes) return false;
    return store.delete(key);
  }
  async list(): Promise<string[]> { return [...store.keys()]; }
  async exists(key: string): Promise<boolean> { return store.has(key); }
  async getStats(): Promise<{ totalSize: number; keyCount: number; [k: string]: unknown }>{ return { totalSize: store.size, keyCount: store.size }; }
  async clear(): Promise<boolean> { store.clear(); return true; }
}

export interface RetryAdapterOptions {
  failCount: number; // number of initial attempts to fail
  maxAttempts?: number; // safety cap
  delayMs?: number; // artificial delay each call
}

/** Adapter that fails first N saves then succeeds, to exercise retry logic (future). */
export class FlakySaveAdapter implements StorageAdapter {
  private attempts = 0;
  constructor(private opts: RetryAdapterOptions) {}
  async save(key: string, data: SerializedState, _options?: SerializationOptions): Promise<PersistenceResult> { // options unused by mock
    if (this.opts.delayMs) await new Promise(r => setTimeout(r, this.opts.delayMs));
    this.attempts++;
    if (this.attempts <= this.opts.failCount) return { success: false, error: 'transient-error' };
    store.set(key, data);
    return { success: true }; // attempts tracked internally; tests inspect adapter state if needed
  }
  async load(key: string): Promise<SerializedState | null> { return store.get(key) ?? null; }
  async delete(key: string): Promise<boolean> { return store.delete(key); }
  async list(): Promise<string[]> { return [...store.keys()]; }
  async exists(key: string): Promise<boolean> { return store.has(key); }
  async getStats(): Promise<{ totalSize: number; keyCount: number; [k: string]: unknown }>{ return { totalSize: store.size, keyCount: store.size }; }
  async clear(): Promise<boolean> { store.clear(); return true; }
}

/** Adapter introducing artificial latency without failures. */
export class SlowStorageAdapter implements StorageAdapter {
  constructor(private delayMs = 25) {}
  private async lag() { await new Promise(r => setTimeout(r, this.delayMs)); }
  async save(key: string, data: SerializedState): Promise<PersistenceResult> { await this.lag(); store.set(key, data); return { success: true }; }
  async load(key: string): Promise<SerializedState | null> { await this.lag(); return store.get(key) ?? null; }
  async delete(key: string): Promise<boolean> { await this.lag(); return store.delete(key); }
  async list(): Promise<string[]> { await this.lag(); return [...store.keys()]; }
  async exists(key: string): Promise<boolean> { await this.lag(); return store.has(key); }
  async getStats(): Promise<{ totalSize: number; keyCount: number; [k: string]: unknown }>{ return { totalSize: store.size, keyCount: store.size }; }
  async clear(): Promise<boolean> { await this.lag(); store.clear(); return true; }
}

export interface TimeoutAdapterOptions {
  timeoutFailCount: number; // number of initial attempts that simulate a timeout (reject)
  resolveDelayMs?: number; // delay before succeeding (post-timeout attempts)
  timeoutDelayMs?: number; // artificial delay before rejecting (each timed out attempt)
}

/**
 * Adapter that simulates network timeouts for the first N save attempts by rejecting.
 * After those attempts it succeeds (optionally with a delay). Useful to exercise retry logic and telemetry attempts field.
 */
export class TimeoutSaveAdapter implements StorageAdapter {
  private attempt = 0;
  constructor(private opts: TimeoutAdapterOptions) {}
  private async delay(ms?: number) { if (ms) await new Promise(r => setTimeout(r, ms)); }
  async save(key: string, data: SerializedState): Promise<PersistenceResult> {
    this.attempt++;
    if (this.attempt <= this.opts.timeoutFailCount) {
      await this.delay(this.opts.timeoutDelayMs);
      // Simulate a network timeout by throwing (engine converts to failed PersistenceResult)
      throw new Error('timeout');
    }
    await this.delay(this.opts.resolveDelayMs);
    store.set(key, data);
    return { success: true };
  }
  async load(key: string): Promise<SerializedState | null> { return store.get(key) ?? null; }
  async delete(key: string): Promise<boolean> { return store.delete(key); }
  async list(): Promise<string[]> { return [...store.keys()]; }
  async exists(key: string): Promise<boolean> { return store.has(key); }
  async getStats(): Promise<{ totalSize: number; keyCount: number; [k: string]: unknown }>{ return { totalSize: store.size, keyCount: store.size }; }
  async clear(): Promise<boolean> { store.clear(); return true; }
}
