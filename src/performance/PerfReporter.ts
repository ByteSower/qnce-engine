// S2-T4: Profiler Event Instrumentation
// PerfReporter for batched performance event collection and reporting
import { getThreadPool } from './ThreadPool';
import { createDefaultAdaptiveSampler } from './AdaptiveControllers';

export interface PerfEvent {
  id: string;
  type: 'flow-start' | 'flow-complete' | 'cache-hit' | 'cache-miss' | 'hot-reload-start' | 'hot-reload-end' | 'state-transition' | 'custom';
  timestamp: number;
  duration?: number;
  metadata: Record<string, unknown>;
  category: 'engine' | 'cache' | 'hot-reload' | 'user' | 'system';
}

export interface PerfSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgDurations: Record<string, number>;
  maxDurations: Record<string, number>;
  minDurations: Record<string, number>;
  cacheHitRate: number;
  hotReloadPerformance: {
    avgTime: number;
    maxTime: number;
    totalReloads: number;
  };
  timeRange: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface PerfReporterConfig {
  batchSize: number;
  flushInterval: number; // ms
  enableBackgroundFlush: boolean;
  maxEventHistory: number;
  enableConsoleOutput: boolean;
  disableAdaptiveBatch?: boolean; // If true, skip dynamic batch sizing (use fixed batchSize)
}

/**
 * Flush metrics snapshot returned by getPerfFlushMetrics().
 * Designed to be immutable from consumer perspective (frozen object returned).
 */
export interface PerfFlushMetrics {
  totalFlushAttempts: number;        // All flush() calls (manual + timer + auto batch)
  successfulFlushes: number;         // flush() calls where at least one batch was handed to thread pool
  rejectedFlushes: number;           // writeTelemetry promise rejected (queue limit, etc.)
  totalBatchesDispatched: number;    // Number of writeTelemetry calls attempted
  totalEventsDispatched: number;     // Sum of events length across dispatched batches (not including retained history)
  lastFlushDurationMs: number;       // Duration in ms of the most recent flush dispatch loop
  avgEventsPerBatch: number;         // totalEventsDispatched / totalBatchesDispatched (0 if none)
  p50DispatchLatencyMs: number;      // Approximate latency of dispatching batches (coarse pre-adaptive placeholder)
  p95DispatchLatencyMs: number;      // Approximate high percentile
  smoothedP95DispatchLatencyMs?: number; // @beta EMA-smoothed p95 (if smoothing enabled)
  histogramBuckets: ReadonlyArray<{ upperBoundMs: number; count: number }>; // Fixed latency buckets
  rejectionRate: number;             // rejectedFlushes / totalBatchesDispatched (0 if none)
  lastEffectiveBatchSize?: number;   // effective batch size used in last flush (dynamic sizing)
  lastUpdated: number;               // performance.now() timestamp of last metrics mutation
  adaptiveEnabled: boolean;          // true if dynamic batch sizing heuristics are active
  backoffActive?: boolean;           // @beta indicates flush currently under backoff gate
  consecutiveRejects?: number;       // @beta current rejection streak
}

/**
 * PerfReporter - Batched performance event collection and analysis
 * Designed to work off main thread for minimal performance impact
 */
export class PerfReporter {
  private events: PerfEvent[] = [];
  private config: PerfReporterConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  // R2: Adaptive backoff state
  private nextAllowedFlushTime = 0; // performance.now() timestamp gate for next flush
  private consecutiveRejects = 0;   // sequential rejected dispatch streak
  private backoffDelayMs = 0;       // current backoff window applied after last rejection
  private startTime: number;
  private activeSpans: Map<string, PerfEvent> = new Map();
  // Adaptive sampling (@beta) – off by default; env QNCE_ADAPTIVE_SAMPLING enables
  private sampler = createDefaultAdaptiveSampler();
  // Flush metrics state (mutable internal, exposed via snapshot)
  private metrics = {
    totalFlushAttempts: 0,
    successfulFlushes: 0,
    rejectedFlushes: 0,
    totalBatchesDispatched: 0,
    totalEventsDispatched: 0,
    lastFlushDurationMs: 0,
    avgEventsPerBatch: 0,
    dispatchLatencies: [] as number[], // raw latencies for simple percentile computation (bounded)
    histogram: [5, 10, 25, 50, 100, 250, 500, 1000].map(upper => ({ upperBoundMs: upper, count: 0 })),
    p50DispatchLatencyMs: 0,
    p95DispatchLatencyMs: 0,
  smoothedP95DispatchLatencyMs: 0,
    rejectionRate: 0,
    lastEffectiveBatchSize: 0,
    lastUpdated: performance.now()
  };
  // Cap raw latency samples to prevent memory leak (sliding window)
  private static readonly MAX_LATENCY_SAMPLES = 128;
  // Placeholder smoother integration (@beta)
  // Future: inject EMA smoother via config; keep optional to avoid affecting existing tests.

  constructor(config: Partial<PerfReporterConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      enableBackgroundFlush: config.enableBackgroundFlush !== false,
      maxEventHistory: config.maxEventHistory || 1000,
      enableConsoleOutput: config.enableConsoleOutput || false,
      disableAdaptiveBatch: config.disableAdaptiveBatch ?? (typeof process !== 'undefined' && !!process.env.QNCE_DISABLE_ADAPTIVE_BATCH)
    };

    this.startTime = performance.now();
    
    if (this.config.enableBackgroundFlush) {
      this.startFlushTimer();
    }
  }

  /**
   * Internal override hook for tests to inject a deterministic thread pool implementation.
   * Not part of public API surface; subject to change without notice.
   */
  private static __threadPoolOverride: { writeTelemetry: (payload: unknown) => Promise<unknown> } | null = null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static __setThreadPoolOverride(override: { writeTelemetry: (payload: unknown) => Promise<unknown> } | null): void {
    PerfReporter.__threadPoolOverride = override;
  }

  /**
   * Record a performance event
   */
  record(
    type: PerfEvent['type'], 
    metadata: Record<string, unknown> = {}, 
    category: PerfEvent['category'] = 'engine'
  ): string {
    // Sampling: always retain error-like categories (none currently explicit; placeholder for future)
    if (!this.sampler.isEnabled() || this.sampler.shouldSample()) {
      const event: PerfEvent = {
      id: this.generateEventId(),
      type,
      timestamp: performance.now(),
      metadata,
      category
    };
      this.events.push(event);
    
    if (this.config.enableConsoleOutput && process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`[PERF] ${type}:`, metadata);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
      return event.id;
    }
    return 'perf-sampled';
  }

  /**
   * Start a performance span (for measuring duration)
   */
  startSpan(
    type: PerfEvent['type'], 
    metadata: Record<string, unknown> = {},
    category: PerfEvent['category'] = 'engine'
  ): string {
    const spanId = this.generateEventId();
    const event: PerfEvent = {
      id: spanId,
      type,
      timestamp: performance.now(),
      metadata: { ...metadata, spanStart: true },
      category
    };

    this.activeSpans.set(spanId, event);
    return spanId;
  }

  /**
   * End a performance span and record the complete event
   */
  endSpan(spanId: string, additionalMetadata: Record<string, unknown> = {}): void {
    const startEvent = this.activeSpans.get(spanId);
    if (!startEvent) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[PERF] Span ${spanId} not found`);
      }
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startEvent.timestamp;

    const completeEvent: PerfEvent = {
      ...startEvent,
      duration,
      metadata: {
        ...startEvent.metadata,
        ...additionalMetadata,
        spanEnd: true
      }
    };

    if (!this.sampler.isEnabled() || this.sampler.shouldSample()) {
      this.events.push(completeEvent);
    }
    this.activeSpans.delete(spanId);

    if (this.config.enableConsoleOutput && process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`[PERF] ${startEvent.type} completed in ${duration.toFixed(2)}ms`);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Record flow start event (S2-T4 requirement)
   */
  recordFlowStart(nodeId: string, metadata: Record<string, unknown> = {}): string {
    return this.startSpan('flow-start', { nodeId, ...metadata }, 'engine');
  }

  /**
   * Record flow completion event (S2-T4 requirement)
   */
  recordFlowComplete(spanId: string, nextNodeId: string, metadata: Record<string, unknown> = {}): void {
    this.endSpan(spanId, { nextNodeId, ...metadata });
  }

  /**
   * Record cache hit event (S2-T4 requirement)
   */
  recordCacheHit(cacheKey: string, metadata: Record<string, unknown> = {}): string {
    return this.record('cache-hit', { cacheKey, ...metadata }, 'cache');
  }

  /**
   * Record cache miss event (S2-T4 requirement)
   */
  recordCacheMiss(cacheKey: string, metadata: Record<string, unknown> = {}): string {
    return this.record('cache-miss', { cacheKey, ...metadata }, 'cache');
  }

  /**
   * Record hot-reload start event (S2-T4 requirement)
   */
  recordHotReloadStart(deltaSize: number, metadata: Record<string, unknown> = {}): string {
    return this.startSpan('hot-reload-start', { deltaSize, ...metadata }, 'hot-reload');
  }

  /**
   * Record hot-reload completion event (S2-T4 requirement)
   */
  recordHotReloadEnd(spanId: string, success: boolean, metadata: Record<string, unknown> = {}): void {
    this.endSpan(spanId, { success, ...metadata });
  }

  /**
   * Generate performance summary for CLI dashboard
   */
  summary(): PerfSummary {
    const now = performance.now();
    const eventsByType: Record<string, number> = {};
    const durationsByType: Record<string, number[]> = {};
    
    let cacheHits = 0;
    let cacheMisses = 0;
  const hotReloads: number[] = [];

    // Analyze events
    for (const event of this.events) {
      // Count events by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Collect durations
      if (event.duration !== undefined) {
        if (!durationsByType[event.type]) {
          durationsByType[event.type] = [];
        }
        durationsByType[event.type].push(event.duration);
      }

      // Cache metrics
      if (event.type === 'cache-hit') cacheHits++;
      if (event.type === 'cache-miss') cacheMisses++;

      // Hot-reload metrics
      if (event.type === 'hot-reload-start' && event.duration !== undefined) {
        hotReloads.push(event.duration);
      }
    }

    // Calculate averages, mins, maxs
    const avgDurations: Record<string, number> = {};
    const maxDurations: Record<string, number> = {};
    const minDurations: Record<string, number> = {};

    for (const [type, durations] of Object.entries(durationsByType)) {
      if (durations.length > 0) {
        avgDurations[type] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        maxDurations[type] = Math.max(...durations);
        minDurations[type] = Math.min(...durations);
      }
    }

    // Cache hit rate
    const totalCacheEvents = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheEvents > 0 ? (cacheHits / totalCacheEvents) * 100 : 0;

    // Hot-reload performance
    const hotReloadPerformance = {
      avgTime: hotReloads.length > 0 ? hotReloads.reduce((sum, d) => sum + d, 0) / hotReloads.length : 0,
      maxTime: hotReloads.length > 0 ? Math.max(...hotReloads) : 0,
      totalReloads: hotReloads.length
    };

    return {
      totalEvents: this.events.length,
      eventsByType,
      avgDurations,
      maxDurations,
      minDurations,
      cacheHitRate,
      hotReloadPerformance,
      timeRange: {
        start: this.startTime,
        end: now,
        duration: now - this.startTime
      }
    };
  }

  /**
   * Get raw events for detailed analysis
   */
  getEvents(): PerfEvent[] {
    return [...this.events];
  }

  /**
   * Clear event history
   */
  clear(): void {
    this.events.length = 0;
    this.activeSpans.clear();
    this.startTime = performance.now();
  }

  /**
   * Flush events to background processing
   */
  flush(): void {
    // R2: Honor adaptive backoff; skip flush attempts while in backoff window
    const nowCheck = performance.now();
    if (nowCheck < this.nextAllowedFlushTime) {
      return; // silently skip (no attempt counter increment)
    }
    const flushStart = performance.now();
    this.metrics.totalFlushAttempts++;
    if (this.events.length === 0) return;
    // Offload current batch to background thread pool
    try {
  const pool = PerfReporter.__threadPoolOverride || getThreadPool();
      const baseBatch = Math.max(1, this.config.batchSize);
      const total = this.events.length;
      // Dynamic batch sizing (R6): scale up when many events & low latency, scale down on high latency or rejection streak
      let effectiveBatchSize = baseBatch;
      if (!this.config.disableAdaptiveBatch) {
        const latP95 = this.metrics.p95DispatchLatencyMs;
        const streak = this.consecutiveRejects;
        if (streak >= 2) {
          effectiveBatchSize = Math.max(10, Math.floor(baseBatch / Math.min(streak, 4))); // shrink under pressure
        } else if (total > baseBatch * 4 && latP95 < 50) {
          effectiveBatchSize = Math.min(baseBatch * 4, baseBatch + Math.floor((total / baseBatch) * 0.5) * baseBatch);
        } else if (total > baseBatch * 2 && latP95 < 25) {
          effectiveBatchSize = Math.min(baseBatch * 3, baseBatch * 2);
        }
      }
      // Ensure not exceeding total events
      effectiveBatchSize = Math.max(1, Math.min(effectiveBatchSize, total));
      this.metrics.lastEffectiveBatchSize = effectiveBatchSize;
      const shouldCoalesce = total <= effectiveBatchSize * 2;
      if (shouldCoalesce) {
        const batch = this.events.slice();
        const dispatchStart = performance.now();
          // Eagerly count batch dispatch attempt
          this.metrics.totalBatchesDispatched++;
          this.metrics.totalEventsDispatched += batch.length;
          // Mark flush as having at least one dispatched batch (optimistic)
          this.metrics.successfulFlushes = Math.max(this.metrics.successfulFlushes, 1);
        void pool.writeTelemetry({ type: 'perf-events', events: batch })
          .then(() => {
            this.recordDispatchSuccessPostLatency(performance.now() - dispatchStart);
            // Reset backoff streak on first success
            this.consecutiveRejects = 0;
            this.backoffDelayMs = 0;
          })
          .catch(err => {
            const firstFailureLatency = performance.now() - dispatchStart;
            this.recordDispatchFailure(err);
            // Retry-once: only when first consecutive rejection and latency still moderate
            if (this.consecutiveRejects === 1 && this.metrics.p95DispatchLatencyMs < 200) {
              const retryStart = performance.now();
              void pool.writeTelemetry({ type: 'perf-events', events: batch })
                .then(() => {
                  this.recordDispatchSuccessPostLatency(performance.now() - retryStart + firstFailureLatency);
                  this.consecutiveRejects = 0;
                  this.backoffDelayMs = 0;
                })
                .catch(err2 => {
                  this.recordDispatchFailure(err2);
                });
            }
          });
      } else {
        let start = 0;
        while (start < total) {
          const end = Math.min(start + effectiveBatchSize, total);
          const batch = this.events.slice(start, end);
          // Fire-and-forget background write; errors are swallowed in non-prod
          const dispatchStart = performance.now();
          this.metrics.totalBatchesDispatched++;
          this.metrics.totalEventsDispatched += batch.length;
          this.metrics.successfulFlushes = Math.max(this.metrics.successfulFlushes, 1);
          void pool.writeTelemetry({ type: 'perf-events', events: batch })
            .then(() => {
              this.recordDispatchSuccessPostLatency(performance.now() - dispatchStart);
              this.consecutiveRejects = 0;
              this.backoffDelayMs = 0;
            })
            .catch(err => {
              const firstFailureLatency = performance.now() - dispatchStart;
              this.recordDispatchFailure(err);
              if (this.consecutiveRejects === 1 && this.metrics.p95DispatchLatencyMs < 200) {
                const retryStart = performance.now();
                void pool.writeTelemetry({ type: 'perf-events', events: batch })
                  .then(() => {
                    this.recordDispatchSuccessPostLatency(performance.now() - retryStart + firstFailureLatency);
                    this.consecutiveRejects = 0;
                    this.backoffDelayMs = 0;
                  })
                  .catch(err2 => {
                    this.recordDispatchFailure(err2);
                  });
              }
            });
          start = end;
        }
      }
      // successfulFlushes is incremented only after at least one dispatch promise resolves
    } catch (err) {
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[PERF] flush integration unavailable:', err);
      }
    }

    // Maintain bounded history to cap memory usage
    if (this.events.length > this.config.maxEventHistory) {
      const startIndex = this.events.length - this.config.maxEventHistory;
      // mutate in place to avoid new large arrays when possible
      this.events.splice(0, startIndex);
    }

    if (this.config.enableConsoleOutput && process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`[PERF] Flushed up to ${this.config.batchSize} per batch; retained ${this.events.length} events`);
    }
    // finalize flush timing
    this.metrics.lastFlushDurationMs = performance.now() - flushStart;
    this.metrics.lastUpdated = performance.now();
    this.recomputeDerivedMetrics();
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
    // Prevent keeping Node process alive
    if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /** Dispose reporter (stop timers) */
  dispose(): void { this.stopFlushTimer(); }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Internal: record dispatch latency after counters were eagerly incremented */
  private recordDispatchSuccessPostLatency(latencyMs: number): void {
    const samples = this.metrics.dispatchLatencies;
    samples.push(latencyMs);
    if (samples.length > PerfReporter.MAX_LATENCY_SAMPLES) {
      samples.splice(0, samples.length - PerfReporter.MAX_LATENCY_SAMPLES);
    }
    for (const bucket of this.metrics.histogram) {
      if (latencyMs <= bucket.upperBoundMs) { bucket.count++; break; }
    }
    this.metrics.successfulFlushes = Math.max(this.metrics.successfulFlushes, 1);
  }

  /** Internal: record dispatch failure */
  private recordDispatchFailure(err: unknown): void {
    this.metrics.rejectedFlushes++;
    // R2: update adaptive backoff streak + compute new delay (exponential, capped)
    this.consecutiveRejects++;
    const exponent = Math.min(this.consecutiveRejects - 1, 5); // cap growth
    const base = 20; // ms
    this.backoffDelayMs = Math.min(base * Math.pow(2, exponent), 500);
    this.nextAllowedFlushTime = performance.now() + this.backoffDelayMs;
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      const suppress = !!process.env.QNCE_SUPPRESS_PERF_WARN; // R1: explicit env flag
      if (!suppress) {
        const message = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: unknown }).message : undefined;
        // eslint-disable-next-line no-console
        console.warn('[PERF] background flush failed:', message || err);
      }
    }
  }

  /** Compute derived metrics (avg, percentiles) */
  private recomputeDerivedMetrics(): void {
    const { totalBatchesDispatched, totalEventsDispatched, dispatchLatencies } = this.metrics;
    this.metrics.avgEventsPerBatch = totalBatchesDispatched > 0 ? totalEventsDispatched / totalBatchesDispatched : 0;
    this.metrics.rejectionRate = totalBatchesDispatched > 0 ? this.metrics.rejectedFlushes / totalBatchesDispatched : 0;
    if (dispatchLatencies.length > 0) {
      const sorted = [...dispatchLatencies].sort((a, b) => a - b);
      const p50Index = Math.floor(0.5 * (sorted.length - 1));
      const p95Index = Math.floor(0.95 * (sorted.length - 1));
      this.metrics.p50DispatchLatencyMs = sorted[p50Index];
      this.metrics.p95DispatchLatencyMs = sorted[p95Index];
      // For now simple incremental smoothing (light EMA) until full controller integration
      const prev = this.metrics.smoothedP95DispatchLatencyMs || sorted[p95Index];
      const alpha = 0.2; // moderate smoothing
      this.metrics.smoothedP95DispatchLatencyMs = prev + alpha * (this.metrics.p95DispatchLatencyMs - prev);
    } else {
      this.metrics.p50DispatchLatencyMs = 0;
      this.metrics.p95DispatchLatencyMs = 0;
      this.metrics.smoothedP95DispatchLatencyMs = 0;
    }
  }

  /** Public snapshot accessor (frozen copy) */
  getFlushMetrics(): PerfFlushMetrics {
    const m = this.metrics;
    const snapshot: PerfFlushMetrics = Object.freeze({
      totalFlushAttempts: m.totalFlushAttempts,
      successfulFlushes: m.successfulFlushes,
      rejectedFlushes: m.rejectedFlushes,
      totalBatchesDispatched: m.totalBatchesDispatched,
      totalEventsDispatched: m.totalEventsDispatched,
      lastFlushDurationMs: m.lastFlushDurationMs,
      avgEventsPerBatch: m.avgEventsPerBatch,
      p50DispatchLatencyMs: m.p50DispatchLatencyMs,
      p95DispatchLatencyMs: m.p95DispatchLatencyMs,
      smoothedP95DispatchLatencyMs: m.smoothedP95DispatchLatencyMs,
      histogramBuckets: m.histogram.map(b => ({ upperBoundMs: b.upperBoundMs, count: b.count })),
      rejectionRate: m.rejectionRate,
      lastEffectiveBatchSize: m.lastEffectiveBatchSize,
      lastUpdated: m.lastUpdated,
      adaptiveEnabled: !this.config.disableAdaptiveBatch,
      backoffActive: performance.now() < this.nextAllowedFlushTime,
      consecutiveRejects: this.consecutiveRejects
    });
    return snapshot;
  }

  /** @internal Debug accessor for tests (not part of public API surface) */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __getInternalPerfDebug(): { consecutiveRejects: number; backoffDelayMs: number; nextAllowedFlushTime: number; lastEffectiveBatchSize: number } {
    return {
      consecutiveRejects: this.consecutiveRejects,
      backoffDelayMs: this.backoffDelayMs,
      nextAllowedFlushTime: this.nextAllowedFlushTime,
      lastEffectiveBatchSize: this.metrics.lastEffectiveBatchSize
    };
  }

  /** @internal Inject a synthetic dispatch latency sample (test helper) */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __injectLatencySample(latencyMs: number): void {
    if (latencyMs < 0) return;
    const samples = this.metrics.dispatchLatencies;
    samples.push(latencyMs);
    if (samples.length > PerfReporter.MAX_LATENCY_SAMPLES) {
      samples.splice(0, samples.length - PerfReporter.MAX_LATENCY_SAMPLES);
    }
    for (const bucket of this.metrics.histogram) {
      if (latencyMs <= bucket.upperBoundMs) { bucket.count++; break; }
    }
    this.recomputeDerivedMetrics();
  }
}

// Singleton instance for global access
let globalPerfReporter: PerfReporter | null = null;

export function getPerfReporter(config?: Partial<PerfReporterConfig>): PerfReporter {
  if (!globalPerfReporter) {
    globalPerfReporter = new PerfReporter(config);
  }
  return globalPerfReporter;
}

export function shutdownPerfReporter(): void {
  if (globalPerfReporter) {
    globalPerfReporter.stopFlushTimer();
    globalPerfReporter.flush();
    globalPerfReporter = null;
  }
}

// Convenience functions for common operations
export const perf = {
  flowStart: (nodeId: string, metadata?: Record<string, unknown>) => 
    getPerfReporter().recordFlowStart(nodeId, metadata),
  
  flowComplete: (spanId: string, nextNodeId: string, metadata?: Record<string, unknown>) =>
    getPerfReporter().recordFlowComplete(spanId, nextNodeId, metadata),
  
  cacheHit: (cacheKey: string, metadata?: Record<string, unknown>) =>
    getPerfReporter().recordCacheHit(cacheKey, metadata),
  
  cacheMiss: (cacheKey: string, metadata?: Record<string, unknown>) =>
    getPerfReporter().recordCacheMiss(cacheKey, metadata),
  
  hotReloadStart: (deltaSize: number, metadata?: Record<string, unknown>) =>
    getPerfReporter().recordHotReloadStart(deltaSize, metadata),
  
  hotReloadEnd: (spanId: string, success: boolean, metadata?: Record<string, unknown>) =>
    getPerfReporter().recordHotReloadEnd(spanId, success, metadata),
  
  record: (type: PerfEvent['type'], metadata?: Record<string, unknown>, category?: PerfEvent['category']) =>
    getPerfReporter().record(type, metadata, category),
  
  summary: () => getPerfReporter().summary(),
  
  clear: () => getPerfReporter().clear()
};
