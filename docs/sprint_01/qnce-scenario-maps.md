# QNCE Scenario Maps - Sprint #1

This document maps key QNCE use cases as requested by Brain, detailing Story→Chapter→Flow scenarios, expected timing, and edge cases.

## Core QNCE Flow Architecture

```
Story
├── Chapter 1: Introduction
│   ├── Flow 1.1: Character Setup (≤20ms)
│   ├── Flow 1.2: World Introduction (≤20ms)
│   └── Flow 1.3: First Choice (≤20ms)
├── Chapter 2: Main Quest
│   ├── Flow 2.1: Path Selection (≤20ms)
│   ├── Flow 2.2: Consequence Processing (≤20ms)
│   └── Flow 2.3: State Transition (≤5ms)
└── Chapter 3: Resolution
    ├── Flow 3.1: Final Decision (≤20ms)
    └── Flow 3.2: Ending Calculation (≤20ms)
```

## Key Use Case Scenarios

### Scenario 1: Linear Narrative Flow
**Path**: Start → Left → Secret → Victory
- **Expected Timing**: 4 state transitions @ ≤5ms each = ≤20ms total
- **Cache Behavior**: 95%+ hit rate for repeated node access
- **Memory**: ≤50MB for complete playthrough
- **Edge Cases**: 
  - Invalid node references
  - Flag conflicts
  - History corruption

### Scenario 2: Branching with Backtracking
**Path**: Start → Right → Upper → Back → Left → Secret
- **Expected Timing**: 6 transitions + 1 flow switch ≤25ms total
- **Cache Behavior**: High hit rate due to revisited nodes
- **Memory**: No leaks during backtracking
- **Edge Cases**:
  - Circular navigation loops
  - State rollback integrity
  - Flag persistence across backtracks

### Scenario 3: Complex Multi-Choice Navigation
**Path**: Start → Examine → Start → Right → Lower → Victory
- **Expected Timing**: 5 transitions + exploration ≤30ms
- **Cache Behavior**: Optimal caching of examined nodes
- **Memory**: Efficient flag storage
- **Edge Cases**:
  - Multiple flag accumulation
  - Choice availability based on history
  - Performance under rapid navigation

### Scenario 4: Error Recovery and State Consistency
**Path**: Start → [Invalid Choice] → Recovery → Normal Flow
- **Expected Timing**: Error handling ≤5ms + recovery
- **Cache Behavior**: Cache integrity maintained
- **Memory**: No memory leaks from errors
- **Edge Cases**:
  - Graceful error handling
  - State consistency after errors
  - User experience continuity

## Performance Targets by Scenario Type

| Scenario Type | Flow Switch | State Transition | Cache Hit | Memory | Error Rate |
|---------------|-------------|------------------|-----------|---------|------------|
| Linear | ≤20ms | ≤5ms | ≥95% | ≤50MB | 0/1000 |
| Branching | ≤25ms | ≤5ms | ≥90% | ≤50MB | 0/1000 |
| Complex | ≤30ms | ≤5ms | ≥85% | ≤50MB | 0/1000 |
| Error Recovery | ≤10ms | ≤5ms | ≥95% | ≤50MB | 0/1000 |

## State Machine Transition Map

```
[Start State]
    ├── selectChoice() → [Transition State] (≤5ms)
    │                        ├── updateFlags()
    │                        ├── updateHistory()
    │                        └── setCurrentNode()
    ├── resetNarrative() → [Initial State] (≤5ms)
    ├── loadState() → [Custom State] (≤5ms)
    └── getCurrentNode() → [Cache Lookup] (≤1ms)
```

## Cache Strategy Map

```
Node Cache
├── Primary Cache (In-Memory)
│   ├── Recently Accessed Nodes (LRU)
│   ├── Story Metadata
│   └── Frequently Used Choices
├── Secondary Cache (Computed)
│   ├── Available Choices
│   ├── Flag-based Conditions
│   └── History Calculations
└── Cache Invalidation
    ├── On State Reset
    ├── On Story Change
    └── On Error Recovery
```

## Error Handling Flow Map

```
Error Detection
├── Node Not Found → Throw with Context
├── Invalid Choice → Validation Error
├── Flag Conflict → Resolution Strategy
└── State Corruption → Recovery Protocol

Error Recovery
├── Maintain Previous Valid State
├── Log Error for Debugging
├── Provide User Feedback
└── Continue Normal Operation
```

## Performance Monitoring Points

### 1. Flow-Switch Latency Measurement
- **Trigger**: `endFlow()` → `startNextFlow()`
- **Target**: ≤20ms average
- **Monitoring**: Real-time telemetry hooks

### 2. State Transition Time
- **Trigger**: Each `selectChoice()` call
- **Target**: ≤5ms per transition
- **Monitoring**: Performance.now() wrapping

### 3. Cache Hit Rate Tracking
- **Calculation**: hits / (hits + misses) * 100
- **Target**: ≥95% hit rate
- **Monitoring**: Cache access logging

### 4. Memory Footprint Analysis
- **Measurement**: Peak heap size during 5 flows
- **Target**: ≤50MB total
- **Monitoring**: process.memoryUsage()

### 5. Error Rate Calculation
- **Formula**: errors / total_calls * 1000
- **Target**: 0 errors per 1000 calls
- **Monitoring**: Exception tracking

## Integration Test Scenarios

### Scenario A: High-Frequency Navigation
```typescript
// 1000 rapid transitions
for (let i = 0; i < 1000; i++) {
  engine.selectChoice(randomChoice());
  assertPerformance(≤5ms);
}
```

### Scenario B: Memory Stress Test
```typescript
// 5 complete story runs
for (let run = 0; run < 5; run++) {
  playCompleteStory();
  assertMemory(≤50MB);
}
```

### Scenario C: Cache Efficiency Test
```typescript
// Repeated node access pattern
repeatNodeAccess(100);
assertCacheHitRate(≥95%);
```

### Scenario D: Error Recovery Test
```typescript
// Inject errors and recover
injectRandomErrors();
assertStateConsistency();
assertErrorRate(0/1000);
```

## Real-World Usage Patterns

### Pattern 1: Casual Reader
- **Behavior**: Linear progression, occasional backtracking
- **Performance**: Standard flow-switch timing
- **Cache Usage**: High hit rate due to linear access

### Pattern 2: Completionist Explorer
- **Behavior**: Exhaustive choice exploration, multiple playthroughs
- **Performance**: Extended memory usage, high cache churn
- **Cache Usage**: Variable hit rate due to diverse paths

### Pattern 3: Speed Runner
- **Behavior**: Rapid navigation, optimal path seeking
- **Performance**: Maximum flow-switch frequency
- **Cache Usage**: Efficient caching of known optimal routes

### Pattern 4: Experimenter
- **Behavior**: Boundary testing, error triggering, state manipulation
- **Performance**: Error recovery focus
- **Cache Usage**: Cache invalidation and recovery patterns

## Monitoring and Telemetry

### Real-Time Metrics
- Flow-switch latency histogram
- State transition timing distribution
- Cache hit/miss ratios by node type
- Memory usage trends over time
- Error occurrence patterns

### Alerting Thresholds
- Flow-switch > 20ms → Warning
- State transition > 5ms → Warning
- Cache hit rate < 95% → Alert
- Memory usage > 50MB → Alert
- Any errors detected → Critical Alert

### Performance Dashboards
- Live performance metrics
- Historical trend analysis
- Scenario-specific performance
- Error tracking and resolution
- User experience impact metrics

---

*This document serves as the foundation for QNCE performance testing and optimization efforts during Sprint #1 and beyond.*
