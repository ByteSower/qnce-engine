import { getPerfReporter, shutdownPerfReporter } from '../src/performance/PerfReporter';

/**
 * Tests for R1 (warning suppression) and R2 (adaptive backoff) behavior.
 * We simulate rejection by monkey-patching the thread pool writeTelemetry via reporter internals.
 */

describe('PerfReporter adaptive backoff & suppression', () => {
  afterEach(() => {
    shutdownPerfReporter();
    delete (process.env as Record<string, string>)['QNCE_SUPPRESS_PERF_WARN'];
  });

  it('suppresses warnings when QNCE_SUPPRESS_PERF_WARN=1', () => {
    process.env.QNCE_SUPPRESS_PERF_WARN = '1';
    const reporter = getPerfReporter({ batchSize: 1, enableBackgroundFlush: false });
  // Spy on console.warn
  const originalWarn = console.warn;
  let warnCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console as any).warn = () => { warnCount++; };

    // Inject a failing writeTelemetry by forcing flush to throw inside dispatch promise
    const poolMod = require('../src/performance/ThreadPool');
    const originalGet = poolMod.getThreadPool;
    poolMod.getThreadPool = () => ({
      writeTelemetry: () => Promise.reject(new Error('Job queue limit exceeded')),
    });

    reporter.record('cache-hit', {});
    reporter.flush();

    expect(warnCount).toBe(0); // suppressed

    // restore
    poolMod.getThreadPool = originalGet;
    console.warn = originalWarn;
  });

  it('applies exponential backoff on consecutive rejections and resets after success', async () => {
    const reporter = getPerfReporter({ batchSize: 1, enableBackgroundFlush: false });
    const poolMod = require('../src/performance/ThreadPool');
    const originalGet = poolMod.getThreadPool;

    poolMod.getThreadPool = () => ({
      writeTelemetry: () => {
        return Promise.reject(new Error('Job queue limit exceeded'));
      }
    });

  reporter.record('cache-hit', {}); // trigger first flush
  reporter.flush();
  await new Promise(r => setTimeout(r, 5)); // allow async rejection handler
  interface DebugShape { consecutiveRejects: number; backoffDelayMs: number; nextAllowedFlushTime: number }
  const debug1 = (reporter as unknown as { __getInternalPerfDebug(): DebugShape }).__getInternalPerfDebug();
    expect(debug1.consecutiveRejects).toBeGreaterThanOrEqual(1);
    const delay1 = debug1.backoffDelayMs;
    expect(delay1).toBeGreaterThanOrEqual(20);

  // Second rejection (bypass backoff gate)
  (reporter as unknown as { nextAllowedFlushTime: number }).nextAllowedFlushTime = 0;
  reporter.record('cache-hit', {});
  reporter.flush();
  await new Promise(r => setTimeout(r, 5));
  const debug2 = (reporter as unknown as { __getInternalPerfDebug(): DebugShape }).__getInternalPerfDebug();
    expect(debug2.consecutiveRejects).toBeGreaterThanOrEqual(2);
    expect(debug2.backoffDelayMs).toBeGreaterThan(delay1 - 1); // increased

    // Advance time artificially by setting nextAllowedFlushTime in the past and switch to success
  // Force allow next flush by clearing backoff gate
  (reporter as unknown as { nextAllowedFlushTime: number }).nextAllowedFlushTime = 0;
    poolMod.getThreadPool = () => ({
      writeTelemetry: () => Promise.resolve(),
    });

    reporter.record('cache-hit', {});
    reporter.flush();
    await new Promise(r => setTimeout(r, 10));

  const debug3 = (reporter as unknown as { __getInternalPerfDebug(): DebugShape }).__getInternalPerfDebug();
    expect(debug3.consecutiveRejects).toBe(0); // reset after success
    expect(debug3.backoffDelayMs).toBe(0);

    poolMod.getThreadPool = originalGet;
  });
});
