import { getThreadPool, shutdownThreadPool } from '../src/performance/ThreadPool';

describe('QnceThreadPool (simulated)', () => {
  afterEach(async () => {
    await shutdownThreadPool();
  });

  test('submits and completes cache-load job', async () => {
    const pool = getThreadPool({ maxWorkers: 2 });
    const result = await pool.submitJob('cache-load', { nodeId: 'x' }, 'normal');
    expect(result).toBeDefined();
  });

  test('updates stats after jobs', async () => {
    const pool = getThreadPool({ maxWorkers: 2 });
    await Promise.all([
      pool.submitJob('telemetry-write', { e: 1 }, 'low'),
      pool.submitJob('asset-process', { id: 'a' }, 'normal'),
    ]);
    const stats = pool.getStats();
    expect(stats.completedJobs + stats.failedJobs).toBeGreaterThanOrEqual(2);
  });
});
