# Persistence Adapters

Pluggable persistence for QNCE Engine state (v1.2.3+). Use a StorageAdapter to save/load serialized engine state across sessions using different backends.

## Supported adapters

- MemoryStorageAdapter — in-memory only; fastest; not persisted across reloads
- LocalStorageAdapter — browser localStorage
- SessionStorageAdapter — browser sessionStorage
- FileStorageAdapter — Node.js filesystem (JSON per key)
- IndexedDBStorageAdapter — browser IndexedDB (recommended for large saves)
- Factory: createStorageAdapter(type, options)

## Engine integration

Methods exposed on the engine when an adapter is attached:
- attachStorageAdapter(adapter)
- saveToStorage(key, options?)
- loadFromStorage(key, options?)
- deleteFromStorage(key)
- listStorageKeys()
- storageExists(key)
- clearStorage()
- getStorageStats()

### Node/TS example (memory)

```ts
import { QNCEEngine } from 'qnce-engine';
import { createStorageAdapter } from 'qnce-engine/persistence/StorageAdapters';

const engine = new QNCEEngine(story);
engine.attachStorageAdapter(createStorageAdapter('memory'));
await engine.saveToStorage('slot1');
await engine.loadFromStorage('slot1');
```

### Browser/TS example (localStorage)

```ts
const storage = createStorageAdapter('localStorage');
engine.attachStorageAdapter(storage);

if (await engine.storageExists('autosave')) {
  await engine.loadFromStorage('autosave');
}
```

## Notes

- Serialization uses the same saveState/loadState internals as checkpoints.
- Use try/catch or storageExists() to handle missing keys gracefully.
- IndexedDB is preferred for large payloads in browsers; memory is fastest for tests.
- In Node tests we shim local/session storage; in browsers real Web APIs are used.

## Roadmap

- CLI play: optional --storage flag to choose default adapter
- Import→Play end-to-end tests across adapters
- Retention policies and size budgeting
