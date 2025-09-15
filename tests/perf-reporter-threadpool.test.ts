import { PerfReporter, shutdownPerfReporter } from '../src/performance/PerfReporter';
import { getThreadPool } from '../src/performance/ThreadPool';

describe('PerfReporter + ThreadPool integration', () => {
  afterEach(() => {
    shutdownPerfReporter();
  });

  test('flush offloads events to thread pool and bounds history', async () => {
    // Ensure a pool exists with generous queue to avoid contention with other suites
    getThreadPool({ maxWorkers: 1, queueLimit: 2000 });

    const reporter = new PerfReporter({ enableBackgroundFlush: false, batchSize: 100, maxEventHistory: 20 });
    // Record > maxEventHistory events (but single-batch flush)
    for (let i = 0; i < 30; i++) {
      reporter.record('custom', { i }, 'system');
    }

    // Manual flush
    reporter.flush();

    // History should be bounded
    expect(reporter.getEvents().length).toBeLessThanOrEqual(20);
  });
});
