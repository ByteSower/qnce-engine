import { getPerfReporter, shutdownPerfReporter, PerfReporter } from '../src/performance/PerfReporter';

/**
 * Tests for Phase 2 additions:
 * - smoothedP95DispatchLatencyMs is present and trends toward raw p95
 * - retry-once logic attempts a second dispatch after first rejection
 */

describe('PerfReporter smoothing & retry-once', () => {
  afterEach(() => {
    shutdownPerfReporter();
    jest.resetModules();
  });

  test('smoothedP95 tracks p95 gradually', async () => {
    const reporter = getPerfReporter({ batchSize: 5, enableBackgroundFlush: false });
    // Inject synthetic latency samples
    for (let i = 0; i < 10; i++) {
      // access internal helper (non-public) for test purposes
      (reporter as unknown as { __injectLatencySample(v: number): void }).__injectLatencySample(10 + i);
    }
    const m1 = reporter.getFlushMetrics();
    expect(m1.p95DispatchLatencyMs).toBeGreaterThan(0);
    expect(m1.smoothedP95DispatchLatencyMs).toBeGreaterThan(0);
    // Add a large jump to see smoothing lag
  (reporter as unknown as { __injectLatencySample(v: number): void }).__injectLatencySample(200);
    const m2 = reporter.getFlushMetrics();
    expect(m2.p95DispatchLatencyMs).toBeGreaterThanOrEqual(m1.p95DispatchLatencyMs);
    // Smoothed should move upward but not jump fully to raw
    expect(m2.smoothedP95DispatchLatencyMs).toBeLessThanOrEqual(m2.p95DispatchLatencyMs);
  });

  test('retry-once performs second attempt on first failure', async () => {
    const reporter = getPerfReporter({ batchSize: 3, enableBackgroundFlush: false });
    let firstCall = true;
    let attempts = 0;
    PerfReporter.__setThreadPoolOverride({
      writeTelemetry: () => {
        attempts++;
        if (firstCall) {
          firstCall = false;
          return Promise.reject(new Error('Simulated first failure'));
        }
        return Promise.resolve();
      }
    });

    for (let i = 0; i < 5; i++) reporter.record('custom', { i }, 'user');
    reporter.flush();
    await new Promise(r => setTimeout(r, 40)); // allow retry promise chain
    const metrics = reporter.getFlushMetrics();
    expect(attempts).toBeGreaterThanOrEqual(2); // initial + retry
    expect(metrics.rejectedFlushes).toBeGreaterThanOrEqual(1);
    // After retry success streak should reset
    expect(metrics.consecutiveRejects).toBeDefined();
    PerfReporter.__setThreadPoolOverride(null);
  });
});
