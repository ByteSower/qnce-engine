import { QEvent, Telemetry, TelemetryAdapter, TelemetryOptions } from './types.js';
import { createWriteStream, WriteStream } from 'fs';

// Simple PRNG for deterministic sampling in tests (xorshift32)
function xorshift32(seed: number): () => number {
  let x = seed | 0 || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // convert to [0,1)
    return ((x >>> 0) / 0xFFFFFFFF);
  };
}

export class RingBuffer<T> {
  private buf: Array<T | undefined>;
  private head = 0; // next write
  private tail = 0; // next read
  private _size = 0;
  constructor(private capacity: number) {
    if (capacity <= 0) throw new Error('capacity must be > 0');
    this.buf = new Array(capacity);
  }
  get size(): number { return this._size; }
  get isFull(): boolean { return this._size === this.capacity; }
  get isEmpty(): boolean { return this._size === 0; }
  push(item: T): boolean {
    if (this.isFull) return false;
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this._size++;
    return true;
  }
  pop(): T | undefined {
    if (this.isEmpty) return undefined;
    const item = this.buf[this.tail];
    this.buf[this.tail] = undefined;
    this.tail = (this.tail + 1) % this.capacity;
    this._size--;
    return item;
  }
  drain(max: number): T[] {
    const out: T[] = [];
    while (!this.isEmpty && out.length < max) {
      const v = this.pop();
      if (v !== undefined) out.push(v);
    }
    return out;
  }
}

export class TelemetryImpl implements Telemetry {
  private opts: Required<Omit<TelemetryOptions, 'adapter' | 'defaultCtx' | 'sampleSeed'>> & { defaultCtx?: TelemetryOptions['defaultCtx'], sampleSeed?: number };
  private adapter: TelemetryAdapter;
  private queue: RingBuffer<QEvent>;
  private dropped = 0;
  private sent = 0;
  private lastFlushTs: number | null = null;
  private timer: NodeJS.Timeout | null = null;
  private prng: () => number;
  private seq = 0;
  private latencies: number[] = [];

  constructor(options: TelemetryOptions) {
    this.adapter = options.adapter;
    this.opts = {
      sampleRate: options.sampleRate ?? 0,
      maxQueue: options.maxQueue ?? 1000,
      batchSize: options.batchSize ?? 50,
      flushIntervalMs: options.flushIntervalMs ?? 2000,
      onDrop: options.onDrop ?? (() => {}),
      enabled: options.enabled ?? false,
      defaultCtx: options.defaultCtx,
      sampleSeed: options.sampleSeed
    };
    this.queue = new RingBuffer<QEvent>(this.opts.maxQueue);
    const seed = (options.sampleSeed ?? Date.now()) & 0xffffffff;
    this.prng = xorshift32(seed);
    this.startTimer();
    // Best-effort flush on exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => { void this.flush(); });
    }
  }

  configure(opts: Partial<TelemetryOptions>): void {
    if (opts.adapter) this.adapter = opts.adapter;
    if (opts.sampleRate !== undefined) this.opts.sampleRate = opts.sampleRate;
    if (opts.maxQueue !== undefined) {
      // cannot resize ring easily without data loss; keep current for 4.1
      this.opts.maxQueue = opts.maxQueue;
    }
    if (opts.batchSize !== undefined) this.opts.batchSize = opts.batchSize;
    if (opts.flushIntervalMs !== undefined) {
      this.opts.flushIntervalMs = opts.flushIntervalMs;
      this.restartTimer();
    }
    if (opts.onDrop) this.opts.onDrop = opts.onDrop;
    if (opts.enabled !== undefined) this.opts.enabled = opts.enabled;
    if (opts.defaultCtx !== undefined) this.opts.defaultCtx = opts.defaultCtx;
  }

  emit<T extends string, P>(event: QEvent<T, P>): void {
    if (!this.opts.enabled) return;
    // Bernoulli sampling per event
    if (this.opts.sampleRate > 0 && this.prng() > this.opts.sampleRate) {
      this.dropped++;
      this.opts.onDrop('filter');
      return;
    }
    // Default ctx merging and seq
    const ctx = { ...this.opts.defaultCtx, ...event.ctx } as QEvent['ctx'];
    const enriched: QEvent = { ...event, ctx, meta: { ...(event.meta || {}), seq: this.seq++ } };
    if (!this.queue.push(enriched)) {
      this.dropped++;
      this.opts.onDrop('queue_full');
    }
  }

  async flush(): Promise<void> {
    if (this.queue.size === 0) { this.lastFlushTs = Date.now(); return; }
    const batch = this.queue.drain(this.opts.batchSize);
    if (batch.length === 0) { this.lastFlushTs = Date.now(); return; }
    try {
      const t0 = Date.now();
      await this.adapter.send(batch);
      const dt = Date.now() - t0;
      this.latencies.push(dt);
      if (this.latencies.length > 200) this.latencies.shift(); // cap memory
      this.sent += batch.length;
    } catch {
      // On adapter failure, drop silently for 4.1; could retry in 4.2
      this.dropped += batch.length;
    } finally {
      this.lastFlushTs = Date.now();
    }
  }

  private percentile(p: number): number | undefined {
    if (this.latencies.length === 0) return undefined;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
    return sorted[idx];
  }

  stats() {
    return {
      queued: this.queue.size,
      dropped: this.dropped,
      sent: this.sent,
      lastFlushTs: this.lastFlushTs,
      p50: this.percentile(50),
      p95: this.percentile(95)
    };
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => { void this.flush(); }, this.opts.flushIntervalMs);
    // Avoid keeping process alive
    if (this.timer && (this.timer as any).unref) (this.timer as any).unref();
  }
  private restartTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.startTimer();
  }

  async dispose(): Promise<void> {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    await this.flush();
    if (this.adapter.dispose) await this.adapter.dispose();
  }
}

// Built-in adapters
export class ConsoleAdapter implements TelemetryAdapter {
  configure(): void {}
  async send(batch: QEvent[]): Promise<void> {
    // Compact dev-friendly line per event
    const ts = new Date().toISOString();
    // Grouped for one flush call
    // eslint-disable-next-line no-console
    console.log(`[telemetry ${ts}]`, batch.map(e => ({ t: e.type, ts: e.ts, ctx: e.ctx, p: e.payload })));
  }
}

export interface FileAdapterOptions {
  path: string;
  rotateBytes?: number; // future
}
export class FileAdapter implements TelemetryAdapter {
  private stream: WriteStream;
  constructor(private opts: FileAdapterOptions) {
    this.stream = createWriteStream(opts.path, { flags: 'a' });
  }
  async send(batch: QEvent[]): Promise<void> {
    for (const e of batch) {
      this.stream.write(JSON.stringify(e) + '\n');
    }
  }
  async flush(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.stream.write('', (err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  async dispose(): Promise<void> { await this.flush(); this.stream.end(); }
}

export function createTelemetryAdapter(kind: 'console' | 'file', opts?: any): TelemetryAdapter {
  switch (kind) {
    case 'console': return new ConsoleAdapter();
    case 'file': return new FileAdapter({ path: opts?.path || 'qnce-telemetry.ndjson' });
    default: throw new Error(`Unknown adapter: ${kind}`);
  }
}

export function createTelemetry(options: TelemetryOptions): Telemetry {
  return new TelemetryImpl(options);
}
