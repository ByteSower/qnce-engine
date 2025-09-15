# Error Handling & Debug / Diagnostics

> Mirror: Do not edit directly here. Update docs/ERROR-HANDLING-AND-DEBUG.md and run sync.


> Status: Draft (Unreleased)
>
> This guide explains the QNCE Engine's structured error model, debugging facilities, and telemetry / logging hooks so you can quickly identify, reproduce, and resolve issues in interactive narrative flows.

---
## 1. Philosophy
QNCE favors: 
- Fail fast for developer / authoring mistakes (invalid story, bad choice index) with rich context.
- Fail soft for runtime presentation (user actions) when possible, surfacing structured errors you can display.
- Provide deterministic, serializable error metadata for analytics & replay.

All public APIs either:
- Return a value / Promise resolving to a result object `{ success: boolean, ... }`, or
- Throw a subclass of `QNCEError` (synchronous API misuse / validation problems).

---
## 2. Error Class Hierarchy
```
Error
└─ QNCEError (base)
   ├─ QNCENavigationError      (invalid node / flow traversal)
   ├─ ChoiceValidationError    (invalid or disallowed choice selection)
   ├─ ConditionEvaluationError (bad conditional expression)
   ├─ StoryDataError           (schema / integrity issues in imported story)
   └─ StateError               (serialization / persistence state issues)
```
Each subclass carries a stable `name` and message. Future versions may add structured fields (guard with feature flags).

### 2.1 Base Shape
```ts
interface StructuredErrorData {
  name: string;               // e.g. 'ChoiceValidationError'
  message: string;            // human readable
  code?: string;              // planned: stable machine code
  context?: Record<string, unknown>; // optional diagnostic payload
  stack?: string;             // preserved when available
}
```
Use `toStructuredError(err)` helper (if exported) or manually map fields for transport / logging.

---
## 3. Choice & Condition Failures
- `ChoiceValidationError` is thrown when `makeChoice()` is invoked with an out-of-range index or a rule fails.
- `ConditionEvaluationError` is raised for invalid / unsafe expressions (`flags.score >` dangling, disallowed tokens).

Mitigation strategies:
1. Validate choice availability via `getAvailableChoices()` before rendering UI.
2. Pre-validate all conditional expressions at import time: `engine.conditionEvaluator.validate(expr)`.
3. Use defensive wrappers:
```ts
try {
  engine.makeChoice(idx);
} catch (e) {
  if (e instanceof ChoiceValidationError) showError(e.message);
  else throw e; // unexpected
}
```

---
## 4. Navigation Errors
`QNCENavigationError` signals attempts to jump to a node that doesn't exist or is empty. Prefer defensive guards:
```ts
if (engine.hasNode(id)) {
  engine.goToNodeById(id);
}
```

---
## 5. Persistence / State Issues
`StateError` & `StoryDataError` surface when loading malformed serialized state or story data. Always:
- Capture a checksum or version: pass options to `saveState({ checksum: true })`.
- On load, enable checksum & version verification for tamper detection.
- Provide a migration function to adapt historical saves.

---
## 6. Telemetry & Structured Failures
Telemetry events emit `ok=false` and error context for:
- `expression.evaluate` (conditional errors)
- `storage.op` (persistence save/load/list/delete/clear failures)
- `engine.structuredError` (top-level wrapped exceptions)

Overflow handling (Unreleased additions):
```
overflowStrategy: 'drop' | 'drop-oldest' | 'error'
```
Configure via engine creation or telemetry adapter options. Use `suppressTelemetryWarnings` for high-volume perf tests to silence benign queue overflow notices.

---
## 7. Logger & Serialization
A lightweight logger supports levels: `error | warn | info | success | debug`.
Injection:
```ts
const logger = createLogger({ level: 'debug' });
const engine = createQNCEEngine(story, { logger });
```
Recent enhancement: complex objects serialize safely (circular guards, depth truncation) to avoid noisy `[object Object]` output.

### 7.1 Selecting Log Level
```ts
const level = deriveLogLevel({ quiet: argv.quiet, verbose: argv.verbose });
```
Use `quiet` for CI (warnings only), `verbose` for deep debugging.

---
## 8. Debug Mode & Hot Profiler
Enable debug features (depending on feature flags / constructor options) to collect:
- Condition evaluation timings & cache hit counts
- Branch / choice execution traces
- Performance mode object pooling stats

Sample (from tests):
```
🎯 QNCE Engine Performance Report
Flow-Switch Latency: 0.00ms (target ≤20ms)
State Transition Time: 0.00ms (target ≤5ms)
...
```
Use these metrics to regression-test latency budgets.

---
## 9. Keyboard Shortcut Error Feedback
The `useKeyboardShortcuts` hook swallows undo/redo errors in production but logs in development. For critical UX, wrap engine calls with custom handlers to surface toast notifications.

---
## 10. Benchmarking Conditions
Micro benchmarks (`npm run perf:conditions`) track cold vs warm latency for representative expressions. Baseline (example):
```
flags.mode === "hard" || flags.debug  -> cold p50 0.0017ms, warm p50 0.0006ms
```
Set performance budgets relative to narrative scale (target sub-microsecond warm p50 for simple flag checks).

---
## 11. Recommended Workflow
1. Run full test suite: ensures no regression in structured error emission.
2. Run `perf:micro` & `perf:conditions`: capture snapshots.
3. If anomalies: enable debug logger + verbose telemetry, reproduce issue, extract structured error JSON.
4. Write a failing test using captured structured error context.
5. Fix; re-run tests + benchmarks; update CHANGELOG under Unreleased (Added/Fixed/Performance).

---
## 12. Displaying Errors to Users
Never show raw stack traces to players. Map:
```
ChoiceValidationError -> "That option is not available."
QNCENavigationError   -> generic fallback + report ID
StateError            -> prompt user to restart / reload save
```
Attach a correlation ID (e.g., telemetry event seq) for support.

---
## 13. Future Roadmap (Planned)
- Stable machine error codes (e.g. `NAVIGATION_INVALID_NODE`).
- Structured error redaction policy for privacy.
- Batch telemetry adapter with exponential backoff & jitter tweakable.
- Pluggable symbolication / source maps for stack trimming.

---
## 14. Quick Reference
| Concern | Class / Tool | Mitigation |
|---------|--------------|-----------|
| Bad choice index | ChoiceValidationError | Render from `getAvailableChoices()` |
| Invalid condition | ConditionEvaluationError | Pre-validate expressions |
| Missing node | QNCENavigationError | `hasNode()` guard |
| Corrupt save | StateError | checksum + version verify |
| Dangling story link | StoryDataError | import validation & linting |
| Telemetry saturation | overflowStrategy | tune queue size / suppress warnings |

---
## 15. Reporting Issues
Provide when filing bugs:
- Engine version
- Story hash / checksum
- Serialized state snippet (if safe)
- Error name + message + structured context
- Benchmark deltas (perf scripts)

This speeds up triage and reproducibility.

---
*End of document.*
