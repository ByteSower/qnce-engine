# Persistence & Storage Adapters

This guide explains QNCE Engine's persistence system and the newly added pluggable storage adapters.

## Overview

QNCE persistence provides:
- Full engine state serialization (node position, flags, history, checkpoints, branching context, version metadata)
- Integrity validation (checksum + version field)
- Lightweight checkpoints for undo/redo and rapid backtracking
- Adapter abstraction for multiple storage backends

## Serialized State Structure (Simplified)

```ts
interface SerializedState {
  version: string;            // Persistence schema version
  engineVersion: string;      // Engine package version
  timestamp: number;          // Epoch ms when saved
  currentNodeId: string;
  flags: Record<string, any>;
  history: Array<any>;        // Choice traversal history
  checkpoints?: Array<any>;   // Optional checkpoint snapshots
  branching?: any;            // Branching subsystem state (if enabled)
  autosave?: any;             // Autosave metadata
  meta?: Record<string, any>; // User provided metadata
  checksum?: string;          // Integrity hash (optional)
}
```

## Adapter Capabilities

Each adapter implements a minimal contract:

```ts
interface StorageAdapter {
  save(key: string, state: SerializedState): Promise<void>;
  load(key: string): Promise<SerializedState | undefined>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
  getMetadata?(key: string): Promise<{ key: string; [k: string]: any } | undefined>;
}
```

Optional `getMetadata` lets an adapter return lightweight information (size, timestamps) without loading full state.

## Built-in Adapters

| Adapter | Key | Environment | Description |
|---------|-----|-------------|-------------|
| Memory | `memory` | Any | Fast ephemeral in-process Map. Clears on reload. |
| Local Storage | `localStorage` | Browser | Uses `window.localStorage` (namespace + keyPrefix). |
| Session Storage | `sessionStorage` | Browser | Scoped to tab session. |
| File System | `file` | Node.js | Persists each save as JSON in a directory. |
| IndexedDB | `indexedDB` | Browser | Asynchronous, scalable persistent storage. |

## Selecting an Adapter

```ts
engine.configureStorageAdapter('memory');
engine.configureStorageAdapter('localStorage', { namespace: 'qnce', keyPrefix: 'save-' });
engine.configureStorageAdapter('file', { dir: './saves', fileExtension: '.json' });
engine.configureStorageAdapter('indexedDB', { dbName: 'qnceGame', storeName: 'qnce_states' });
```

If you call `saveStateToStorage` without configuring an adapter, an error is thrown.

## Saving & Loading

```ts
await engine.saveStateToStorage('slot1', { metadata: { label: 'Pre Boss', chapter: 'Act2' } });

const summaries = await engine.listStoredStates();
/* summaries: [{ key: 'slot1', size: 12345, timestamp: 1731600000000, label: 'Pre Boss', chapter: 'Act2' }] */

await engine.loadStateFromStorage('slot1', { validateChecksum: true });
```

## Deleting

```ts
await engine.deleteStoredState('slot1');
```

## Metadata & Listing

`listStoredStates()` composes basic metadata from adapter + serialized header fields without deserializing entire histories when possible.

## File Adapter Details

Options:
```ts
engine.configureStorageAdapter('file', { 
  dir: './saves',              // directory created if not present
  fileExtension: '.json',      // optional (default .json)
  pretty: true                 // pretty-print JSON (if implemented)
});
```

Files are named `<key><ext>` inside the directory.

## IndexedDB Adapter Details

Options:
```ts
engine.configureStorageAdapter('indexedDB', {
  dbName: 'qnceGame',
  storeName: 'qnce_states',
  version: 1
});
```
Object store primary key: `key`.

## Integrity Validation

When you pass `{ validateChecksum: true }` to `loadStateFromStorage` the engine recalculates the checksum and throws if mismatch. (Ensure you called `engine.enableChecksum()` or similar if checksum generation is gated in your codebase.)

## Custom Adapter

```ts
class RemoteAdapter {
  constructor(private client: APIClient) {}
  async save(key: string, state: SerializedState) {
    await this.client.put(`/saves/${key}`, encrypt(JSON.stringify(state)));
  }
  async load(key: string) {
    const raw = await this.client.get(`/saves/${key}`);
    if (!raw) return undefined;
    return JSON.parse(decrypt(raw));
  }
  async delete(key: string) { await this.client.delete(`/saves/${key}`); }
  async listKeys() { return this.client.get('/saves/keys'); }
  async getMetadata(key: string) { return this.client.get(`/saves/${key}/meta`); }
}

// Attach
(engine as any).storageAdapter = new RemoteAdapter(apiClient);
```

A forthcoming helper `engine.registerStorageAdapter(name, adapter)` will formalize custom registrations.

## Best Practices

1. Namespace browser storage keys to prevent collisions (`namespace: 'myGame'`).
2. Store small user-facing labels in `metadata` for quick save slot UI lists.
3. Validate checksums for user-modifiable save files (e.g., on desktop mods).
4. For large histories use IndexedDB or File; avoid localStorage quota limits.
5. Periodically prune old autosaves using `listStoredStates()` metadata timestamps.

## Roadmap
- Compression layer (gzip optional)
- Encryption hooks / key rotation
- Cloud sync reference adapter (S3 / R2)
- Automatic migration registry per persistence version

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `configureStorageAdapter` throws in Node for `localStorage` | Browser-only API | Use `file` or `memory` | 
| `loadStateFromStorage` returns undefined | Missing key | Check `listStoredStates()` results |
| Checksum mismatch | Corrupted/edited file | Recreate save; ensure checksum generation at save time |
| IndexedDB quota exceeded | Large or numerous saves | Prune old saves; compress state (future) |

---

For quick reference see README section "Storage Adapters".
