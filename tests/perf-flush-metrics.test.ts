import { getPerfReporter } from '../src/performance/PerfReporter';

describe('PerfReporter flush metrics', () => {
  test('increments counters on successful flush', async () => {
    const reporter = getPerfReporter({ batchSize: 5, enableBackgroundFlush: false });
    // record 7 events -> triggers manual flush
    for (let i = 0; i < 7; i++) {
      reporter.record('custom', { i }, 'user');
    }
    reporter.flush();
    // allow background promises to settle
  await new Promise(r => setTimeout(r, 30));
    const metrics = reporter.getFlushMetrics();
    expect(metrics.totalFlushAttempts).toBeGreaterThan(0);
    expect(metrics.totalBatchesDispatched).toBeGreaterThan(0);
    expect(metrics.totalEventsDispatched).toBeGreaterThan(0);
    expect(metrics.successfulFlushes).toBeGreaterThan(0);
    expect(metrics.rejectedFlushes).toBeGreaterThanOrEqual(0);
    expect(metrics.rejectionRate).toBeGreaterThanOrEqual(0);
    expect(metrics.rejectionRate).toBeLessThanOrEqual(1);
    expect(metrics.lastEffectiveBatchSize).toBeGreaterThan(0);
  });

  test('latency percentiles and histogram shape', async () => {
    const reporter = getPerfReporter({ batchSize: 2, enableBackgroundFlush: false });
    for (let i = 0; i < 6; i++) {
      reporter.record('custom', { i }, 'user');
    }
    reporter.flush();
  await new Promise(r => setTimeout(r, 30));
    const metrics = reporter.getFlushMetrics();
    expect(metrics.histogramBuckets.length).toBeGreaterThan(0);
    expect(metrics.p50DispatchLatencyMs).toBeGreaterThanOrEqual(0);
    expect(metrics.p95DispatchLatencyMs).toBeGreaterThanOrEqual(metrics.p50DispatchLatencyMs);
    expect(metrics.rejectionRate).toBeGreaterThanOrEqual(0);
    expect(metrics.lastEffectiveBatchSize).toBeGreaterThan(0);
  });
});
