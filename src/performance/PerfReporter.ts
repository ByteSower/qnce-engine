// S2-T4: Profiler Event Instrumentation
// PerfReporter for batched performance event collection and reporting

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
}

/**
 * PerfReporter - Batched performance event collection and analysis
 * Designed to work off main thread for minimal performance impact
 */
export class PerfReporter {
  private events: PerfEvent[] = [];
  private config: PerfReporterConfig;
  private flushTimer: any = null;
  private startTime: number;
  private activeSpans: Map<string, PerfEvent> = new Map();

  constructor(config: Partial<PerfReporterConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      enableBackgroundFlush: config.enableBackgroundFlush !== false,
      maxEventHistory: config.maxEventHistory || 1000,
      enableConsoleOutput: config.enableConsoleOutput || false
    };

    this.startTime = performance.now();
    
    if (this.config.enableBackgroundFlush) {
      this.startFlushTimer();
    }
  }

  /**
   * Record a performance event
   */
  record(
    type: PerfEvent['type'], 
    metadata: Record<string, unknown> = {}, 
    category: PerfEvent['category'] = 'engine'
  ): string {
    const event: PerfEvent = {
      id: this.generateEventId(),
      type,
      timestamp: performance.now(),
      metadata,
      category
    };

    this.events.push(event);
    
    if (this.config.enableConsoleOutput) {
      console.log(`[PERF] ${type}:`, metadata);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }

    return event.id;
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
      console.warn(`[PERF] Span ${spanId} not found`);
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

    this.events.push(completeEvent);
    this.activeSpans.delete(spanId);

    if (this.config.enableConsoleOutput) {
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
    let hotReloads: number[] = [];

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
    if (this.events.length === 0) return;

    // TODO: Body - integrate with ThreadPool for background processing
    // For now, just maintain event history with size limit
    if (this.events.length > this.config.maxEventHistory) {
      const excess = this.events.length - this.config.maxEventHistory;
      this.events.splice(0, excess);
    }

    if (this.config.enableConsoleOutput) {
      console.log(`[PERF] Flushed ${this.events.length} events`);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
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

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
