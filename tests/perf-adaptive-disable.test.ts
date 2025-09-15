// Import types indirectly if needed (no direct usage to avoid unused warning)

/**
 * Tests for adaptive batch disable flag & high-latency no-upscale behavior.
 */

describe('PerfReporter adaptive disable & high latency behavior', () => {
  interface InternalReporter {
    flush(): void;
    getFlushMetrics(): { lastEffectiveBatchSize?: number; adaptiveEnabled: boolean };
  }
  // Extended shape for test-only access
  interface InternalReporterExtended extends InternalReporter {
    events: Array<{ id: string; type: string; timestamp: number; metadata: Record<string, unknown>; category: string }>;
    __injectLatencySample?(ms: number): void;
  }

  function createReporter(opts?: { disableAdaptive?: boolean; base?: number }): InternalReporterExtended {
    // Force new instance isolation by shutting down any existing and recreating via direct ctor
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { shutdownPerfReporter } = require('../src/performance/PerfReporter');
    shutdownPerfReporter();
    // Access class directly to pass config (avoid global caching logic)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PerfReporter } = require('../src/performance/PerfReporter');
    return new PerfReporter({ batchSize: opts?.base ?? 50, disableAdaptiveBatch: opts?.disableAdaptive, enableBackgroundFlush: false });
  }

  test('disables dynamic sizing when disableAdaptiveBatch=true', () => {
    const reporter = createReporter({ disableAdaptive: true, base: 40 });
    // Inject artificial events > multiple of base to trigger potential upscale if active
  (reporter as InternalReporterExtended).events = Array.from({ length: 400 }, (_, i) => ({ id: `e${i}`, type: 'custom', timestamp: performance.now(), metadata: {}, category: 'user' }));
    reporter.flush();
    const metrics = reporter.getFlushMetrics();
    expect(metrics.lastEffectiveBatchSize).toBe(40); // should remain base batch size
    expect(metrics.adaptiveEnabled).toBe(false);
  });

  test('does not upscale when p95 latency is high (simulate by injecting samples)', () => {
    const reporter = createReporter({ base: 30 });
    // High latency samples
  (reporter as InternalReporterExtended).__injectLatencySample?.(120);
  (reporter as InternalReporterExtended).__injectLatencySample?.(140);
    // Add many events to try to trigger upscale path
  (reporter as InternalReporterExtended).events = Array.from({ length: 300 }, (_, i) => ({ id: `e${i}`, type: 'custom', timestamp: performance.now(), metadata: {}, category: 'user' }));
    reporter.flush();
    const metrics = reporter.getFlushMetrics();
    // Should not exceed base*1 when latency p95 > thresholds (50 / 25)
    expect(metrics.lastEffectiveBatchSize).toBeLessThanOrEqual(30);
    expect(metrics.adaptiveEnabled).toBe(true);
  });
});
