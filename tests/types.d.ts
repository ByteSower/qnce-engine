// Type definitions for Jest globals and performance tracking
import '@jest/globals';

declare global {
  const performanceMetrics: {
    flowSwitchLatency: number[];
    stateTransitionTime: number[];
    cacheHitRate: { hits: number; misses: number };
    memoryFootprint: number[];
    errorCount: number;
  };
  
  const measurePerformance: {
    measureFlowSwitch: (fn: () => void) => number;
    measureStateTransition: (fn: () => void) => number;
    trackCacheHit: () => void;
    trackCacheMiss: () => void;
    measureMemory: () => number;
    trackError: () => void;
    getSummary: () => Record<string, unknown>;
  };
}

export {};
