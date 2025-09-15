# Changelog

All notable changes to the QNCE Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**📌 Current Version: [1.3.2] - 2025-08-26**

## [Unreleased]
### Performance
 - Added condition evaluator expression canonicalization (sanitized + interned) with LRU cache.
 - Enabled context object pooling for condition evaluation in performance mode (reduces allocation churn during heavy conditional choice filtering).
- Instrumented PerfReporter with flush metrics (counters, latency percentiles, histogram buckets, snapshot API) to enable adaptive strategies.

 - Adaptive perf flush backoff (R2): exponential (capped at 500ms) delay introduced after consecutive background dispatch rejections to reduce queue pressure.

 - Added `condition-pooling.test.ts` covering expression interning reuse, context pooling behavior, and a 10k evaluation performance budget.
- Added `perf-flush-metrics.test.ts` validating flush metrics counters, histogram, and percentile calculations.
- Added `perf-backoff-suppression.test.ts` validating warning suppression env flag and adaptive backoff growth/reset.
- Marked internal utils with @internal to keep API surface clean.
 - Dynamic batch sizing (R6): PerfReporter now adapts effective flush batch size based on backlog depth, p95 send latency tiers (<25ms / <50ms), and rejection streak shrinkage heuristics. Scales up to 3–4x base when healthy; shrinks to preserve throughput under pressure.
 - Rejection rate metric: `rejectionRate` (0–1) derived from accepted vs rejected flush attempts for rapid health assessment and future auto-tuning inputs.
 - Exposed `lastEffectiveBatchSize` in flush metrics snapshot to aid observability of adaptive sizing decisions.
 - Added `perf-dynamic-batch.test.ts` covering upscale (low latency + large backlog) and downscale (rejection streak) scenarios.
 - Environment flag `QNCE_SUPPRESS_PERF_WARN=1` (R1) documented for suppressing repetitive flush failure warnings in CI / test runs.
 - Extended internal debug accessor `__getInternalPerfDebug()` with sizing/backoff fields (`consecutiveRejects`, `backoffDelayMs`, `nextAllowedFlushTime`, `lastEffectiveBatchSize`).
 - NOTE: Dynamic batch sizing & rejectionRate are currently @beta; heuristics may evolve (thresholds and scaling formula not yet part of the stable contract).
 - Added adaptive batch sizing disable flag (`disableAdaptiveBatch` config or env `QNCE_DISABLE_ADAPTIVE_BATCH=1`) to force fixed flush batch size (deterministic benchmarking & CI stability). When disabled, backoff & rejection metrics remain active but scaling heuristics are bypassed. (@beta)
 - Added internal test-only latency injection helper `__injectLatencySample(ms)` on PerfReporter to synthesize latency samples for percentile & scaling heuristic tests. (@internal)
 - Flush metrics snapshot now includes `adaptiveEnabled` boolean to signal whether dynamic batch sizing heuristics were active for the captured interval. (@beta)
 - Added retry-once flush dispatch logic (R3 groundwork) with guarded single retry on initial rejection when latency healthy. (@beta)
 - Added EMA-smoothed p95 latency export `smoothedP95DispatchLatencyMs` for early stabilization experiments. (@beta)
 - Export additional observability fields: `backoffActive`, `consecutiveRejects`. (@beta)
 - Introduced optional adaptive sampling scaffold (env `QNCE_ADAPTIVE_SAMPLING=1`) – currently passive with simple rate-based strategy. (@beta, experimental)

### Docs/Meta
- Consolidated duplicate performance docs: merged `PERFORMANCE_GUIDE.md` into canonical `docs/PERFORMANCE.md` and removed the obsolete guide to prevent drift.
- Added `docs/ROADMAP.md` capturing completed milestones and deferred refinement backlog.
- Expanded roadmap with Phase 2 telemetry reliability & adaptive refinement track (retry, dynamic sampling, percentile smoothing, observability metrics) plus quantum perf & CLI tooling plans.
### Added
- perf: condition evaluation micro-benchmark script (`npm run perf:conditions`) reporting cold vs warm p50/p95/min/max.
- TimeoutSaveAdapter mock to simulate network timeouts for save operations (tests exercising retry attempts & telemetry attempts field).
- Telemetry overflowStrategy option ('drop', 'drop-oldest', 'error') for configurable backpressure handling.
- Engine option suppressTelemetryWarnings to silence benign queue overflow warnings in perf mode tests.
  - Applied in performance-mode test suites to reduce console noise.
 - perf: environment flag `QNCE_SUPPRESS_PERF_WARN=1` suppresses perf flush warning logs (R1) in CI / test environments.

### Tests
- Added retry coverage for timeout scenarios (success within budget + failure exceeding cap) ensuring storage.op telemetry includes attempt counts.
 - Added `perf-adaptive-disable.test.ts` covering disabled adaptive sizing behavior (fixed batch size under backlog & high latency) and internal latency sample injection.
### Added
- engine: basic storage save retry/backoff policy (exponential with jitter) with configurable attempts via `setStorageRetryPolicy`
- engine: internal logger injection replacing console.warn in core engine (optional `logger` in createQNCEEngine options)
 - engine: public `getLogger()` accessor and `dispose()` method to release telemetry, perf reporter, and thread pool resources
### Fixed
- performance: unref perf reporter flush interval & added dispose() to reduce open-handle leaks


### Changed 🔧
- api: annotate experimental telemetry and quantum APIs with recognized TSDoc release tags (`@beta`) alongside `@experimental` to satisfy API Extractor
- api: update re-exports to carry release tags consistently

### Tooling 🛠️
- api-extractor: treat `ae-missing-release-tag` as error to enforce tagging discipline
- ci: add GitHub Actions workflow to build, test, and run API Extractor (fails on API drift); lint is non-blocking until repo is cleaned
- scripts: make `dx:api-report` fail on errors and add `dx:api-warnings` helper
- logger: introduce lightweight logger utility; replace console usage in CLI (import/play) with levels & quiet/verbose flags

### Docs / Meta
- docs: add Error Handling & Debug guide (docs + wiki mirror) and link in README / wiki Home
- annotate: mark core public API with JSDoc `@public` and telemetry exports with `@experimental` to signal stability per roadmap
- docs: add Beginner Guide and Experimental (Opt-in) API section; link example in README
- docs: add Deprecation Policy (DEPRECATION-POLICY.md) and Adapter Lifecycle reference (ADAPTER-LIFECYCLE.md)
 - docs: add initial Typedoc config and API Extractor setup (dev only)
### Examples
- add: fluent builder prototype example to explore superposition/entanglement ergonomics (non-API)
- add: quantum integration example demonstrating `attachQuantumFeatures` and flags
### Added (Experimental)
- quantum: add Entangler and Phase primitives exported as `@experimental`; include basic unit tests
- quantum: add optional integration helper `attachQuantumFeatures(engine, flags?)` to opt-in quantum features (`isPhaseActive`, `entangle`) without changing defaults; covered by unit tests
 - quantum: add FeatureFlags utility (`FeatureFlags`) to gate experimental behaviors; exported as `@experimental` with tests
 - quantum: add helper types (`FeatureFlagKey`, `EntangleTransform`, `PhasePredicate`, `PhasePredicateContext`) exported as `@experimental`
 - quantum: add Measurement primitive for sampling and stats (experimental) with unit tests

### Quality / Tests
- tests: eliminate React act warnings in `AutosaveIndicator` and `UndoRedoControls` test suites; stabilized Undo/Redo UI test after prior duplication.
- tests: add adapter lifecycle test suites (story & storage)
- tests: add concurrency evaluation test for independent engine progression
- tests: add negative-path telemetry cases: condition evaluation structuredError + expression.evaluate(ok=false); storage save/load/delete/clear failures emit storage.op ok=false
- tests: tighten typings in telemetry tests (replace any-casts with QEvent, use public engine API)
- tests: add mock storage adapters (failing, flaky, slow) with initial test coverage
- tests: add telemetry sampling & overflow strategy coverage (drop vs drop-oldest), disabled->enabled toggle, stats latency p50/p95 assertions
 - tests: add PerfReporter unit tests (spans, record, summary, flush timer)
 - tests: add ThreadPool unit tests for simulated jobs and stats; ensure clean shutdown between tests

### Performance / Tooling
- perf: add micro-benchmark script (`npm run perf:micro`) for feature flags & measurement sampling
- logger: improved object serialization to avoid `[object Object]` noise and handle circular references.
- build: add API Extractor config (`dx:api-report`) and Typedoc generation script (`docs:typedoc`)
- hot-reload: optimized delta application path (adaptive strategy) reducing 100-node patch from ~60ms to <5ms; test threshold tightened (<10ms)
- memory: lightweight undo history snapshots (flags + nodeId only) cut peak test memory from ~495MB to ~230MB; interim cap tightened to 250MB
- memory: added flag key/value pooling (interning short strings) to prevent duplicate allocations (baseline peak unchanged in synthetic test; enables future cumulative reductions with large flag sets)
- telemetry: introduce `minimalTelemetry` engine option to emit compact scalar payloads for hot paths (node.enter, expression.evaluate) reducing per-event object allocation
 - telemetry: reduce latency stats sample buffer cap from 200 -> 100 (lower memory & faster percentile calc for small sample sets)
 - tests/perf: enable `minimalTelemetry` in performance-focused test suites (memory, hot-reload, conditional choices) to better reflect production perf mode and reduce allocation noise during benchmarks
 - tests/perf: stabilize core memory test by asserting on delta from a local baseline, avoiding cross-suite heap noise flakiness in CI


_Nothing yet._

## [1.3.2] - 2025-08-26

### chore(docs)

- Fix README telemetry wiki link to absolute URL for npm rendering
- Update README latest banner to v1.3.1

### Notes

- Docs-only patch. No runtime behavior changes.

## [1.3.1] - 2025-08-25

### Changed 📝

- README updated for v1.3.0 features (qnce-import, persistence adapters, qnce-play storage + non-interactive)
- NPM package republish to ensure accurate README on package page

> Patch release to align public docs with 1.3.0 functionality. No code changes.

## [1.3.0] - 2025-08-25

### Added ✨

- Story import CLI (`qnce-import`) with adapters:
  - Custom JSON (strict/lenient validation with JSON Schema)
  - Twison/Twine JSON (passages, links, robust start detection; tags mapped to `node.meta.tags`)
  - Minimal Ink JSON (developer preview; enable `--experimental-ink` for richer mapping)
- Persistence adapters (Memory, LocalStorage, SessionStorage, File, IndexedDB) with a simple factory
- Engine integration helpers: `attachStorageAdapter`, `saveToStorage`, `loadFromStorage`, `listStorageKeys`, etc.
- `qnce-play` CLI support for persistence backends and a scriptable non-interactive mode

### Changed 🔧

- Validation hardening: semantic checks for starting node and dangling links
- Documentation: New wiki pages and CLI docs for import and persistence; examples expanded

### Quality 🧪

- New adapter and CLI tests; full suite green across Node and jsdom projects

> This release delivers the Sprint 4.0 scope (Import + Persistence) as version 1.3.0.

## [1.2.3] - 2025-08-16

### Changed 📝

- **Documentation Consistency** – Standardized wiki footer/navigation across pages
- **Version Alignment** – Bumped library version to 1.2.3 (no engine code changes since 1.2.2)

### Housekeeping 🧹

- Minor README and metadata alignment preparing for next feature cycle

> Note: A temporary `v1.3.0` tag existed earlier in history but did not introduce new engine features compared to 1.2.x. The authoritative current release is 1.2.3; future feature work will target an upcoming 1.3.x milestone.

## [1.2.2] - 2025-07-05

### Security 🔒

- **Repository Security Audit** - Comprehensive security review and cleanup of public repository
- **Professional Metadata** - Updated package author and maintainer information to professional standards
- **Documentation Sanitization** - Removed internal development processes and team-specific references
- **Enhanced Protection** - Improved .gitignore patterns to prevent future sensitive file exposure

### Repository Cleanup 🧹

- **Removed Internal Files** - Eliminated chat logs, process documents, and internal development documentation
- **Standardized Attributions** - Updated all script and code attributions to professional standards
- **Clean Public Presentation** - Ensured all public-facing content maintains professional quality

## [1.2.1] - 2025-07-05

### Fixed 🐛

- **TypeScript Compatibility** - Fixed Set spread operator compatibility issue in condition.ts for better cross-environment support
- **Documentation Links** - Updated package.json with correct homepage and bugs URLs for improved NPM integration

### Enhanced 📚

- **Complete Documentation Overhaul** - Comprehensive documentation update for v1.2.0 features
  - Added React UI Components section with useQNCE hook, UndoRedoControls, and AutosaveIndicator
  - Enhanced Getting Started guide with current v1.2.0 React integration patterns
  - Expanded API Reference with complete TypeScript interfaces and practical examples
  - Updated Home page with State Management and UI Components feature highlights
  - Added missing v1.2.0 features to Release Notes (State Persistence, React UI, Undo/Redo)
- **Code Quality** - All documentation examples now compile successfully with TypeScript
- **Package Metadata** - Enhanced NPM package information for better discoverability

## [1.2.0] - 2025-07-03

### Added ✨

- **💾 State Persistence & Checkpoints** - Robust save/load and checkpoint features for autosave, undo, and scenario replay.
  - `saveState()` / `loadState()` for full serialization.
  - `createCheckpoint()` / `restoreFromCheckpoint()` for lightweight in-memory snapshots.
  - Data integrity via optional checksum validation.

- **🌿 Advanced Branching System** - Create dynamic, multi-path narratives with conditional logic and real-time content updates.
  - AI-driven content generation for dynamic story expansion.
  - Real-time branch insertion and removal.

- **⚡ Performance Infrastructure** - Enterprise-grade optimizations for large-scale narratives.
  - **Object Pooling:** Over 90% reduction in memory allocations.
  - **Background Processing:** Non-blocking cache preloading and telemetry.
  - **Hot-Reload:** Live story updates in <3.5ms with delta patching.

- **🖥️ Live Monitoring CLI** - `qnce-perf` command for real-time performance monitoring, live updates, and data export.

### Changed 🔧

- **Core Engine** - Refactored to support new persistence and branching features.
- **API** - `QNCEEngine` now includes methods for state management and branching.
- **Documentation** - Updated `README.md` and `wiki/API-Reference.md` with new features.

---

## [1.0.0] - 2025-07-01

### Added ✨
- **Core QNCE Engine** - Framework-agnostic narrative engine with quantum-inspired mechanics
- **TypeScript Support** - Full type definitions for all interfaces and functions
- **CLI Tools** - `qnce-init` and `qnce-audit` commands for project management
- **Demo Story** - Complete example narrative demonstrating quantum mechanics
- **Developer Experience** - Examples and comprehensive documentation

#### Developer Features
- **Examples** - Quantum Garden demo showcasing advanced narrative patterns
- **Integration Guide** - Complete setup instructions for any framework
- **API Documentation** - Comprehensive reference for all engine methods
- **Performance Focus** - Optimized for fast narrative transitions

### Technical Details 🔧
- **Core API** - `createQNCEEngine()`, `selectChoice()`, `getFlags()`, etc.
- **Data Models** - `StoryData`, `NarrativeNode`, `Choice`, `QNCEState` interfaces
- **CLI Commands** - Project initialization and story validation tools
- **Type Safety** - Proper TypeScript types throughout

### Initial Release Features
- ✅ **Superposition** - Multiple narrative outcomes until choice collapse
- ✅ **Entanglement** - Early decisions affect later story outcomes  
- ✅ **Flag System** - Dynamic state tracking across narrative progression
- ✅ **Node Graph** - Flexible story structure with choice-driven navigation
- ✅ **Framework Agnostic** - Works with React, Vue, vanilla JS, or any framework

### Published Package 📦
- **NPM Package** - `npm install qnce-engine`
- **GitHub Repository** - https://github.com/ByteSower/qnce-engine
- **MIT License** - Open source and community-friendly
- **Complete Distribution** - Ready-to-use package with examples and documentation

---

## Planned Releases

### [0.2.0] - Upcoming
- **Enhanced Performance** - Further optimization improvements
- **Advanced Features** - Additional narrative mechanics
- **Framework Integrations** - React and Vue adapters
- **Community Features** - User-requested enhancements

### [0.3.0] - Future  
- **Advanced Tooling** - Enhanced development experience
- **Plugin System** - Extensible engine architecture
- **Visual Tools** - Story design and editing interfaces

---

*QNCE Engine - Empowering interactive narratives with quantum-inspired mechanics.*
