import { MemoryStorageAdapter } from '../src/persistence/StorageAdapters';
import type { SerializedState } from '../src/engine/types';
import type { QNCEState } from '../src/engine/core';

// Minimal inline QNCEState shape to avoid casting to any
// Minimal QNCEState for tests extends engine core definition with additional optional fields used in persistence snapshots
interface TestQNCEState extends QNCEState {
  checkpoints?: unknown[];
  flowStack?: unknown[];
}

const mockSerialized: SerializedState = {
  state: { currentNodeId: 'x', flags: {}, history: [], checkpoints: [], flowStack: [] } as TestQNCEState,
  flowEvents: [],
  metadata: { engineVersion: 'test', timestamp: new Date().toISOString() }
};

describe('StorageAdapter lifecycle (Memory)', () => {
  test('save -> list -> load -> stats -> delete -> clear', async () => {
    const adapter = new MemoryStorageAdapter();
    expect(await adapter.list()).toEqual([]);
    let stats = await adapter.getStats();
    expect(stats.keyCount).toBe(0);
    const r1 = await adapter.save('slot1', mockSerialized);
    expect(r1.success).toBe(true);
    expect(await adapter.exists('slot1')).toBe(true);
    expect(await adapter.list()).toContain('slot1');
  const loaded = await adapter.load('slot1');
  expect(loaded && (loaded as { state?: { currentNodeId?: string } }).state?.currentNodeId).toBe('x');
    await adapter.save('slot2', mockSerialized);
    const keys = await adapter.list();
    expect(keys.sort()).toEqual(['slot1', 'slot2']);
    stats = await adapter.getStats();
    expect(stats.keyCount).toBe(2);
    const del = await adapter.delete('slot1');
    expect(del).toBe(true);
    expect(await adapter.exists('slot1')).toBe(false);
    const cleared = await adapter.clear();
    expect(cleared).toBe(true);
    stats = await adapter.getStats();
    expect(stats.keyCount).toBe(0);
  });
});
