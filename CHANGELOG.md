# Changelog

All notable changes to the QNCE Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


**📌 Current Version: [1.4.1] - 2026-02-25**


## [Unreleased]

## [1.4.1] - 2026-02-25
### Added ✨
- perf: configurable EMA smoothing via `smoothingAlpha` in `PerfReporterConfig` (@beta)
- perf: richer flush metrics snapshot: `rejectedFlushesSinceLastSuccess`, `backoffDelayMs` (@beta)
- cli(perf): `stream` command outputs NDJSON lines with `summary`, `flush`, and thread pool stats; `export` now includes `flushMetrics`

### Changed 🔧
- api: updated public API report and annotated `PerfFlushMetrics`/`getPerfReporter` with release tags (@beta)

### Security 🔒
- **Safe condition evaluator**: Replaced `new Function` dynamic code execution in `src/engine/condition.ts` with a whitelist-only recursive-descent parser/evaluator. Only `flags.<name>`, `state.<name>`, `customData.<name>`, `timestamp`, comparison/logical/arithmetic operators, parentheses, and primitive literals are accepted. Unknown identifiers are rejected at parse time, eliminating the code-injection surface.
- **Updated SECURITY.md** with an explicit note describing the safe expression evaluation policy and whitelisted grammar.

### Tooling 🛠️
- **ESLint**: Added `no-eval` and `no-new-func` rules (both as errors) to `.eslintrc.js` to enforce the ban on dynamic code execution at source level. Lint is now a blocking CI step.
- **CI dist scan**: Added a build step in `ci.yml` that fails the workflow if `eval(` or `new Function` appears in the compiled `dist/` output after every build.
- **Workflow hardening** (`performance-regression.yml`): publish job now requires `github.ref_type == 'tag'` in addition to `startsWith(github.ref, 'refs/tags/v')`, adds least-privilege `permissions` block (`contents: read`, `id-token: write`), and removes the `--tag sprint2` dist-tag (defaults to `latest`).
- **Removed empty workflow** `.github/workflows/ci-cd.yml` (file contained no jobs).
- **`package.json#files`**: Removed `scripts/perf-conditions.ts` development source file from the npm publish list.

## [1.4.0] - 2025-09-14
### Performance
 - Added condition evaluator expression canonicalization (sanitized + interned) with LRU cache.
 - Enabled context object pooling for condition evaluation in performance mode (reduces allocation churn during heavy conditional choice filtering).
 - Instrumented PerfReporter with flush metrics (counters, latency percentiles, histogram buckets, snapshot API) to enable adaptive strategies.
 - Adaptive perf flush backoff (R2): exponential (capped at 500ms) delay introduced after consecutive background dispatch rejections to reduce queue pressure.
 - Dynamic batch sizing (R6): PerfReporter adapts flush batch size based on backlog depth, p95 latency tiers (<25ms / <50ms), and rejection streak shrinkage heuristics. Scales up to ~3–4x base when healthy; shrinks under pressure.
 - Rejection rate metric: `rejectionRate` (0–1) for health assessment and future tuning inputs.
 - Exposed `lastEffectiveBatchSize` and `adaptiveEnabled` in flush metrics snapshot for observability of sizing decisions. (@beta)
 - Retry-once flush dispatch logic (R3 groundwork) with guarded single retry on initial rejection while latency healthy. (@beta)
 - EMA-smoothed p95 latency export `smoothedP95DispatchLatencyMs` for early stabilization experimentation. (@beta)
 - Export additional observability fields: `backoffActive`, `consecutiveRejects`. (@beta)
 - Introduced optional adaptive sampling scaffold (env `QNCE_ADAPTIVE_SAMPLING=1`) – currently passive simple rate strategy. (@beta, experimental)
 - Added adaptive batch sizing disable flag (`disableAdaptiveBatch` or env `QNCE_DISABLE_ADAPTIVE_BATCH=1`) for deterministic benchmarking. (@beta)
 - Internal test-only helpers: latency injection (`__injectLatencySample(ms)`) & thread pool override hook for deterministic retry simulation. (@internal)

### Added
 - perf: condition evaluation micro-benchmark script (`npm run perf:conditions`) reporting cold vs warm p50/p95/min/max.
 - TimeoutSaveAdapter mock to simulate network timeouts validating retry attempt telemetry.
 - Telemetry `overflowStrategy` option ('drop', 'drop-oldest', 'error') for configurable backpressure handling.
 - Engine option `suppressTelemetryWarnings` to silence benign queue overflow warnings in perf-mode tests (plus env `QNCE_SUPPRESS_PERF_WARN=1`).
 - Engine storage save retry/backoff policy (exponential with jitter) configurable via `setStorageRetryPolicy`.
 - Internal logger injection (replace `console.warn`) + public `getLogger()` accessor and `dispose()` method for resource cleanup.
 - Quantum experimental primitives: Entangler, Phase, Measurement, FeatureFlags utility, helper types (`FeatureFlagKey`, `EntangleTransform`, `PhasePredicate`, `PhasePredicateContext`). (@experimental / @beta tagging alignment)
 - Fluent builder prototype & quantum integration example.

### Changed 🔧
 - Annotated experimental telemetry & quantum APIs with recognized TSDoc release tags (`@beta`) alongside `@experimental` to satisfy API Extractor.
 - Updated re-exports to consistently carry release tags.
 - Hot-reload delta path optimized (100-node patch ~60ms -> <5ms) with tightened test threshold.
 - Latency stats sample buffer cap reduced 200 -> 100 for lower memory and faster percentile calculations.
 - Undo history snapshots trimmed (flags + nodeId only) reducing peak test memory (~495MB -> ~230MB) and interim cap tightened to 250MB.

### Fixed 🐛
 - Unref perf reporter flush interval & added `dispose()` to reduce open-handle leaks.

### Tooling 🛠️
 - API Extractor: treat `ae-missing-release-tag` as an error enforcing tagging discipline.
 - CI workflow: build, test, and run API Extractor (fails on API drift); lint currently non-blocking pending cleanup.
 - Added `dx:api-report`, `dx:api-warnings`, `dx:api-inventory` scripts.
 - Logger utility introduced; CLI (import/play) migrated to structured logging with quiet/verbose flags.
 - Added Typedoc config and generation script (dev only).

### Docs / Meta
 - Consolidated duplicate performance docs: merged `PERFORMANCE_GUIDE.md` into canonical `docs/PERFORMANCE.md`.
 - Added `docs/ROADMAP.md` with completed milestones & deferred backlog.
 - Expanded roadmap for Phase 2 telemetry reliability & adaptive refinement (retry, dynamic sampling, percentile smoothing, observability metrics) plus quantum perf & CLI tooling plans.
 - Added Error Handling & Debug guide + Deprecation Policy + Adapter Lifecycle reference.
 - Added Beginner Guide & Experimental API section; README links updated.

### Tests 🧪
 - Added coverage: condition pooling, perf flush metrics, backoff suppression, dynamic batch sizing upscale/downscale, adaptive disable mode, retry scenarios (timeout success/failure), telemetry sampling & overflow strategies, latency stats, PerfReporter spans & flush timer, ThreadPool jobs & clean shutdown.
 - Added negative-path telemetry tests (structured errors and storage op failures), adapter lifecycle suites, concurrency progression test, mock storage adapters (failing/flaky/slow), quantum primitives tests.
 - Stabilized UI tests (removed React act warnings) and hot-reload perf threshold.
 - Enabled `minimalTelemetry` in perf-focused suites; added memory delta assertions for stability.

### Performance / Benchmarks
 - Micro benchmarks (`perf:micro`, `perf:conditions`) & performance scripts for latency sampling and condition evaluation.
 - Improved serialization & logging object formatting (avoid noisy `[object Object]`).

### Examples
 - Added quantum integration & fluent builder prototype examples.

### Notes
 - Several performance features (adaptive sizing, sampling scaffold, smoothed p95) are marked @beta and may adjust thresholds & heuristics in 1.4.x minors.
 - Experimental quantum APIs remain opt-in; stability targeted for a later 1.5.x track.

---
## [1.3.2] - 2025-08-26

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
