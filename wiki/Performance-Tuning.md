# Performance Tuning Guide

This guide covers performance optimization techniques for QNCE Engine, including object pooling, background processing, hot-reload optimization, and performance monitoring.

## ⚡ Overview

QNCE Engine v1.2.3 introduces enterprise-grade performance infrastructure designed to handle large-scale interactive narratives with minimal latency and memory usage.

### Performance Targets

| Metric | Target | Typical Results |
|--------|--------|-----------------|
| **State Transitions** | ≤5ms | ~3ms |
| **Flow Switches** | ≤20ms | ~12ms |
| **Hot-reload Updates** | <2ms | ~1.8ms |
| **Memory Usage** | ≤50MB | ~35MB |
| **Cache Hit Rate** | ≥95% | ~98% |

## 🏊‍♂️ Object Pooling

### What is Object Pooling?

Object pooling reduces garbage collection pressure by reusing objects instead of creating new ones. QNCE Engine implements sophisticated pooling for all frequently allocated objects.

### Benefits

- **90%+ allocation reduction** compared to naive implementations
- **Eliminates GC pressure** during story execution
- **Consistent frame rates** in real-time applications
- **Lower memory fragmentation**

### Configuration

```typescript
import { createQNCEEngine } from 'qnce-engine';

const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  performanceOptions: {
    objectPooling: {
      enable: true,
      preAllocate: true,           // Pre-allocate common objects
      poolSizes: {
        nodes: 100,                // Pool 100 node objects
        choices: 200,              // Pool 200 choice objects
        flags: 50,                 // Pool 50 flag objects
        events: 150                // Pool 150 event objects
      },
      cleanupInterval: 30000,      // Cleanup unused objects every 30s
      maxPoolSize: 1000            // Maximum total pooled objects
    }
  }
});
```

### Manual Pool Management

```typescript
// Access object pools directly (advanced usage)
const pools = engine.getObjectPools();

// Check pool statistics
console.log('Node pool usage:', pools.nodes.used, '/', pools.nodes.total);
console.log('Choice pool efficiency:', pools.choices.hitRate);

// Manually trigger cleanup
pools.cleanup();

// Preload pools for known story size
pools.preAllocate({
  estimatedNodes: 500,
  estimatedChoices: 1000,
  estimatedFlags: 100
});
```

## 🧵 Background Processing

### ThreadPool Architecture

QNCE Engine uses background processing to handle computationally expensive operations without blocking the main story thread.

```typescript
const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  performanceOptions: {
    backgroundProcessing: {
      enable: true,
      maxWorkers: 4,               // Maximum background workers
      queueSize: 100,              // Task queue size
      priority: 'normal',          // Task priority (low, normal, high)
      timeSlicing: true,           // Time-slice long operations
      maxExecutionTime: 16         // Max execution time per frame (ms)
    }
  }
});
```

### Background Tasks

#### Analytics Processing

```typescript
// Analytics are processed in background
engine.enableBackgroundAnalytics({
  playerBehavior: true,
  choicePatterns: true,
  performanceMetrics: true,
  processInterval: 5000,           // Process every 5 seconds
  batchSize: 50                    // Process 50 events at a time
});

// Non-blocking analytics queries
const analytics = await engine.getAnalytics({ background: true });
```

#### Cache Preloading

```typescript
// Intelligent cache preloading
engine.enableSmartCaching({
  preloadDepth: 3,                 // Preload 3 levels ahead
  preloadStrategy: 'adaptive',     // Adapt based on player patterns
  backgroundPreload: true,         // Preload in background
  cacheSize: 100,                  // Maximum cached items
  ttl: 300000                      // Cache TTL (5 minutes)
});
```

#### AI Content Generation

```typescript
// Generate AI content in background
engine.enableBackgroundAI({
  preGenerateChoices: true,        // Pre-generate likely choices
  batchGeneration: true,           // Generate content in batches
  queueSize: 20,                   // AI generation queue size
  fallbackContent: true           // Use cached content as fallback
});
```

## 🔥 Hot-Reload Optimization

### Delta Patching System

Hot-reload uses intelligent delta patching to apply only necessary changes.

```typescript
// Enable optimized hot-reload
engine.enableHotReload({
  deltaPatching: true,             // Use delta patching
  smartInvalidation: true,         // Intelligent cache invalidation
  preserveState: true,             // Preserve player state
  validateChanges: true,           // Validate changes before applying
  maxPatchSize: 1000,              // Maximum patch size
  timeLimit: 2                     // Target time limit (ms)
});

// Monitor hot-reload performance
engine.on('hotReloadComplete', (metrics) => {
  console.log('Hot-reload time:', metrics.duration);
  console.log('Nodes updated:', metrics.nodesUpdated);
  console.log('Cache invalidations:', metrics.cacheInvalidations);
});
```

### Hot-Reload Best Practices

```typescript
// Optimize story structure for hot-reload
const optimizedStory = {
  // Use stable IDs for nodes
  nodes: [
    { id: 'stable-node-1', /* ... */ },
    { id: 'stable-node-2', /* ... */ }
  ],
  
  // Group related content
  chapters: [
    {
      id: 'chapter-1',
      // Related nodes in same chapter reload faster
      nodes: [/* related nodes */]
    }
  ],
  
  // Separate data from logic
  metadata: {
    // Metadata changes don't trigger full reload
    version: '1.2.3'
  }
};
```

## 📊 Performance Monitoring

### Built-in Profiling

```typescript
// Enable comprehensive profiling
engine.enableProfiling({
  trackAllOperations: true,        // Track all engine operations
  memoryTracking: true,            // Monitor memory usage
  performanceMarks: true,          // Use Performance API marks
  exportFormat: 'json',            // Export format for reports
  reportInterval: 60000,           // Generate reports every minute
  alertThresholds: {
    stateTransition: 5,            // Alert if >5ms
    flowSwitch: 20,                // Alert if >20ms
    memoryUsage: 50                // Alert if >50MB
  }
});

// Access real-time metrics
const metrics = engine.getPerformanceMetrics();
console.log('Current memory usage:', metrics.memoryUsage);
console.log('Average transition time:', metrics.avgTransitionTime);
console.log('Cache efficiency:', metrics.cacheHitRate);
```

### CLI Performance Monitoring

```bash
# Real-time performance dashboard
qnce-perf dashboard --live

# Monitor specific metrics
qnce-perf monitor --metric state-transitions --threshold 5ms

# Generate performance report
qnce-perf report --format json --output performance.json

# Performance profiling session
qnce-perf profile --duration 5m --verbose
```

### Custom Performance Tracking

```typescript
// Add custom performance markers
engine.startPerformanceTimer('custom-operation');
// ... your code ...
const duration = engine.endPerformanceTimer('custom-operation');

// Track custom metrics
engine.recordMetric('customMetric', value, {
  category: 'gameplay',
  subcategory: 'choices',
  unit: 'milliseconds'
});

// Set up performance alerts
engine.addPerformanceAlert('high-memory', {
  condition: 'memoryUsage > 100MB',
  action: 'cleanup',
  notify: true
});
```

## 🎯 Optimization Strategies

### Story Size Optimization

#### Large Story Handling

```typescript
// Configuration for large stories (1000+ nodes)
const largeStoryConfig = {
  enablePerformanceMode: true,
  performanceOptions: {
    lazyLoading: true,             // Load content on demand
    chunkSize: 50,                 // Load 50 nodes at a time
    memoryLimit: 100,              // 100MB memory limit
    gcStrategy: 'aggressive',      // Aggressive garbage collection
    cacheStrategy: 'lru',          // LRU cache eviction
    backgroundProcessing: {
      enable: true,
      maxWorkers: 6,               // More workers for large stories
      priority: 'high'
    }
  }
};
```

#### Memory-Efficient Story Structure

```typescript
// Optimize story structure for memory efficiency
const memoryEfficientStory = {
  // Use shared objects for common data
  sharedChoices: {
    'continue': { text: 'Continue', action: 'continue' },
    'back': { text: 'Go back', action: 'back' }
  },
  
  // Reference shared choices instead of duplicating
  nodes: [
    {
      id: 'node1',
      text: 'Story text...',
      choices: ['continue', 'back'] // Reference shared choices
    }
  ],
  
  // Use efficient data structures
  flags: new Map(),                // Use Map for better performance
  metadata: Object.freeze({        // Freeze immutable data
    author: 'Author Name'
  })
};
```

### Runtime Optimization

#### Efficient Choice Processing

```typescript
// Optimize choice evaluation
const optimizedChoiceEvaluation = {
  // Pre-compile conditions for faster evaluation
  preCompileConditions: true,
  
  // Cache condition results
  cacheConditions: true,
  
  // Use efficient data structures
  choiceIndex: new Map(),          // Index choices for fast lookup
  
  // Batch operations
  batchSize: 10,                   // Process choices in batches
  
  // Early exit optimizations
  shortCircuit: true               // Stop evaluating when result is determined
};
```

#### Flag System Optimization

```typescript
// Efficient flag management
const flagOptimization = {
  // Use typed flags for better performance
  typedFlags: {
    booleans: new Set(),           // Use Set for boolean flags
    numbers: new Map(),            // Use Map for numeric flags
    strings: new Map()             // Use Map for string flags
  },
  
  // Batch flag updates
  batchUpdates: true,
  
  // Use efficient serialization
  serialization: 'binary',         // Binary serialization for speed
  
  // Limit flag history for memory efficiency
  maxHistory: 100
};
```

## 🔧 Platform-Specific Optimizations

### Web Browser Optimizations

```typescript
// Browser-specific optimizations
const browserConfig = {
  performanceOptions: {
    // Use Web Workers for background processing
    useWebWorkers: true,
    
    // Optimize for 60fps
    targetFrameRate: 60,
    
    // Use requestIdleCallback for background tasks
    useIdleCallback: true,
    
    // Minimize DOM updates
    batchDOMUpdates: true,
    
    // Use efficient event handling
    passiveEventListeners: true
  }
};
```

### Node.js Server Optimizations

```typescript
// Server-specific optimizations
const serverConfig = {
  performanceOptions: {
    // Use cluster mode for multiple processes
    cluster: {
      enable: true,
      workers: require('os').cpus().length
    },
    
    // Enable V8 optimizations
    v8Optimizations: true,
    
    // Use streaming for large responses
    streaming: true,
    
    // Optimize garbage collection
    gcSettings: {
      maxOldSpaceSize: 4096,       // 4GB max heap
      maxNewSpaceSize: 1024        // 1GB new generation
    }
  }
};
```

### Mobile Device Optimizations

```typescript
// Mobile-specific optimizations
const mobileConfig = {
  performanceOptions: {
    // Reduce memory usage for mobile devices
    lowMemoryMode: true,
    
    // Optimize for touch interactions
    touchOptimization: true,
    
    // Reduce background processing
    reducedProcessing: true,
    
    // Use efficient rendering
    lightweightRendering: true,
    
    // Battery optimization
    batteryOptimization: true
  }
};
```

## 📈 Performance Testing

### Automated Performance Tests

```typescript
// Set up performance testing
const performanceTester = engine.createPerformanceTester();

// Test state transition performance
performanceTester.testStateTransitions({
  iterations: 1000,
  targetTime: 5,                   // 5ms target
  storySize: 'large',
  concurrent: true
});

// Test memory usage
performanceTester.testMemoryUsage({
  duration: 300000,                // 5 minutes
  operations: ['navigate', 'choice', 'flag-update'],
  memoryLimit: 50                  // 50MB limit
});

// Test hot-reload performance
performanceTester.testHotReload({
  changes: 100,                    // 100 story changes
  targetTime: 2,                   // 2ms target
  preserveState: true
});
```

### Load Testing

```typescript
// Simulate high load scenarios
const loadTester = engine.createLoadTester();

// Test concurrent users
loadTester.simulateConcurrentUsers({
  userCount: 1000,
  duration: 600000,                // 10 minutes
  userBehavior: 'realistic',
  rampUpTime: 60000               // 1 minute ramp-up
});

// Stress test
loadTester.stressTest({
  maxUsers: 5000,
  incrementRate: 100,              // Add 100 users every second
  targetMetrics: {
    avgResponseTime: 100,          // 100ms average
    errorRate: 0.1                 // 0.1% error rate
  }
});
```

## 🚨 Performance Troubleshooting

### Common Performance Issues

#### High Memory Usage

```typescript
// Diagnose memory issues
const memoryDiagnostics = engine.diagnoseMemory();

if (memoryDiagnostics.usage > 50) {
  // Enable aggressive cleanup
  engine.enableAggressiveCleanup();
  
  // Reduce cache sizes
  engine.reduceCacheSizes(0.5);
  
  // Force garbage collection
  engine.forceGarbageCollection();
}
```

#### Slow State Transitions

```typescript
// Diagnose slow transitions
const transitionDiagnostics = engine.diagnoseTransitions();

if (transitionDiagnostics.avgTime > 5) {
  // Enable faster transition mode
  engine.enableFastTransitions();
  
  // Precompile conditions
  engine.precompileConditions();
  
  // Optimize choice evaluation
  engine.optimizeChoiceEvaluation();
}
```

#### Poor Cache Performance

```typescript
// Optimize cache performance
const cacheStats = engine.getCacheStatistics();

if (cacheStats.hitRate < 0.9) {
  // Increase cache size
  engine.increaseCacheSize(1.5);
  
  // Improve cache strategy
  engine.setCacheStrategy('adaptive');
  
  // Enable predictive caching
  engine.enablePredictiveCache();
}
```

## 📊 Performance Monitoring Dashboard

### CLI Dashboard

```bash
# Launch real-time performance dashboard
qnce-perf dashboard

# Dashboard shows:
# - Real-time memory usage
# - State transition times
# - Cache hit rates
# - Background task queue status
# - Performance alerts
```

### Custom Dashboard Integration

```typescript
// Integrate with custom monitoring systems
engine.enableMetricsExport({
  format: 'prometheus',            // Prometheus metrics format
  endpoint: '/metrics',            // Metrics endpoint
  interval: 10000,                 // Export every 10 seconds
  customMetrics: [
    'story_navigation_time',
    'choice_evaluation_time',
    'flag_update_time'
  ]
});

// Integration with popular monitoring tools
engine.integrateWith('grafana', {
  dashboardId: 'qnce-performance',
  apiKey: process.env.GRAFANA_API_KEY
});
```

---

<div align="center">

**Ready to optimize your narrative engine?**

[CLI Usage →](CLI-Usage) | [Performance Docs →](https://github.com/ByteSower/qnce-engine/blob/main/docs/PERFORMANCE.md) | [Get Support →](https://github.com/ByteSower/qnce-engine/issues)

*Built with ❤️ by the QNCE development team*

</div>

---

## 📍 Wiki Navigation

**← Previous:** [Branching Guide](Branching-Guide) | **You are here:** Performance Tuning | **Next:** [CLI Usage →](CLI-Usage)

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • **Performance Tuning** • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • [Contributing](Contributing) • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.2.3 with advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
