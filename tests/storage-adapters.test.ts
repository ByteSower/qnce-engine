import { createQNCEEngine, StoryData } from '../src/engine/core';
import { 
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  FileStorageAdapter,
  IndexedDBStorageAdapter,
  createStorageAdapter
} from '../src/persistence/StorageAdapters';

// Minimal story
const story: StoryData = {
  initialNodeId: 'start',
  nodes: [
    { id: 'start', text: 'Start', choices: [{ text: 'Next', nextNodeId: 'end' }] },
    { id: 'end', text: 'End', choices: [] }
  ]
};

function makeEngine() {
  return createQNCEEngine(story);
}

// Provide simple shims for browser storage in Node env
function setupBrowserStorage() {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; }
  };
  const sstore: Record<string, string> = {};
  (global as any).sessionStorage = {
    getItem: (k: string) => (k in sstore ? sstore[k] : null),
    setItem: (k: string, v: string) => { sstore[k] = v; },
    removeItem: (k: string) => { delete sstore[k]; },
    key: (i: number) => Object.keys(sstore)[i] || null,
    get length() { return Object.keys(sstore).length; }
  };
}

describe('StorageAdapters basic behavior', () => {
  beforeAll(() => {
    setupBrowserStorage();
  });

  test('MemoryStorageAdapter roundtrip via engine helpers', async () => {
    const engine = makeEngine();
    const adapter = new MemoryStorageAdapter();
    engine.attachStorageAdapter(adapter);

    const saveRes = await engine.saveToStorage('game');
    expect(saveRes.success).toBe(true);

    // advance state
    engine.selectChoice(engine.getAvailableChoices()[0]);
    expect(engine.getState().currentNodeId).toBe('end');

    const loadRes = await engine.loadFromStorage('game');
    expect(loadRes.success).toBe(true);
    expect(engine.getState().currentNodeId).toBe('start');

    expect(await engine.listStorageKeys()).toContain('game');
    expect(await engine.storageExists('game')).toBe(true);

    const stats = await engine.getStorageStats();
    expect(stats && stats.keyCount).toBeGreaterThanOrEqual(1);

    expect(await engine.deleteFromStorage('game')).toBe(true);
  });

  test('LocalStorageAdapter basic save/load', async () => {
    const engine = makeEngine();
    const adapter = new LocalStorageAdapter('test:');
    engine.attachStorageAdapter(adapter);

    const r1 = await engine.saveToStorage('slot1');
    expect(r1.success).toBe(true);
    const r2 = await engine.loadFromStorage('slot1');
    expect(r2.success).toBe(true);
  });

  test('SessionStorageAdapter basic save/load', async () => {
    const engine = makeEngine();
    const adapter = new SessionStorageAdapter('test:');
    engine.attachStorageAdapter(adapter);

    const r1 = await engine.saveToStorage('slot1');
    expect(r1.success).toBe(true);
    const r2 = await engine.loadFromStorage('slot1');
    expect(r2.success).toBe(true);
  });

  test('FileStorageAdapter save/load/list/delete', async () => {
    const engine = makeEngine();
    const adapter = new FileStorageAdapter('./.tmp-qnce-tests');
    engine.attachStorageAdapter(adapter);

    const r1 = await engine.saveToStorage('slotA');
    expect(r1.success).toBe(true);
    const keys = await engine.listStorageKeys();
    expect(keys).toContain('slotA');
    const r2 = await engine.loadFromStorage('slotA');
    expect(r2.success).toBe(true);
    const del = await engine.deleteFromStorage('slotA');
    expect(del).toBe(true);
  });

  test('createStorageAdapter factory returns proper instances', () => {
    expect(createStorageAdapter('memory')).toBeInstanceOf(MemoryStorageAdapter);
    expect(createStorageAdapter('localStorage')).toBeInstanceOf(LocalStorageAdapter);
    expect(createStorageAdapter('sessionStorage')).toBeInstanceOf(SessionStorageAdapter);
    expect(createStorageAdapter('file', { directory: './.tmp-qnce-tests' })).toBeInstanceOf(FileStorageAdapter);
    expect(createStorageAdapter('indexedDB')).toBeInstanceOf(IndexedDBStorageAdapter);
  });
});
