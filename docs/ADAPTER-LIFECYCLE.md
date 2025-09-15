## Adapter Lifecycle (Story & Storage)

Current interfaces are intentionally minimal; explicit `connect()` / `close()` hooks are deferred until remote/network backends are introduced.

### StoryAdapter Lifecycle
1. Instantiate (pure)
2. `detect(source)` → boolean (optional preflight)
3. `load(source, options?)` → normalized `StoryData`
4. `validate(storyData)` → `{ isValid, errors? }` (present adapters return success)

All are stateless; `load` is async to accommodate future I/O.

### StorageAdapter Operational Sequence
1. Instantiate
2. `save(key, data)`
3. Query ops: `load`, `exists`, `list`, `getStats`
4. Mutation ops: `delete`, `clear`
5. GC for disposal (implicit close)

### Future (Planned, Experimental First)
- `initialize()` for async setup (e.g. IndexedDB migrations)
- `close()` for explicit resource release
- `migrate(oldVersion)` for data evolution

### Testing Guarantees
Lifecycle tests ensure:
- Pure construction
- Deterministic normalization for StoryAdapters
- Storage size/key counts track saves & deletes

### Error Handling Expectations
- Return `false`/`null` for missing data; throw only on invalid input shape or unrecoverable parse

### Backward Compatibility
Optional hooks can be added in MINOR versions; required hooks only in MAJOR.

See `tests/story-adapter-lifecycle.test.ts` and `tests/storage-adapter-lifecycle.test.ts`.
