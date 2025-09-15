// Telemetry Types and Interfaces (Sprint 4.1)

/**
 * Environment identifier for telemetry context
 * @beta
 * @experimental
 */
export type Env = 'dev' | 'test' | 'prod';

/**
 * Generic telemetry event shape emitted by the engine
 * @beta
 * @experimental
 */
export interface QEvent<T extends string = string, P = unknown> {
  type: T;
  payload: P;
  ts: number; // epoch ms
  ctx: {
    sessionId: string;
    storyId?: string;
    appVersion?: string;
    engineVersion: string;
    env?: Env;
  };
  meta?: {
    seq?: number;
    source?: 'engine' | 'cli' | 'ui';
  };
}

/**
 * Adapter contract for delivering batched telemetry events
 * @beta
 * @experimental
 */
export interface TelemetryAdapter {
  configure?(opts: Record<string, unknown>): void;
  send(batch: QEvent[]): Promise<void>;
  flush?(): Promise<void>;
  dispose?(): Promise<void>;
}

/**
 * Configuration options for telemetry system
 * @beta
 * @experimental
 */
export interface TelemetryOptions {
  adapter: TelemetryAdapter;
  sampleRate?: number;          // 0..1
  maxQueue?: number;            // default 1000
  batchSize?: number;           // default 50
  flushIntervalMs?: number;     // default 2000
  onDrop?: (reason: 'queue_full' | 'filter') => void;
  enabled?: boolean;            // default false
  defaultCtx?: Partial<QEvent['ctx']>; // appVersion, engineVersion, env, storyId
  sampleSeed?: number;          // for deterministic sampling in tests
  /** Overflow strategy when queue is full (default 'drop') */
  overflowStrategy?: 'drop' | 'drop-oldest' | 'error';
}

/**
 * Public telemetry facade used by engine and consumers
 * @beta
 * @experimental
 */
export interface Telemetry {
  configure(opts: Partial<TelemetryOptions>): void;
  emit<T extends string, P>(event: QEvent<T, P>): void;
  flush(): Promise<void>;
  stats(): { queued: number; dropped: number; sent: number; lastFlushTs: number | null; p50?: number; p95?: number };
  dispose(): Promise<void>;
}
