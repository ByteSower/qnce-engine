<!--
	NOTE: This file previously contained internal planning details.
	It has been intentionally sanitized to remove sensitive roadmap & process content.
	Public-facing milestones are now maintained in docs/PUBLIC_ROADMAP.md.
	Do NOT reintroduce granular sprint artifacts or internal charters here.
-->

# (Sanitized) Internal Roadmap Placeholder

This file has been replaced as part of a repository hardening pass.

Refer to the public high-level roadmap:
`./PUBLIC_ROADMAP.md`

For historical context consult private internal planning systems (not in this repo).

## 3. Current Engine State Snapshot
- Peak memory stable within target delta (≤150MB growth during stress test).
- Hot-reload patch cycle well below 2ms frame budget.
- Condition evaluation & choice filtering within tightened thresholds.
- Background perf flush sometimes logs queue limit warnings (non-fatal, deferred refinement).
- Flush metrics now available (`getPerfFlushMetrics`) providing empirical basis for adaptive tuning (backoff, suppression, dynamic batching).

## 4. Deferred / Backlog Refinements
These are improvements intentionally postponed to keep focus on core milestones.

| ID | Title | Category | Rationale | Proposed Approach | Priority |
|----|-------|----------|-----------|-------------------|----------|
| R1 | Suppress perf queue warnings in tests | DX / Logging | (Completed) | Delivered via env flag `QNCE_SUPPRESS_PERF_WARN=1` | ✅ |
| R2 | Adaptive flush backoff | Performance | (Completed) | Exponential capped delay (<=500ms) after reject streak | ✅ |
| R3 | Retry on telemetry write rejection | Reliability | Reduce event loss under burst | Limited retry (1–2 attempts) with micro-delay | Low |
| R4 | Extended interning (validation contexts) | Memory | Duplicate expression strings & flag refs | Intern rule IDs, expression cache keys | High |
| R5 | Pool validation / condition evaluation context objects | Performance/Memory | High churn objects each evaluation | Introduce small object pool keyed by size bucket | High |
| R6 | Adaptive batch sizing (dynamic) | Performance | (Completed – Beta) | Dynamic sizing tiers + shrink on rejection streak | ✅ (Beta) |
| R7 | Test-mode elevated queue limit | Testing | Avoid artificial contention in integration tests | Detect `NODE_ENV=test` and raise queueLimit | Low |
| R8 | Further memory target (<100MB delta) | Memory | Ambitious long-session optimization | Combine R4, R5 plus more aggressive metadata stripping | Stretch |
| R10 | Telemetry sampling adaptive rate | Telemetry | Reduce noise under sustained high volume | Adjust sampleRate based on moving average throughput | Low |

## 5. Next Planned Milestone
Completed: R1 + R2 delivered. R6 adaptive sizing shipped (beta). 

Candidate (Phase 2 start): **Adaptive Refinement & Reliability (R3 + R10 + Rejection Smoothing)**

Objectives (Target version: 1.4.0):
1. Implement limited retry on dispatch rejection (R3) – single retry with jitter guard, bounded by latency p95 ceiling.
2. Add adaptive telemetry sampling (R10) – dynamic sample rate based on moving average events/sec & rejectionRate.
3. Introduce percentile smoothing (EMA or sliding window) for p95 to stabilize scaling decisions.
4. Expose `backoffActive` boolean + `consecutiveRejects` in metrics snapshot (observability).
5. Add tests: retry success path, capped retry failure, sampling rate convergence, smoothing stability under synthetic latency noise.

Exit Criteria:
- Rejection rate <5% under synthetic burst scenarios.
- Retry adds <10% latency overhead (median) vs baseline.
- Adaptive sampling reduces emitted event volume ≥30% at >5k events/sec without breaching accuracy thresholds for aggregate counters.

## 6. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Over-interning increases retention of rarely-used strings | Cap pool sizes; skip >64 length |
| Pool contention causing hidden bugs | Extensive tests with randomized allocation/release patterns |
| Adaptive flush backoff delays critical telemetry | Keep minimalTelemetry unaffected; hard cap delay (e.g., 500ms) |
| Retry logic amplifies burst load | Cap attempts (<=1 extra) + jitter; collect metrics before extending |
| Dynamic sampling hides rare anomalies | Always include error & structuredError events (never sampled) |

## 7. Metrics To Track Going Forward
- Memory delta after 10k mixed operations (target: <100MB stretch).
- Avg condition evaluation time (maintain <15ms batch target for large sets).
- Telemetry flush rejection rate (<5% sustained after Phase 2).
- Hot-reload patch time 95th percentile (<1ms for medium stories).
 - Adaptive sampling effectiveness: emitted/ingested ratio & accuracy delta (<2% variance for count metrics).
 - Retry efficacy: percent of rejected batches succeeding on retry.

## 8. Changelog Guidance
All completed items above already represented or to be appended under **Unreleased** with proper categories (Performance, Memory, Tests, Docs/Meta). Ensure future refinements add concise entries.

## 9. Open Questions (Future Exploration)
- Should minimalTelemetry optionally include aggregated counters instead of dropping metadata? (Would reduce per-event lossiness.)
- Feasibility of WASM plugin sandbox for custom evaluators? (Security/perf.)
- Structured diff output for telemetry merges to enable remote diff sync.

## 10. Execution Order Recommendation
1. R1 + R2 (log suppression & adaptive backoff leveraging new metrics)
2. R6 (dynamic batch sizing informed by stabilized rejection/latency data)
3. R8 (stretch memory push) after performance instrumentation refinements.

---
_This roadmap is a living document; update as milestones ship._# QNCE Engine – Consolidated Roadmap

Merged from original local checklist and current sprint plan. This tracked file replaces the ignored local planning file and sprint fragments. All future roadmap edits should update this file plus the changelog.

## Progress Snapshot
- Core Stabilization: partial (hot path + one optimization outstanding)
- API / DevEx: partial (TS declarations completion + DX sanity pass pending)
- Advanced Primitives: baseline delivered (quantum features behind flags)
- Testing & Quality: negative-path telemetry done; mock adapters & coverage targets pending
- Documentation: foundational docs done; deep dives & quickstarts pending
- Performance: benchmarks scaffolded; hot path + telemetry cost targets pending

Legend: [x] done · [ ] pending · [~] in progress · [△] optional/backlog

---
## 1. Core Stabilization
- [x] Public API inventory & lock-down
- [x] Release / deprecation policy
- [x] StoryAdapter lifecycle validated
- [x] StorageAdapter lifecycle validated
- [x] Hook ordering & cancellation semantics
- [x] Baseline benchmark: load + initial superposition < 50ms @ 1k nodes
- [ ] Hot path optimization: flag checks, adapter lookups, renderer hydration

### Next Core Action
Measure baseline flag check cost (ns/op) & implement micro cache to target ≥15% reduction.

## 2. API Design & Developer Experience
- [~] Complete TypeScript declarations (public-only pruning pass)
- [x] Helper types for quantum primitives
- [ ] DX sanity pass across VS Code / WebStorm / Vim LSP
- [x] Fluent builder design draft
- [x] Structured error objects
- [x] Debug mode with detailed transition logs
- [x] Release tags (@public/@experimental) enforced via API Extractor

### Next API/DevEx Actions
1. Export surface audit script (dx:api-inventory already present) -> add failing CI guard for stray internal types.
2. Author TS declaration pruning checklist (include criterion: no internal symbol leaks, all experimental flagged).

## 3. Advanced Narrative / Quantum Primitives
- [x] Phase API (superposition)
- [x] Entangler
- [x] Measurement primitive (experimental)
- [x] Feature flags gating (`attachQuantumFeatures`)
- [x] Examples + basic tests

## 4. Testing & Quality Gates
- [x] Concurrent evaluation tests
- [x] Negative-path telemetry tests (condition & storage failures)
- [ ] Mock adapters: failure, retry, timeout scenarios (structured errors + telemetry assertions)
- [ ] E2E story playback final-state assertions
- [ ] Coverage Phase 1 ≥85% core modules
- [ ] Coverage Phase 2 ≥90% core modules
- [ ] Pre-merge: lint (no errors), format, typecheck gate in CI (lint currently warnings)
- [ ] Performance tests: timings + memory <50MB @ 10k nodes
- [ ] Jest open handle elimination (detectOpenHandles) / unref timers

### Immediate Quality Focus
Implement mock adapters (storage slow/fail, telemetry backpressure simulation) + tests to drive reliability metrics.

## 5. Documentation & Examples
- [x] API reference config (Typedoc) & generation script
- [x] Beginner guide & experimental API section
- [x] Quantum integration example
- [ ] Quickstart: "Build a quantum story in 5 minutes"
- [ ] Deep dives: superposition / entanglement / measurement
- [ ] Error Handling & Debug Mode page
- [ ] Profiling summary subsection in PERFORMANCE docs
- [ ] Case studies (Quantum Chronicles, Echo Garden)
- [ ] Short video demos (CLI + integration)

### Docs Next
Draft Error Handling & Debug Mode page (reuse structured error taxonomy + telemetry hooks), then add Quickstart.

## 6. Packaging & Distribution
- [ ] Decide mono vs multi-package (adapters extraction)
- [ ] Automate changelog (Conventional Commits tool)
- [ ] Bundle ESM + CJS + UMD targets
- [ ] Publish .d.ts integrity checks (size & diff) per release
- [ ] Back-compat matrix (engine ↔ adapters)

## 7. Community & Feedback
- [ ] Early adopters program (5–10 teams)
- [ ] Public roadmap (GitHub Projects) sync with this file
- [ ] Issue labels (help-wanted, good-first-issue) curated
- [ ] Biweekly updates & discussion channel

## 8. Non-Functional Requirements
- [ ] Telemetry emit p50 <1ms (Node 18) under nominal load
- [ ] Async adapters fail gracefully (structured errors + telemetry)
- [ ] 10k nodes memory footprint acceptable (<50MB target)
- [ ] Privacy: no PII in telemetry by default (documented)
- [ ] Compatibility: Node LTS, modern browsers, ESM/CJS/UMD bundles

## 9. Success Criteria (pre-1.0 stabilization)
- [ ] ≥90% core coverage
- [ ] Zero high-priority bugs two weeks post-release
- [ ] 5+ early adopter positive signals
- [ ] >50 npm weekly downloads first month of 1.0.0

## 10. Performance Initiatives
- [~] Hot-reload delta patch timing (<3ms maintained; need <2.5ms stretch)
- [ ] Condition evaluation avg time reduction ≥15%
- [ ] Add large-scale conditional choice benchmark (10k choices synthetic) & document results
- [ ] Telemetry backpressure policy configurability (drop/batch/await)
 - [ ] Percentile smoothing (EMA / bi-modal detection) for latency.
 - [ ] Adaptive sampling (dynamic rate) preserving error events.
 - [ ] Retry-once flush dispatch (bounded, metrics instrumented).
 - [ ] Export additional perf metrics: backoffActive, consecutiveRejects.

## 11a. Observability & Telemetry Reliability Track (New)

Milestones:
| ID | Item | Target | Status | Notes |
|----|------|--------|--------|-------|
| T1 | Retry-once flush dispatch | 1.4.0 | Planned | Respect latency ceiling & rejectionRate guard |
| T2 | Dynamic sampling | 1.4.0 | Planned | Adjust sampleRate via EMA on events/sec |
| T3 | Percentile smoothing | 1.4.0 | Planned | Stabilize p95 for batch scaling decisions |
| T4 | Export backoffActive & consecutiveRejects | 1.4.0 | Planned | Snapshot introspection |
| T5 | Telemetry queue policy doc | 1.4.x | Planned | Document drop vs drop-oldest tradeoffs |

Success Criteria:
- p95 latency variance reduced ≥25% under synthetic jitter.
- Emitted volume reduction ≥30% at high throughput with negligible accuracy loss on aggregate counters.

## 11b. Quantum Performance Alignment (Exploratory)
Focus: Ensure quantum feature (Phase, Entangler, Measurement) overhead remains negligible in perf mode.

Planned Tasks:
1. Micro-bench measurement sampling overhead (baseline vs 10k samples) – target <5% incremental time.
2. Pool or reuse intermediate probability structures (if measurable allocation hotspots).
3. Add quantum-focused scenario benchmark to perf script suite.

## 11c. CLI & Tooling Enhancements
| Feature | Goal | Status |
|---------|------|--------|
| `qnce-perf dashboard` color thresholds v2 | Improve anomaly visibility | Planned |
| `qnce-report` aggregate exporter | Summarize multi-run metrics | Backlog |
| `qnce-perf trace` | Emit structured perf event stream (NDJSON) | Backlog |

## 11d. Hardening & Release Criteria (Pre-1.0 Gate)
Additions to existing success criteria:
- Flush pipeline resilience (retry + sampling + smoothing) validated under synthetic burst harness.
- No unref'd timers / open handles across test matrix.
- Minimal quantum feature overhead (<5% added latency in mixed benchmark).

## 11e. Execution Wave Plan
Wave 1 (1.4.0): Retry-once, dynamic sampling, p95 smoothing, metric extensions.
Wave 2 (1.4.x): Queue policy configurability doc, CLI threshold enhancements, quantum perf benchmarks.
Wave 3 (1.5.0): Telemetry trace mode, adaptive sampling refinement (multi-tier), memory stretch goal revisit.

## 11. Active Sprint (Embedded Summary)
Scope this sprint (quality & reliability hardening):
1. Mock adapters (failure/retry/timeout) + telemetry assertions
2. Open-handle detection & timer unref fixes
3. Replace critical `any` in CLI (import/play) with structured types + logger abstraction
4. Error Handling & Debug Mode doc page
5. Storage retry/backoff design (doc + acceptance tests outline)

## 12. Backlog / Optional Enhancements
- [△] Publish Typedoc artifacts in CI (attach or deploy)
- [△] Measurement deep dive doc & examples
- [△] Performance micro-benchmark methodology doc + snapshot
- [△] Structured release tag policy doc
- [△] Scenario-based performance tuning guide
- [△] 3‑minute developer quickstart video
- [△] Logger abstraction (levels, sink adapters) replacing direct console usage
- [△] React test utilities wrapping async updates in act()
- [△] Telemetry queue metrics (drops, depth) accessible via API instead of console
- [△] Aggregated telemetry reporting CLI (`qnce-report`)

## 13. Prioritized Next Seven Tasks (Execution Order)
1. Implement mock storage & telemetry adapters (fail/slow/retry) + tests
2. Add logger abstraction & migrate `import.ts` / `play.ts` away from console
3. Draft Error Handling & Debug Mode doc
4. Add jest --detectOpenHandles run locally; patch unref timers
5. Large conditional choice benchmark & baseline numbers
6. Storage retry/backoff design (exponential + jitter) + test scaffold (skipped initially)
7. Replace remaining critical `any` types in CLI & tests (reduce lint noise by ~15 warnings)

## 14. Acceptance Criteria Templates
### Mock Adapters
- Fail adapter returns structured error telemetry with engine.structuredError + storage.op ok=false
- Retry adapter emits attempt count meta, succeeds within max attempts, recorded latency percentiles
### Logger Abstraction
- Zero raw console.* calls in CLI sources (eslint no-console passes) except through logger
### Condition Benchmark
- Report p50/p95 evaluation times before & after optimization; improvement ≥15%

---
Maintain this file; update CHANGELOG under Unreleased (Docs/Meta) for substantive modifications.
