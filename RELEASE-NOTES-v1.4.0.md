# QNCE Engine 1.4.0 – Performance Adaptation & Observability

Release Date: 2025-09-14

This release focuses on adaptive performance telemetry, reliability groundwork, and deeper observability for tuning large narrative workloads. Several features are intentionally marked **@beta** to allow heuristic refinement during the 1.4.x line.

## 🚀 Highlights
- Adaptive flush backoff with capped exponential delay reducing queue contention during bursts.
- Dynamic batch sizing scaling up under healthy latency and shrinking under contention.
- Retry-once dispatch logic (guarded) reducing transient rejection loss without uncontrolled amplification.
- Rejection rate and extensive flush metrics (including EMA-smoothed p95) enabling data-driven tuning.
- Condition evaluation pooling & expression canonicalization for reduced allocation churn and redundant string work.

## 🔬 Observability & Metrics
`getPerfFlushMetrics()` now exposes:
- `rejectionRate`, `consecutiveRejects`, `backoffActive`
- `lastEffectiveBatchSize`, `adaptiveEnabled`
- Percentiles + smoothed p95 (`smoothedP95DispatchLatencyMs`)
- Histogram buckets for dispatch latency (internal use)

These support future auto-sampling and reliability strategies (adaptive sampling scaffold included under env flag).

## ♻️ Performance Improvements
- Object pooling of evaluation contexts in performance mode (reduces GC pressure in heavy branching scenarios).
- Canonicalization + interning of condition expression strings (hash/LRU) to minimize duplicate allocations.
- Reduced latency stats buffer size (200→100) for faster percentile updates and lower memory footprint.

## 🧪 Reliability Groundwork (@beta)
- Retry-once logic for flush dispatch (bounded + telemetry-aware) – collects baseline data before potential expansion.
- Adaptive sampling scaffold (env: `QNCE_ADAPTIVE_SAMPLING=1`) – currently passive simple strategy.

## 🛠 Developer & DX Enhancements
- Toggle to disable adaptive batch sizing (`disableAdaptiveBatch` or env `QNCE_DISABLE_ADAPTIVE_BATCH=1`) for deterministic benchmarking.
- Internal latency injection & thread pool hooks for deterministic test scenarios.
- Expanded logger utility + structured logging in CLI paths.

## 🔧 Tooling & Quality
- API Extractor enforced release tagging (treat missing tags as error) for disciplined public surface evolution.
- New DX scripts: `dx:api-report`, `dx:api-warnings`, `perf:conditions`, micro-bench harness.
- Extended test coverage: adaptive sizing up/down, retry success/failure, sampling scaffold, backoff suppression, pooling, metrics integrity.

## 📚 Documentation Updates
- Consolidated performance docs (`PERFORMANCE_GUIDE.md` merged into `docs/PERFORMANCE.md`).
- Roadmap expansion for Phase 2 reliability & quantum optimization track.
- Added examples for fluent builder and quantum integration.

## ⚠️ Beta / Experimental Notes
The following features may evolve based on collected telemetry during 1.4.x:
- Adaptive batch sizing heuristics (thresholds, scale factors)
- Smoothed p95 calculation parameters
- Retry strategy (currently 1 attempt max)
- Adaptive sampling policy (currently a scaffold)

Quantum primitives remain marked **@experimental/@beta**. Breaking adjustments may occur before stabilization.

## ✅ Upgrade Guidance
No breaking API changes. To evaluate new performance features safely:
1. Start without env feature flags – defaults apply adaptively.
2. Enable sampling scaffold only if measuring event volume impact.
3. Use `disableAdaptiveBatch` for baseline comparisons.
4. Review flush metrics snapshots under synthetic load before adjusting heuristics.

## 🔭 Looking Ahead (1.4.x minors)
Planned refinements:
- Stabilize adaptive sampling with dynamic thresholds driven by moving average event throughput.
- Extend retry telemetry (success/failure ratios) to decide on multi-attempt viability.
- Additional pooling targets (validation contexts, frequently cloned metadata shapes).
- Optional external telemetry adapter guidelines & privacy filters.

For a high-level sanitized roadmap see `docs/PUBLIC_ROADMAP.md`.

---
Changelog reference: see `CHANGELOG.md` entry for [1.4.0] for full categorized list.
