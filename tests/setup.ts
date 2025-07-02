// Test setup for performance monitoring and global test configuration
import { performance } from 'perf_hooks';

// Global performance tracking
const performanceMetrics = {
  flowSwitchLatency: [] as number[],
  stateTransitionTime: [] as number[],
  cacheHitRate: { hits: 0, misses: 0 },
  memoryFootprint: [] as number[],
  errorCount: 0
};

// Performance measurement utilities
export const measurePerformance = {
  // Measure flow switch latency (target: ≤20ms)
  measureFlowSwitch: (fn: () => void): number => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const latency = end - start;
    performanceMetrics.flowSwitchLatency.push(latency);
    return latency;
  },

  // Measure state transition time (target: ≤5ms)
  measureStateTransition: (fn: () => void): number => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const transitionTime = end - start;
    performanceMetrics.stateTransitionTime.push(transitionTime);
    return transitionTime;
  },

  // Track cache hits/misses (target: ≥95% hit rate)
  trackCacheHit: (): void => {
    performanceMetrics.cacheHitRate.hits++;
  },

  trackCacheMiss: (): void => {
    performanceMetrics.cacheHitRate.misses++;
  },

  // Measure memory footprint (target: ≤50MB)
  measureMemory: (): number => {
    const used = process.memoryUsage();
    const memoryMB = used.heapUsed / 1024 / 1024;
    performanceMetrics.memoryFootprint.push(memoryMB);
    return memoryMB;
  },

  // Track errors (target: 0 errors)
  trackError: (): void => {
    performanceMetrics.errorCount++;
  },

  // Reset metrics
  reset: (): void => {
    performanceMetrics.flowSwitchLatency = [];
    performanceMetrics.stateTransitionTime = [];
    performanceMetrics.cacheHitRate = { hits: 0, misses: 0 };
    performanceMetrics.memoryFootprint = [];
    performanceMetrics.errorCount = 0;
  },

  // Get performance summary
  getSummary: () => {
    const totalCacheAccess = performanceMetrics.cacheHitRate.hits + performanceMetrics.cacheHitRate.misses;
    const hitRate = totalCacheAccess > 0 ? (performanceMetrics.cacheHitRate.hits / totalCacheAccess) * 100 : 0;

    return {
      flowSwitchLatency: {
        avg: performanceMetrics.flowSwitchLatency.length > 0 ? 
          performanceMetrics.flowSwitchLatency.reduce((a, b) => a + b, 0) / performanceMetrics.flowSwitchLatency.length : 0,
        max: Math.max(...performanceMetrics.flowSwitchLatency, 0),
        target: 20,
        pass: performanceMetrics.flowSwitchLatency.every(l => l <= 20)
      },
      stateTransitionTime: {
        avg: performanceMetrics.stateTransitionTime.length > 0 ?
          performanceMetrics.stateTransitionTime.reduce((a, b) => a + b, 0) / performanceMetrics.stateTransitionTime.length : 0,
        max: Math.max(...performanceMetrics.stateTransitionTime, 0),
        target: 5,
        pass: performanceMetrics.stateTransitionTime.every(t => t <= 5)
      },
      cacheHitRate: {
        percentage: hitRate,
        target: 95,
        pass: hitRate >= 95
      },
      memoryFootprint: {
        peak: Math.max(...performanceMetrics.memoryFootprint, 0),
        avg: performanceMetrics.memoryFootprint.length > 0 ?
          performanceMetrics.memoryFootprint.reduce((a, b) => a + b, 0) / performanceMetrics.memoryFootprint.length : 0,
        target: 50,
        pass: Math.max(...performanceMetrics.memoryFootprint, 0) <= 50
      },
      errorCount: {
        total: performanceMetrics.errorCount,
        target: 0,
        pass: performanceMetrics.errorCount === 0
      }
    };
  }
};
