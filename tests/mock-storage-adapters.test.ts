import { createQNCEEngine } from '../src/engine/core';
import { FailingStorageAdapter, FlakySaveAdapter, SlowStorageAdapter, TimeoutSaveAdapter } from '../src/adapters/storage/MockAdapters';
import { createTelemetry } from '../src/telemetry/core';
import type { QEvent } from '../src/telemetry/types';

function story() {
  return { initialNodeId: 'start', nodes: [ { id: 'start', text: 'Start', choices: [] } ] };
}

class MemoryTelemetryAdapter {
  public batches: QEvent[][] = [];
  async send(batch: QEvent[]): Promise<void> { this.batches.push(batch); }
  async dispose() {}
}

describe('Mock storage adapters', () => {
  test('FailingStorageAdapter emits storage.op ok=false on save failure', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    engine.attachStorageAdapter(new FailingStorageAdapter({ failSaves: true }));
    const res = await engine.saveToStorage('k');
    expect(res.success).toBe(false);
    await telemetry.flush();
    const events = telemetryAdapter.batches.flat();
    const save = events.find((e): e is QEvent & { payload: { op: string; ok: boolean } } => {
      const p: unknown = (e as QEvent).payload;
      return e.type === 'storage.op' && typeof p === 'object' && p !== null && (p as { op?: unknown }).op === 'save';
    });
  expect(save).toBeTruthy();
  if (save) expect(save.payload.ok).toBe(false);
  });

  test('FlakySaveAdapter succeeds on initial call via built-in retry (failCount=1)', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't2', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    const adapter = new FlakySaveAdapter({ failCount: 1 });
    engine.attachStorageAdapter(adapter);
    const res = await engine.saveToStorage('k2');
    expect(res.success).toBe(true);
  });

  test('FlakySaveAdapter fails when retries disabled (maxAttempts=1)', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't2b', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    engine.setStorageRetryPolicy({ maxAttempts: 1 });
    const adapter = new FlakySaveAdapter({ failCount: 1 });
    engine.attachStorageAdapter(adapter);
    const res = await engine.saveToStorage('k2-no-retry');
    expect(res.success).toBe(false);
  });

  test('SlowStorageAdapter introduces measurable latency', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't3', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    engine.attachStorageAdapter(new SlowStorageAdapter(20));
    const t0 = Date.now();
    const res = await engine.saveToStorage('slow');
    expect(res.success).toBe(true);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeGreaterThanOrEqual(18); // small cushion
  });

  test('TimeoutSaveAdapter succeeds after timed-out attempts within retry budget', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't4', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    // Retry policy default maxAttempts=3; fail first 2 -> should succeed on 3rd
    const adapter = new TimeoutSaveAdapter({ timeoutFailCount: 2, timeoutDelayMs: 1, resolveDelayMs: 1 });
    engine.attachStorageAdapter(adapter);
    const res = await engine.saveToStorage('timeout-success');
    expect(res.success).toBe(true);
    await telemetry.flush();
    type SaveEvt = QEvent & { payload: { op: string; attempts: number; ok: boolean } };
    const events: SaveEvt[] = telemetryAdapter.batches.flat().filter((e): e is SaveEvt => {
      if (e.type !== 'storage.op') return false;
      const p: unknown = (e as QEvent).payload;
      return !!p && typeof p === 'object' && (p as { op?: unknown }).op === 'save';
    });
  const evt = events.pop();
  expect(evt?.payload.attempts).toBeGreaterThanOrEqual(3); // at least 3 attempts (2 failures + 1 success)
  });

  test('TimeoutSaveAdapter fails when timeoutFailCount exceeds retry budget', async () => {
    const telemetryAdapter = new MemoryTelemetryAdapter();
    const telemetry = createTelemetry({ adapter: telemetryAdapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't5', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });
    engine.setStorageRetryPolicy({ maxAttempts: 2 });
    const adapter = new TimeoutSaveAdapter({ timeoutFailCount: 3, timeoutDelayMs: 1 }); // will always timeout within 2 attempts
    engine.attachStorageAdapter(adapter);
    const res = await engine.saveToStorage('timeout-fail');
    expect(res.success).toBe(false);
    await telemetry.flush();
    type SaveEvt = QEvent & { payload: { op: string; attempts: number; ok: boolean } };
    const events: SaveEvt[] = telemetryAdapter.batches.flat().filter((e): e is SaveEvt => {
      if (e.type !== 'storage.op') return false;
      const p: unknown = (e as QEvent).payload;
      return !!p && typeof p === 'object' && (p as { op?: unknown }).op === 'save';
    });
  const evt = events.pop();
  expect(evt?.payload.attempts).toBe(2); // hit retry cap
  expect(evt?.payload.ok).toBe(false);
  });
});
