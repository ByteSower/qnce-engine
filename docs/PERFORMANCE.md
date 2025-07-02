# QNCE Performance Guide

**Version:** 1.2.0-sprint2  
**Sprint #2:** Core Performance Refactor Complete  

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

---

**Ready for Production:** QNCE v1.2.0-sprint2 delivers comprehensive performance optimization with real-time monitoring capabilities. All systems tested and production-ready! 🚀
