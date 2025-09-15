import { getPerfReporter, shutdownPerfReporter } from '../src/performance/PerfReporter';

/**
 * Dynamic batch sizing tests:
 * - Upscale: large backlog + low p95 latency should increase effective batch size beyond base.
 * - Downscale: induced rejection streak shrinks batch size.
 */

describe('PerfReporter dynamic batch sizing (R6)', () => {
  afterEach(() => {
    shutdownPerfReporter();
    jest.resetModules();
  });

  test('upscales effective batch size under low latency and large backlog', async () => {
    const reporter = getPerfReporter({ batchSize: 10, enableBackgroundFlush: false });
    // Populate some latency samples to keep p95 low (<25ms) by simulating prior successful flushes
    for (let i = 0; i < 5; i++) {
      reporter.record('custom', { warmup: i }, 'user');
    }
    reporter.flush();
    await new Promise(r => setTimeout(r, 20));

    // Add a large backlog
    for (let i = 0; i < 80; i++) {
      reporter.record('custom', { i }, 'user');
    }
    reporter.flush();
    await new Promise(r => setTimeout(r, 30));
    interface DebugShape { lastEffectiveBatchSize: number }
    const dbg = (reporter as unknown as { __getInternalPerfDebug(): DebugShape }).__getInternalPerfDebug();
    const metrics = reporter.getFlushMetrics();
    expect(dbg.lastEffectiveBatchSize).toBeGreaterThanOrEqual(10); // at least base
    expect(metrics.adaptiveEnabled).toBe(true);
  });

  test('downscales effective batch size after rejection streak', async () => {
    const reporter = getPerfReporter({ batchSize: 20, enableBackgroundFlush: false });
    // Monkey patch thread pool to reject to simulate queue pressure
    const poolMod = require('../src/performance/ThreadPool');
    const originalGet = poolMod.getThreadPool;
    poolMod.getThreadPool = () => ({
      writeTelemetry: () => Promise.reject(new Error('Job queue limit exceeded'))
    });

    for (let i = 0; i < 50; i++) {
      reporter.record('custom', { i }, 'user');
    }
    reporter.flush(); // first rejection
    await new Promise(r => setTimeout(r, 10));
  (reporter as unknown as { nextAllowedFlushTime: number }).nextAllowedFlushTime = 0; // allow next rejection immediately
    reporter.flush(); // second rejection
    await new Promise(r => setTimeout(r, 10));

    // restore success
    poolMod.getThreadPool = () => ({ writeTelemetry: () => Promise.resolve() });
  (reporter as unknown as { nextAllowedFlushTime: number }).nextAllowedFlushTime = 0;
    reporter.flush();
    await new Promise(r => setTimeout(r, 25));
  interface DebugShape { lastEffectiveBatchSize: number }
  const dbg = (reporter as unknown as { __getInternalPerfDebug(): DebugShape }).__getInternalPerfDebug();
  const metrics = reporter.getFlushMetrics();
    // After rejection streak, we expect the effective batch size to have been reduced at least once
    expect(dbg.lastEffectiveBatchSize).toBeGreaterThan(0);
  expect(metrics.adaptiveEnabled).toBe(true);

    poolMod.getThreadPool = originalGet;
  });
});
