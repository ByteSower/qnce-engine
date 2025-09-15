import { createQNCEEngine, type StoryData } from '../src/engine/core';
import { createTelemetry } from '../src/telemetry/core';
import type { TelemetryAdapter, QEvent } from '../src/telemetry/types';
import type { SerializedState, LoadOptions, SerializationOptions, PersistenceResult } from '../src/engine/types';

function makeStory(): StoryData {
  return {
    initialNodeId: 'start',
    nodes: [
      { id: 'start', text: 'Start', choices: [
        { text: 'Go', nextNodeId: 'end', condition: '1 + 1 === 2' },
        { text: 'Hidden', nextNodeId: 'end', condition: 'invalid syntax here' }
      ] },
      { id: 'end', text: 'End', choices: [] }
    ]
  };
}

class MemoryAdapter implements TelemetryAdapter {
  public batches: QEvent[][] = [];
  async send(batch: QEvent[]): Promise<void> { this.batches.push(batch); }
}

describe('Engine telemetry hooks', () => {
  test('emits session.start, node.enter, expression.evaluate, choice.select', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    // Drain initial session.start and node.enter on first getCurrentNode
    engine.getCurrentNode();
    await telemetry.flush();
    const all1 = adapter.batches.flat();
    const types1 = all1.map(e => e.type);
    expect(types1).toEqual(expect.arrayContaining(['session.start', 'node.enter']));

    // Trigger expression.evaluate (valid) and choice.select
    const choices = engine.getAvailableChoices();
    expect(choices.length).toBeGreaterThan(0);
    engine.selectChoice(choices[0]);
    await telemetry.flush();
    const all2 = adapter.batches.flat();
    const types2 = all2.map(e => e.type);
    expect(types2).toEqual(expect.arrayContaining(['expression.evaluate', 'choice.select']));
  });

  test('emits engine.structuredError and expression.evaluate(ok=false) on condition error', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    // Trigger condition checks; story contains an invalid condition on a hidden choice
    engine.getAvailableChoices();
    await telemetry.flush();

    const events = (adapter as MemoryAdapter).batches.flat();
    const hasStructured = events.some(e => e.type === 'engine.structuredError');
    const failedEval = events.find(e => e.type === 'expression.evaluate' && (e.payload as { ok?: boolean })?.ok === false);
    expect(hasStructured).toBe(true);
    expect(failedEval).toBeTruthy();
    // Optional: verify error kind when available
    if (failedEval) {
      expect((failedEval.payload as { error?: unknown }).error).toBeDefined();
    }
  });

  test('storage.op ok=false when loadFromStorage fails', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory');

    // First attach working adapter and save a key
    engine.attachStorageAdapter(mem);
    await engine.saveToStorage('k1');

    // Now attach failing loader over the same underlying adapter
    const failingLoad = {
      ...mem,
      async load(key: string, options?: LoadOptions): Promise<SerializedState | null> {
        void key; void options;
        // Return malformed data that will not validate in loadState
        return {} as unknown as SerializedState;
      }
    } as typeof mem;

    engine.attachStorageAdapter(failingLoad);

    const res = await engine.loadFromStorage('k1');
    expect(res.success).toBe(false);

    await telemetry.flush();
    const events = (adapter as MemoryAdapter).batches.flat();
    const loads = events.filter(e => e.type === 'storage.op' && (e.payload as { op?: string })?.op === 'load');
    expect(loads.length).toBeGreaterThanOrEqual(1);
    expect((loads[loads.length - 1].payload as { ok?: boolean }).ok).toBe(false);
  });

  test('emits storage.op events for save/load/list/delete/clear', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    // Use in-memory storage adapter via existing factory used in CLI tests
    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory');
    engine.attachStorageAdapter(mem);

    await engine.saveToStorage('k1');
    await engine.loadFromStorage('k1');
    await engine.listStorageKeys();
    await engine.deleteFromStorage('k1');
    await engine.clearStorage();
    await telemetry.flush();

    const types = (adapter as MemoryAdapter).batches.flat().map(e => e.type);
    expect(types.filter(t => t === 'storage.op').length).toBeGreaterThanOrEqual(5);
  });

  test('storage.op ok=false when saveToStorage fails', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory');
    const failing = {
      ...mem,
      async save(key: string, data: SerializedState, options?: SerializationOptions): Promise<PersistenceResult> {
        void key; void data; void options;
        return { success: false, error: 'mock-failure' };
      }
    } as typeof mem;

    engine.attachStorageAdapter(failing);

    const res = await engine.saveToStorage('k1');
    expect(res.success).toBe(false);

    await telemetry.flush();
    const events = (adapter as MemoryAdapter).batches.flat();
    const saves = events.filter(e => e.type === 'storage.op' && (e.payload as { op?: string })?.op === 'save');
    expect(saves.length).toBeGreaterThanOrEqual(1);
    expect((saves[saves.length - 1].payload as { ok?: boolean }).ok).toBe(false);
  });

  test('storage.op ok=false when deleteFromStorage fails', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory');
    const failing = {
      ...mem,
      async delete(key: string): Promise<boolean> { void key; return false; }
    } as typeof mem;

    engine.attachStorageAdapter(failing);

    const ok = await engine.deleteFromStorage('nope');
    expect(ok).toBe(false);
    await telemetry.flush();
    const events = (adapter as MemoryAdapter).batches.flat();
    const dels = events.filter(e => e.type === 'storage.op' && (e.payload as { op?: string })?.op === 'delete');
    expect(dels.length).toBeGreaterThanOrEqual(1);
    expect((dels[dels.length - 1].payload as { ok?: boolean }).ok).toBe(false);
  });

  test('storage.op ok=false when clearStorage fails', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory');
    const failing = {
      ...mem,
      async clear(): Promise<boolean> { return false; }
    } as typeof mem;

    engine.attachStorageAdapter(failing);

    const ok = await engine.clearStorage();
    expect(ok).toBe(false);
    await telemetry.flush();
    const events = (adapter as MemoryAdapter).batches.flat();
    const clears = events.filter(e => e.type === 'storage.op' && (e.payload as { op?: string })?.op === 'clear');
    expect(clears.length).toBeGreaterThanOrEqual(1);
    expect((clears[clears.length - 1].payload as { ok?: boolean }).ok).toBe(false);
  });
});
