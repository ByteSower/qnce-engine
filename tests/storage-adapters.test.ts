// QNCE Engine - Storage Adapter Tests
// Tests for Memory, File, IndexedDB (skipped in Node), and integration with QNCEEngine

import { QNCEEngine, StoryData } from '../src/engine/core';
import { 
  createStorageAdapter,
  MemoryStorageAdapter,
  FileStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBStorageAdapter
} from '../src/persistence/StorageAdapters';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

const story: StoryData = {
  initialNodeId: 'start',
  nodes: [
    { id: 'start', text: 'Start Node', choices: [ { text: 'Go', nextNodeId: 'next', flagEffects: { progressed: true } } ] },
    { id: 'next', text: 'Next Node', choices: [] }
  ]
};

describe('Storage Adapters', () => {
  describe('MemoryStorageAdapter', () => {
    let adapter: MemoryStorageAdapter;
    beforeEach(() => { adapter = createStorageAdapter('memory') as MemoryStorageAdapter; });

    test('save and load round-trip', async () => {
      const engine = new QNCEEngine(story);
      engine.selectChoice(engine.getCurrentNode().choices[0]);
      const serialized = await engine.saveState();
      const result = await adapter.save('slot1', serialized);
      expect(result.success).toBe(true);
      const loaded = await adapter.load('slot1');
      expect(loaded?.state.currentNodeId).toBe('next');
      expect(loaded?.state.flags.progressed).toBe(true);
    });

    test('list, exists, delete, clear, stats', async () => {
      const engine = new QNCEEngine(story);
      const serialized = await engine.saveState();
      await adapter.save('slotA', serialized);
      await adapter.save('slotB', serialized);
      const list = await adapter.list();
      expect(list.sort()).toEqual(['slotA','slotB']);
      expect(await adapter.exists('slotA')).toBe(true);
      expect(await adapter.delete('slotA')).toBe(true);
      expect(await adapter.exists('slotA')).toBe(false);
      const stats = await adapter.getStats();
      expect(stats.keyCount).toBe(1);
      await adapter.clear();
      const statsAfter = await adapter.getStats();
      expect(statsAfter.keyCount).toBe(0);
    });
  });

  describe('FileStorageAdapter', () => {
    let tempDir: string;
    let adapter: FileStorageAdapter;
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qnce-test-'));
      adapter = createStorageAdapter('file', { directory: tempDir }) as FileStorageAdapter;
    });
    afterEach(async () => {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    test('save creates file and load restores state', async () => {
      const engine = new QNCEEngine(story);
      engine.selectChoice(engine.getCurrentNode().choices[0]);
      const serialized = await engine.saveState();
      const res = await adapter.save('slot1', serialized);
      expect(res.success).toBe(true);
      const loaded = await adapter.load('slot1');
      expect(loaded?.state.currentNodeId).toBe('next');
    });

    test('list & delete', async () => {
      const engine = new QNCEEngine(story);
      const serialized = await engine.saveState();
      await adapter.save('one', serialized);
      await adapter.save('two', serialized);
      const keys = (await adapter.list()).sort();
      expect(keys).toEqual(['one','two']);
      expect(await adapter.delete('one')).toBe(true);
      expect(await adapter.exists('one')).toBe(false);
    });
  });

  describe('Browser-only adapters (graceful in Node)', () => {
    test('LocalStorageAdapter returns failure in Node environment', async () => {
      const adapter = new LocalStorageAdapter('test:');
      const engine = new QNCEEngine(story);
      const serialized = await engine.saveState();
      const res = await adapter.save('slot', serialized);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/not available/);
    });

    test('SessionStorageAdapter returns failure in Node environment', async () => {
      const adapter = new SessionStorageAdapter('test:');
      const engine = new QNCEEngine(story);
      const serialized = await engine.saveState();
      const res = await adapter.save('slot', serialized);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/not available/);
    });

    test('IndexedDBStorageAdapter returns failure in Node environment', async () => {
      const adapter = new IndexedDBStorageAdapter('TESTDB');
      const engine = new QNCEEngine(story);
      const serialized = await engine.saveState();
      const res = await adapter.save('slot', serialized);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/not available/);
    });
  });

  describe('Engine integration with storage adapter', () => {
    test('configure memory adapter and persist/load state', async () => {
      const engine = new QNCEEngine(story);
      engine.configureStorageAdapter('memory');
      // Advance state
      engine.selectChoice(engine.getCurrentNode().choices[0]);
      const saveResult = await engine.saveStateToStorage('profile1');
      expect(saveResult.success).toBe(true);
      // Mutate further
      (engine as any).state.currentNodeId = 'start'; // simulate revert to detect restoration
      const loadResult = await engine.loadStateFromStorage('profile1');
      expect(loadResult.success).toBe(true);
      expect(engine.getState().currentNodeId).toBe('next');
      const keys = await engine.listStoredStates();
      expect(keys).toContain('profile1');
      const deleted = await engine.deleteStoredState('profile1');
      expect(deleted).toBe(true);
    });

    test('saveStateToStorage without adapter errors gracefully', async () => {
      const engine = new QNCEEngine(story);
      const result = await engine.saveStateToStorage('slotX');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/No storage adapter/);
    });
  });
});
