/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { createQNCEEngine, type StoryData } from '../src/engine/core';
import { createTelemetry } from '../src/telemetry/core';
import type { TelemetryAdapter } from '../src/telemetry/types';
import type { SerializedState, StorageAdapter, PersistenceResult, SerializationOptions, LoadOptions } from '../src/engine/types';

class MemoryTelemetry implements TelemetryAdapter {
  public batches: any[][] = [];
  async send(batch: any[]): Promise<void> { this.batches.push(batch); }
}

class FailingSaveAdapter implements StorageAdapter {
  async save(_key: string, _data: SerializedState, _options?: SerializationOptions): Promise<PersistenceResult> {
    return { success: false, error: 'mock-save-failed' };
  }
  async load(_key: string, _options?: LoadOptions): Promise<SerializedState | null> { return null; }
  async delete(_key: string): Promise<boolean> { return true; }
  async list(): Promise<string[]> { return []; }
  async exists(_key: string): Promise<boolean> { return false; }
  async getStats(): Promise<{ totalSize: number; keyCount: number; [key: string]: unknown }>{ return { totalSize: 0, keyCount: 0 }; }
  async clear(): Promise<boolean> { return true; }
}

function story(): StoryData {
  return {
    initialNodeId: 'start',
    nodes: [
      { id: 'start', text: 'Start', choices: [ { text: 'Go', nextNodeId: 'end' } ] },
      { id: 'end', text: 'End', choices: [] }
    ]
  };
}

describe.skip('Mock adapters – failures/timeouts', () => {
  test('autosave failure on flag-change emits engine.structuredError telemetry', async () => {
    const adapter = new MemoryTelemetry();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });

    // Enable autosave and force it to fail by patching createCheckpoint
    (engine as any).configureAutosave?.({ enabled: true, triggers: ['flag-change'], throttleMs: 0 });
    (engine as any).createCheckpoint = jest.fn().mockRejectedValue(new Error('checkpoint boom'));

    engine.setFlag('x', true);
    await telemetry.flush();

    const events = adapter.batches.flat();
    const structured = events.filter(e => e.type === 'engine.structuredError');
    expect(structured.length).toBeGreaterThanOrEqual(1);
    // basic shape checks
    const payload = structured[structured.length - 1].payload;
    expect(payload.kind).toBe('persistence');
    expect(payload.context?.operation).toBe('autosave');
  });

  test('storage adapter returns failure -> storage.op emitted with ok=false', async () => {
    const adapter = new MemoryTelemetry();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(story(), undefined, false, undefined, { telemetry, env: 'test' });

    (engine as any).attachStorageAdapter(new FailingSaveAdapter());

    const res = await (engine as any).saveToStorage('k1');
    expect(res.success).toBe(false);

    await telemetry.flush();
    const events = adapter.batches.flat();
    const saves = events.filter(e => e.type === 'storage.op' && e.payload?.op === 'save');
    expect(saves.length).toBeGreaterThanOrEqual(1);
    expect(saves[saves.length - 1].payload.ok).toBe(false);
  });
});
