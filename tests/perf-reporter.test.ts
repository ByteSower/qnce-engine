import { PerfReporter, getPerfReporter, shutdownPerfReporter } from '../src/performance/PerfReporter';

describe('PerfReporter', () => {
  afterEach(() => {
    shutdownPerfReporter();
  });

  test('records events and computes summary stats', () => {
    const reporter = new PerfReporter({ enableBackgroundFlush: false, enableConsoleOutput: false });
    const id1 = reporter.record('cache-hit', { key: 'a' }, 'cache');
    expect(typeof id1).toBe('string');

    const span = reporter.startSpan('state-transition', { nodeId: 'n1' }, 'engine');
    // Simulate some time
    reporter.endSpan(span, { nextNodeId: 'n2' });

    const summary = reporter.summary();
    expect(summary.totalEvents).toBeGreaterThanOrEqual(2);
    expect(summary.eventsByType['cache-hit']).toBeGreaterThanOrEqual(1);
    expect(summary.avgDurations['state-transition']).toBeGreaterThanOrEqual(0);
  });

  test('global reporter singleton provides accessors', () => {
    const r = getPerfReporter({ enableBackgroundFlush: false, enableConsoleOutput: false });
    r.record('custom', { t: 1 }, 'user');
    const s = r.summary();
    expect(s.totalEvents).toBeGreaterThan(0);
  });

  test('flush timer can be stopped and disposed', () => {
    const r = new PerfReporter({ enableBackgroundFlush: true, flushInterval: 10, enableConsoleOutput: false });
    r.record('custom', { a: 1 }, 'system');
    r.dispose();
    // No assertion on timers; ensure no throw
    expect(r.getEvents().length).toBeGreaterThanOrEqual(1);
  });
});
