#!/usr/bin/env node

import { perf, getPerfReporter } from '../performance/PerfReporter.js';
import { getThreadPool } from '../performance/ThreadPool.js';

/**
 * S2-T5: CLI Performance Dashboard
 * QNCE Performance Monitor CLI Tool - Real-time profiler metrics and threshold alerts
 */

interface PerformanceThresholds {
  maxCacheHitTime: number; // ms
  minCacheHitRate: number; // percentage
  maxHotReloadTime: number; // ms
  maxStateTransitionTime: number; // ms
  maxEventBacklog: number; // number of events
}

interface PerfSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgDurations: Record<string, number>;
  maxDurations: Record<string, number>;
  cacheHitRate: number;
  hotReloadPerformance: {
    avgTime: number;
    maxTime: number;
    totalReloads: number;
  };
  timeRange: {
    start: number;
    end: number;
    duration: number;
  };
}

interface ThreadPoolStats {
  completedJobs: number;
  queuedJobs: number;
  activeWorkers: number;
  avgExecutionTime: number;
  workerUtilization: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxCacheHitTime: 50, // 50ms max for cache operations
  minCacheHitRate: 80, // 80% minimum cache hit rate
  maxHotReloadTime: 2, // 2ms max for hot-reload (S2-T3 target)
  maxStateTransitionTime: 10, // 10ms max for state transitions
  maxEventBacklog: 1000 // Max 1000 events in backlog
};

/**
 * Display comprehensive performance dashboard
 */
function displayDashboard(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): void {
  console.log('\n🚀 QNCE Performance Dashboard');
  console.log('=====================================');
  
  const summary = perf.summary();
  const threadPool = getThreadPool();
  
  // Header with time range
  const durationSeconds = (summary.timeRange.duration / 1000).toFixed(2);
  console.log(`📊 Session Duration: ${durationSeconds}s`);
  console.log(`🔢 Total Events: ${summary.totalEvents}`);
  console.log('');

  // Event breakdown
  console.log('📈 Event Breakdown:');
  for (const [type, count] of Object.entries(summary.eventsByType)) {
    const avg = summary.avgDurations[type]?.toFixed(2) || 'N/A';
    const max = summary.maxDurations[type]?.toFixed(2) || 'N/A';
    console.log(`   ${type.padEnd(20)} ${count.toString().padStart(6)} events (avg: ${avg}ms, max: ${max}ms)`);
  }
  console.log('');

  // Cache Performance
  console.log('💾 Cache Performance:');
  const cacheStatus = summary.cacheHitRate >= thresholds.minCacheHitRate ? '✅' : '⚠️';
  console.log(`   ${cacheStatus} Hit Rate: ${summary.cacheHitRate.toFixed(1)}% (threshold: ${thresholds.minCacheHitRate}%)`);
  
  const cacheTime = summary.avgDurations['cache-hit'] || 0;
  const cacheTimeStatus = cacheTime <= thresholds.maxCacheHitTime ? '✅' : '⚠️';
  console.log(`   ${cacheTimeStatus} Avg Cache Time: ${cacheTime.toFixed(2)}ms (threshold: ${thresholds.maxCacheHitTime}ms)`);
  console.log('');

  // Hot-Reload Performance (S2-T3 metrics)
  console.log('🔥 Hot-Reload Performance:');
  const { avgTime, maxTime, totalReloads } = summary.hotReloadPerformance;
  const hotReloadStatus = avgTime <= thresholds.maxHotReloadTime ? '✅' : '⚠️';
  console.log(`   ${hotReloadStatus} Avg Time: ${avgTime.toFixed(2)}ms (threshold: ${thresholds.maxHotReloadTime}ms)`);
  console.log(`   📊 Max Time: ${maxTime.toFixed(2)}ms`);
  console.log(`   🔄 Total Reloads: ${totalReloads}`);
  console.log('');

  // State Transition Performance
  console.log('🔄 State Transitions:');
  const stateTime = summary.avgDurations['state-transition'] || 0;
  const stateStatus = stateTime <= thresholds.maxStateTransitionTime ? '✅' : '⚠️';
  console.log(`   ${stateStatus} Avg Time: ${stateTime.toFixed(2)}ms (threshold: ${thresholds.maxStateTransitionTime}ms)`);
  console.log('');

  // ThreadPool Status (S2-T2 metrics)
  console.log('🧵 ThreadPool Status:');
  const stats = threadPool.getStats();
  console.log(`   📊 Completed Jobs: ${stats.completedJobs}`);
  console.log(`   ⏳ Queued Jobs: ${stats.queuedJobs}`);
  console.log(`   🏃 Active Workers: ${stats.activeWorkers}`);
  console.log(`   🕒 Avg Execution Time: ${stats.avgExecutionTime.toFixed(2)}ms`);
  console.log(`   📈 Worker Utilization: ${stats.workerUtilization.toFixed(1)}%`);
  console.log('');

  // Performance Alerts
  displayAlerts(summary, thresholds, stats);
}

/**
 * Display performance threshold alerts
 */
function displayAlerts(summary: PerfSummary, thresholds: PerformanceThresholds, threadStats: ThreadPoolStats): void {
  console.log('🚨 Performance Alerts:');
  
  const alerts: string[] = [];
  
  // Cache alerts
  if (summary.cacheHitRate < thresholds.minCacheHitRate) {
    alerts.push(`Low cache hit rate: ${summary.cacheHitRate.toFixed(1)}% < ${thresholds.minCacheHitRate}%`);
  }
  
  const cacheTime = summary.avgDurations['cache-hit'] || 0;
  if (cacheTime > thresholds.maxCacheHitTime) {
    alerts.push(`Slow cache operations: ${cacheTime.toFixed(2)}ms > ${thresholds.maxCacheHitTime}ms`);
  }

  // Hot-reload alerts (S2-T3 compliance)
  if (summary.hotReloadPerformance.avgTime > thresholds.maxHotReloadTime) {
    alerts.push(`Hot-reload exceeds target: ${summary.hotReloadPerformance.avgTime.toFixed(2)}ms > ${thresholds.maxHotReloadTime}ms`);
  }

  // State transition alerts
  const stateTime = summary.avgDurations['state-transition'] || 0;
  if (stateTime > thresholds.maxStateTransitionTime) {
    alerts.push(`Slow state transitions: ${stateTime.toFixed(2)}ms > ${thresholds.maxStateTransitionTime}ms`);
  }

  // Event backlog alerts
  if (summary.totalEvents > thresholds.maxEventBacklog) {
    alerts.push(`High event backlog: ${summary.totalEvents} > ${thresholds.maxEventBacklog}`);
  }

  // ThreadPool alerts
  if (threadStats.queuedJobs > 10) {
    alerts.push(`High queued job count: ${threadStats.queuedJobs} jobs`);
  }

  if (alerts.length === 0) {
    console.log('   ✅ All systems performing within thresholds');
  } else {
    alerts.forEach(alert => console.log(`   ⚠️  ${alert}`));
  }
  console.log('');
}

/**
 * Live monitor mode - continuously update performance metrics
 */
function startLiveMonitor(intervalMs: number = 2000, thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): void {
  console.log(`🔴 Starting live performance monitor (${intervalMs}ms interval)`);
  console.log('Press Ctrl+C to stop');

  const interval = setInterval(() => {
    // Clear screen
    console.clear();
    displayDashboard(thresholds);
    
    // Show live timestamp
    console.log(`🕒 Last updated: ${new Date().toLocaleTimeString()}`);
  }, intervalMs);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Live monitor stopped');
    process.exit(0);
  });
}

/**
 * Export performance summary as JSON
 */
function exportSummary(): void {
  const summary = perf.summary();
  const threadStats = getThreadPool().getStats();
  
  const report = {
    timestamp: new Date().toISOString(),
    performanceSummary: summary,
    threadPoolStats: threadStats,
    thresholds: DEFAULT_THRESHOLDS
  };

  console.log(JSON.stringify(report, null, 2));
}

/**
 * Reset performance counters
 */
function resetCounters(): void {
  getPerfReporter().clear();
  console.log('✅ Performance counters reset');
}

/**
 * Main CLI entry point
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'dashboard';

  switch (command) {
    case 'dashboard':
    case 'dash':
      displayDashboard();
      break;
      
    case 'live':
    case 'monitor': {
      const interval = parseInt(args[1]) || 2000;
      startLiveMonitor(interval);
      break;
    }
      
    case 'export':
    case 'json':
      exportSummary();
      break;
      
    case 'reset':
    case 'clear':
      resetCounters();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(`
🚀 QNCE Performance CLI

Usage: qnce-perf [command] [options]

Commands:
  dashboard, dash     Show performance dashboard (default)
  live, monitor       Start live monitoring mode
  export, json        Export performance data as JSON
  reset, clear        Reset performance counters
  help               Show this help

Options:
  --interval <ms>     Monitoring interval for live mode (default: 2000ms)

Examples:
  qnce-perf dashboard
  qnce-perf live 1000
  qnce-perf export > performance-report.json
  qnce-perf reset

Performance Thresholds:
  Cache Hit Time:      < 50ms
  Cache Hit Rate:      > 80%
  Hot-Reload Time:     < 2ms  (S2-T3 target)
  State Transition:    < 10ms
  Event Backlog:       < 1000 events
      `);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "qnce-perf help" for usage information');
      process.exit(1);
  }
}

// Run if called directly (ES module compatible)
const isMainModule = require.main === module;
if (isMainModule) {
  main();
}

export { displayDashboard, startLiveMonitor, exportSummary, resetCounters };
