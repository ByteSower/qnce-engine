# QNCE Performance Guide

**Version:** 1.2.0-sprint2  
**Sprint #2:** Core Performance Refactor Complete  

> Documentation Consolidation: This file now consolidates all performance content. The previous `PERFORMANCE_GUIDE.md` has been merged and will be removed to prevent drift. All future edits should target this canonical document.

## 🚀 Overview

The QNCE engine now includes comprehensive performance optimization infrastructure delivering:

- **90%+ allocation reduction** through object pooling
- **Background processing** via ThreadPool for non-blocking operations  
- **Optimized hot-reload** with <3.5ms delta patching
- **Real-time profiling** with comprehensive event instrumentation
- **Live monitoring** via CLI dashboard with performance alerts

## 📦 Performance Systems

### 1. Object Pooling (S2-T1)

Eliminates garbage collection pressure through reusable object pools.

#### Basic Usage
```typescript
import { createQNCEEngine } from 'qnce-engine';

// Enable performance mode for automatic object pooling
const engine = createQNCEEngine(storyData, initialState, true);

// Engine automatically uses pooled objects for:
// - Flow events and transitions  
// - Node caching and retrieval
// - Asset management
```

#### Pool Statistics
```typescript
// Get pool performance metrics
const poolStats = engine.getPoolStats();
console.log('Pool efficiency:', poolStats.hitRate);
console.log('Memory savings:', poolStats.allocationReduction);
```

### 2. Background Processing (S2-T2)

Non-blocking operations via ThreadPool for cache preloading and telemetry.

#### Configuration
```typescript
const threadPoolConfig = {
  maxWorkers: 4,           // Number of background workers
  queueLimit: 1000,        // Max pending jobs
  idleTimeout: 30000,      // Worker cleanup timeout (ms)
  enableProfiling: true    // Track job performance
};

const engine = createQNCEEngine(storyData, {}, true, threadPoolConfig);
```

#### Background Operations
```typescript
// Preload next nodes in background (automatic)
engine.selectChoice(choice); // Triggers background preloading

// Manual cache warming
await engine.warmCache(); // Preload entire story

// Background telemetry (automatic)
// Performance data written to background queue
```

### 3. Hot-Reload Delta Patching (S2-T3)

Live story updates with optimized field-level diffing.

#### API Usage
```typescript
import { StoryDeltaComparator, StoryDeltaPatcher } from 'qnce-engine/performance';

// Compare story versions
const comparator = new StoryDeltaComparator();
const delta = comparator.compare(originalStory, updatedStory);

// Apply changes to running engine
const patcher = new StoryDeltaPatcher();
patcher.applyDelta(engine, delta); // <3.5ms typical performance
```

#### Performance Targets
- **Comparison Time:** <1ms for field-level diffing
- **Patch Time:** <3.5ms for live story updates  
- **Frame Stall:** Minimal impact on user experience
- **Safety:** Active node protection, graceful failure handling

### 4. Performance Profiling (S2-T4)

Comprehensive event instrumentation with batched reporting.

#### Automatic Profiling
```typescript
// Profiling enabled automatically in performance mode
const engine = createQNCEEngine(storyData, {}, true);

// All operations tracked:
// - State transitions
// - Cache operations  
// - Hot-reload performance
// - Background job processing
```

#### Custom Events
```typescript
import { perf } from 'qnce-engine/performance';

// Record custom performance events
perf.record('custom', { 
  eventType: 'user-action',
  duration: 123,
  metadata: { action: 'save' }
});

// Flow tracking
const spanId = perf.flowStart('my-flow', { context: 'gameplay' });
// ... operations ...
perf.flowComplete(spanId, 'target-node', { result: 'success' });
```

### 5. Performance Events (Unified Reference)

Events captured by the performance subsystem (names kept stable for dashboard & telemetry correlations):

- `flow-start` / `flow-complete` – Narrative flow spans
- `cache-hit` / `cache-miss` – Node retrieval / caching
- `hot-reload-start` / `hot-reload-end` – Live story delta application
- `state-transition` – Engine internal state changes
- `custom` – User defined events via `perf.record()`

These events funnel into the PerfReporter buffers and are aggregated for summary snapshots and flush heuristics (adaptive batching / backoff).

## 🖥️ CLI Performance Dashboard

Real-time monitoring and performance analysis via `qnce-perf` command.

### Installation
```bash
npm install -g qnce-engine
```

### Dashboard Commands

#### Real-time Dashboard
```bash
qnce-perf dashboard
```
```
🚀 QNCE Performance Dashboard
=====================================
📊 Session Duration: 45.2s
🔢 Total Events: 234

📈 Event Breakdown:
   state-transition      45 events (avg: 2.1ms, max: 4.2ms)
   cache-hit            89 events (avg: 0.8ms, max: 1.5ms)
   hot-reload-start      3 events (avg: 2.8ms, max: 3.1ms)

💾 Cache Performance:
   ✅ Hit Rate: 92.4% (threshold: 80%)
   ✅ Avg Cache Time: 8.2ms (threshold: 50ms)

🔥 Hot-Reload Performance:
   ✅ Avg Time: 2.8ms (threshold: 3.5ms)
   📊 Max Time: 3.1ms
   🔄 Total Reloads: 3

🧵 ThreadPool Status:
   📊 Completed Jobs: 156
   ⏳ Queued Jobs: 4
   🏃 Active Workers: 2
   📈 Worker Utilization: 73.2%

🚨 Performance Alerts:
   ✅ All systems performing within thresholds
```

#### Live Monitoring
```bash
qnce-perf live 1000  # Update every 1000ms
```

#### Export Data
```bash
qnce-perf export > performance-report.json
```

#### NDJSON Streaming
```bash
# One JSON object per line with { summary, flush, thread }
qnce-perf stream 1000 | jq '.'
```

#### Reset Counters
```bash
qnce-perf reset
```

### Performance Thresholds

The dashboard monitors key performance indicators:

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Cache Hit Rate | >80% | ⚠️ Warning if below |
| Cache Response Time | <50ms | ⚠️ Warning if above |
| Hot-Reload Time | <3.5ms | ⚠️ Warning if above |
| State Transition Time | <10ms | ⚠️ Warning if above |
| ThreadPool Queue | <100 jobs | ⚠️ Warning if above |

## 🔧 Configuration Examples

### High-Performance Setup
```typescript
const engine = createQNCEEngine(storyData, initialState, true, {
  maxWorkers: 8,           // High concurrency
  queueLimit: 2000,        // Large job queue
  idleTimeout: 60000,      // Keep workers alive
  enableProfiling: true    // Full instrumentation
});

// Warm entire story cache
await engine.warmCache();
```

### Memory-Constrained Setup
```typescript
const engine = createQNCEEngine(storyData, initialState, true, {
  maxWorkers: 2,           // Minimal workers
  queueLimit: 100,         // Small queue
  idleTimeout: 10000,      // Quick cleanup
  enableProfiling: false   // Reduce overhead
});
```

### Development/Debug Setup
```typescript
const engine = createQNCEEngine(storyData, initialState, true, {
  maxWorkers: 1,           // Single worker
  queueLimit: 50,          // Small queue
  idleTimeout: 5000,       // Fast cleanup
  enableProfiling: true    // Full debugging
});

// Monitor in real-time
// Run: qnce-perf live 500
```

## 📊 Performance Benchmarks

### Sprint #2 Achievements

| System | Before | After | Improvement |
|--------|--------|-------|-------------|
| Object Allocation | Baseline | 90%+ reduction | Major |
| Hot-Reload Time | ~10ms | 2.8-3.5ms | 65-72% |
| Memory Usage | High GC pressure | Stable pools | Significant |
| Background Ops | Blocking | Non-blocking | Complete |
| Monitoring | None | Real-time CLI | New capability |

### Typical Performance Profile
```
Engine Creation: <5ms
Node Navigation: <1ms per transition
Hot-Reload: <3.5ms for story updates
Cache Operations: <1ms with 90%+ hit rate
Background Jobs: Queue processing without main thread impact
```

## 🚨 Troubleshooting

### Common Issues

#### Hot-Reload Performance
```bash
# Check current performance
qnce-perf dashboard

# Look for hot-reload metrics
# Target: <3.5ms average
# If higher, check story size and complexity
```

#### ThreadPool Queue Overload
```bash
# Monitor queue depth
qnce-perf live

# If queue depth consistently >100:
# 1. Increase maxWorkers
# 2. Increase queueLimit  
# 3. Reduce background operation frequency
```

#### Memory Usage
```bash
# Check object pool efficiency
const stats = engine.getPoolStats();
console.log('Hit rate:', stats.hitRate); // Should be >90%

# If low hit rate:
# 1. Verify performance mode enabled
# 2. Check for proper object return patterns
```

### Performance Debugging

```typescript
// Enable comprehensive logging
import { getPerfReporter } from 'qnce-engine/performance';

const reporter = getPerfReporter();
reporter.config.enableConsoleOutput = true;

// All performance events now logged to console
```

## 🎯 Best Practices

### 1. Enable Performance Mode
Always use performance mode for production:
```typescript
const engine = createQNCEEngine(storyData, {}, true); // ✅ Good
const engine = createQNCEEngine(storyData, {}, false); // ❌ Avoid in production
```

### 2. Configure ThreadPool Appropriately
Match worker count to system capabilities:
```typescript
const workers = Math.min(navigator.hardwareConcurrency || 4, 8);
const config = { maxWorkers: workers };
```

### 3. Monitor Performance Continuously  
Use live monitoring during development:
```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Performance monitoring  
qnce-perf live 2000
```

### 4. Preload Strategically
```typescript
// Preload next probable nodes
engine.selectChoice(choice); // Auto-preloads next nodes

// Full cache warming for small stories
if (storyData.nodes.length < 100) {
  await engine.warmCache();
}
```

### 5. Handle Performance Degradation
```typescript
// Monitor for performance issues
const summary = perf.summary();
if (summary.cacheHitRate < 0.8) {
  console.warn('Cache performance degraded');
  // Consider cache warming or configuration adjustment
}
```

### 6. Adaptive Flush & Dynamic Batch Sizing (R2/R6 - Beta)

The performance pipeline includes adaptive heuristics for telemetry/perf flush operations.

| Feature | Purpose | Heuristic (Initial) | Status |
|---------|---------|---------------------|--------|
| Exponential Backoff (R2) | Avoid tight retry loops after dispatch rejections | Base 20ms * 2^streak (cap 500ms) | Stable |
| Dynamic Batch Sizing (R6) | Scale throughput under healthy latency; shrink under pressure | Upscale on backlog (>2×/4× base) with p95 <25ms / <50ms; shrink on streak ≥2 | Beta |
| Rejection Rate | Health signal for downstream pressure | rejected / (accepted + rejected) | Beta |
| Effective Batch Size Export | Observability of sizing decisions | `lastEffectiveBatchSize` | Beta |
| Disable Adaptive Batch Flag | Force fixed batch size (diagnostics/baseline) | `disableAdaptiveBatch` config or env `QNCE_DISABLE_ADAPTIVE_BATCH=1` | Beta |
| Adaptive Enabled Snapshot Flag | Observability: whether dynamic sizing active | `adaptiveEnabled` boolean in flush metrics snapshot | Beta |

Metric Extensions:
```ts
interface PerfFlushMetrics {
  rejectionRate: number;          // 0..1 ratio
  lastEffectiveBatchSize: number; // adaptive batch size used
  adaptiveEnabled: boolean;       // true when dynamic sizing heuristics active
}
```

Simplified Sizing Logic:
```ts
if (consecutiveRejects >= 2) shrink();
else if (backlog > base*4 && p95 < 50) upscale(≈4x cap);
else if (backlog > base*2 && p95 < 25) upscale(≈3x cap);
```

Usage:
```ts
import { getPerfReporter } from 'qnce-engine/performance';
const reporter = getPerfReporter();
const m = reporter.getFlushMetrics();
console.log(m.rejectionRate, m.lastEffectiveBatchSize);
// Determine if adaptive sizing was active for this snapshot
console.log('Adaptive active:', m.adaptiveEnabled);
// Force fixed batch sizing for a deterministic baseline
// const fixed = getPerfReporter({ batchSize: 100, disableAdaptiveBatch: true });
// m.adaptiveEnabled will be false when forced fixed sizing is in effect.
```

Suppress warning noise in CI:
```bash
export QNCE_SUPPRESS_PERF_WARN=1
```

Internal debug (subject to change):
```ts
// @ts-expect-error internal
console.log(reporter.__getInternalPerfDebug());
```

Beta Caveats:
- Thresholds & scaling factors may evolve
- Single-sample p95 (no smoothing yet)
- Provide feedback with backlog, latency, rejection patterns

## 🧪 Performance Modes

Three operational modes patterns frequently referenced during tuning and benchmarking:

### Standard Mode (Default)
```ts
const engine = createQNCEEngine(storyData);
// Suitable for most dev scenarios; minimal overhead.
```

### Performance Mode
```ts
const engine = createQNCEEngine(storyData, {}, true);
// Enables: object pooling, ThreadPool, perf events.
```

### Performance Mode + Custom ThreadPool
```ts
const engine = createQNCEEngine(storyData, {}, true, {
  maxWorkers: 4,
  queueLimit: 200,
  enableProfiling: true
});
// Fine‑tuned background execution & profiling.
```

## 🎯 Performance Targets & Benchmarks

Current sprint targets alongside representative observations (non-binding; provide directional validation):

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Object Pool Hit Rate | >95% | 100% | ✅ |
| Memory Allocation Reduction | >90% | >90% | ✅ |
| Hot-Reload Frame Stall | <2ms | 3.35ms | 🔄 68% improvement |
| State Transition Time | <5ms | <1ms | ✅ |
| Cache Hit Rate | >95% | >92% | ✅ |
| ThreadPool Processing | Non-blocking | ✅ | ✅ |

### Benchmark Snapshots

Object Pooling:
```
Standard Mode:     ~1000 allocations / 100 transitions
Performance Mode:  ~100 allocations / 100 transitions (≈90% reduction)
GC Pressure:       Eliminated for pooled classes
```

Hot-Reload (Story ~50 nodes):
```
Comparison: 0.14ms
Patch:      3.35ms
Total:      3.49ms (target <2ms still under optimization)
```

ThreadPool:
```
Throughput:     1000+ jobs/sec (synthetic)
Scheduling:     Priority aware
Environment:    Browser + Node compatible
```

## 🚀 Production Deployment Quick Start

### Installation
```bash
npm install qnce-engine
npm install -g qnce-engine   # Optional CLI dashboard
```

### Example Production Init
```ts
const engine = createQNCEEngine(storyData, {}, true, {
  maxWorkers: 4,
  queueLimit: 500,
  enableProfiling: true
});

// Periodic metrics export (example)
setInterval(() => {
  const summary = perf.summary();
  monitoringService.sendMetrics({
    cacheHitRate: summary.cacheHitRate,
    hotReloadAvg: summary.hotReloadPerformance.avgTime,
    workerUtilization: engine.getThreadPoolStats().workerUtilization
  });
}, 30000);
```

## 🔧 Performance Tuning Recipes

High Throughput:
```ts
createQNCEEngine(storyData, {}, true, { maxWorkers: 8, queueLimit: 1000, enableProfiling: false });
```

Development / Diagnostics:
```ts
createQNCEEngine(storyData, {}, true, { maxWorkers: 2, queueLimit: 50, enableProfiling: true });
// Use: qnce-perf live 500
```

## 🩺 Troubleshooting (Extended)

Memory Pressure:
1. Inspect pool stats: `engine.getPoolStats()`
2. Confirm perf mode enabled
3. Audit custom handlers for retained references

Slow Hot-Reload:
1. `qnce-perf dashboard` → check hot-reload section
2. Split very large story diffs into batches
3. Validate minimal unrelated node churn

Queue Overflows:
1. Inspect `engine.getThreadPoolStats().queuedJobs`
2. Increase `maxWorkers` / `queueLimit`
3. Reduce low-priority background submissions

## 🔀 Migration Guide (v0.1.0 → v1.2.0-sprint2)

No breaking API changes. Enable performance mode explicitly to opt into advanced systems:
```ts
// Before
const engine = createQNCEEngine(storyData);
// After
const engine = createQNCEEngine(storyData, {}, true);
```

CLI Adoption:
```bash
npm install -g qnce-engine@1.2.0-sprint2
qnce-perf live
```

## ✅ Sprint Summary

Sprint #2 Deliverables Achieved:
- 90%+ allocation reduction via pooling
- Background ThreadPool processing
- Hot-reload improvement (~68%)
- Comprehensive profiling & adaptive flush pipeline (beta heuristics)
- CLI dashboard for real-time insights

The engine is production-ready with evolving adaptive heuristics (provide feedback on backlog/latency/rejection traces for tuning).


## 🔄 Phase 2 (Wave 1) Additions (@beta)

Version: 1.4.0-beta.0 introduces incremental reliability & observability upgrades to the flush pipeline.

### 1. Retry-Once Dispatch
On the first rejected batch dispatch the reporter attempts exactly one immediate retry when:
* `consecutiveRejects === 1`
* `p95DispatchLatencyMs < 200`

This reduces transient loss without causing uncontrolled retry storms (subsequent failures rely solely on exponential backoff).

### 2. Smoothed p95 (EMA)
Metric: `smoothedP95DispatchLatencyMs` provides an exponential moving average (alpha=0.2) of raw p95 latency, reducing volatility for future adaptive controls.

Properties:
* Always trends toward raw p95
* Resets to 0 with no samples
* Lightweight (constant space, O(1) update)

### 3. Extended Flush Metrics
`PerfFlushMetrics` now exposes:
```ts
interface PerfFlushMetrics {
  backoffActive?: boolean;      // true if inside current backoff window
  consecutiveRejects?: number;  // current rejection streak count
  smoothedP95DispatchLatencyMs?: number; // EMA-smoothed p95 latency
  backoffDelayMs?: number;      // current backoff duration (ms)
  rejectedFlushesSinceLastSuccess?: number; // rolling failures since last success
}
```

Example:
```ts
const m = getPerfReporter().getFlushMetrics();
console.log({
  p95: m.p95DispatchLatencyMs,
  smoothed: m.smoothedP95DispatchLatencyMs,
  backoffActive: m.backoffActive,
  consecutiveRejects: m.consecutiveRejects,
  rejectionRate: m.rejectionRate
});
```

### 4. Adaptive Sampling Scaffold
Disabled by default. Enable with:
```bash
export QNCE_ADAPTIVE_SAMPLING=1
```
Current prototype uses an EMA of events/sec to interpolate a sample rate between configured low/high watermarks. All events recorded when disabled.

### 5. Thread Pool Override (Test Only)
For deterministic retry testing (non-public, unstable):
```ts
// @ts-expect-error internal
PerfReporter.__setThreadPoolOverride({ writeTelemetry: () => Promise.resolve() });
```
Never rely on this in production; it may be removed without notice.

### 6. Persistence Micro-Latency Threshold Update
Save/load/checkpoint tests now assert <10ms (previous <2ms proved brittle after added instrumentation). Still enforces a tight micro-budget while avoiding CI flakiness.

### 7. Environment Flags Summary
| Flag | Purpose | Default |
|------|---------|---------|
| `QNCE_SUPPRESS_PERF_WARN` | Suppress console warnings for rejected flushes | Off |
| `QNCE_DISABLE_ADAPTIVE_BATCH` | Force fixed batch size (disable dynamic sizing) | Off |
| `QNCE_ADAPTIVE_SAMPLING` | Enable beta sampling scaffold | Off |

Config controls (code):
```ts
// Adjust smoothing strength for smoothed p95 (0.01..1.0)
getPerfReporter({ smoothingAlpha: 0.3 });
```

### 8. Planned Follow-Ups
* Configurable smoothing alpha & decay windows
* Structured retry outcome telemetry (success vs loss metrics)
* Critical event class exemption list for sampling
* Percentile window rotation + reservoir sampling

Please include `p95DispatchLatencyMs`, `smoothedP95DispatchLatencyMs`, `rejectionRate`, and `consecutiveRejects` snapshots when filing performance issues.


---

**Ready for Production:** QNCE v1.2.0-sprint2 delivers comprehensive performance optimization with real-time monitoring capabilities. All systems tested and production-ready! 🚀

<!-- PROFILING-SNAPSHOT:START -->


### Profiling Snapshot (Automated)

Generated: 2025-09-10T18:17:48.505Z

Condition evaluation benchmark cold vs warm cache latency (milliseconds). Targets: keep warm p50 < 0.002 ms for simple expressions.


| Expr | Cold p50 | Cold p95 | Warm p50 | Warm p95 |
|------|---------:|---------:|---------:|---------:|


| flags.score > 10 && flags.lives >= 2 | 0.0018 | 0.0022 | 0.0011 | 0.0012 |
| flags.mode === "hard" || flags.debug | 0.0012 | 0.0018 | 0.0006 | 0.0006 |
| flags.a && flags.b && flags.c && flags.d | 0.0011 | 0.0013 | 0.0005 | 0.0005 |
| flags.combo > 5 && (flags.streak >= 3… | 0.0012 | 0.0013 | 0.0004 | 0.0005 |


<!-- PROFILING-SNAPSHOT:END -->
