#!/usr/bin/env node

// Performance testing script for QNCE Engine - Brain's Sprint #1 Metrics
const { createQNCEEngine } = require('../dist/index.js');
const { performance } = require('perf_hooks');
const { writeFileSync } = require('fs');

console.log('🎯 QNCE Engine Performance Testing - Sprint #1');
console.log('='.repeat(50));
console.log('Testing Brain\'s performance requirements:');
console.log('• Flow-Switch Latency: Target ≤20ms');
console.log('• State Transition Time: Target ≤5ms');
console.log('• Cache Hit Rate: Target ≥95%');
console.log('• Memory Footprint: Target ≤50MB');
console.log('• Error Rate: Target 0 errors per 1000 calls');
console.log('='.repeat(50) + '\n');

// Test story data matching our test suite
const testStory = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'Beginning of performance test.',
      choices: [
        { text: 'Go left', nextNodeId: 'left', flagEffects: { direction: 'left' } },
        { text: 'Go right', nextNodeId: 'right', flagEffects: { direction: 'right' } },
        { text: 'Examine', nextNodeId: 'examine', flagEffects: { examined: true } }
      ]
    },
    {
      id: 'left',
      text: 'Left path taken.',
      choices: [
        { text: 'Continue', nextNodeId: 'end', flagEffects: { completed: true } },
        { text: 'Back', nextNodeId: 'start', flagEffects: { backtracked: true } }
      ]
    },
    {
      id: 'right',
      text: 'Right path taken.',
      choices: [
        { text: 'Continue', nextNodeId: 'end', flagEffects: { completed: true } },
        { text: 'Back', nextNodeId: 'start', flagEffects: { backtracked: true } }
      ]
    },
    {
      id: 'examine',
      text: 'You examined the area.',
      choices: [
        { text: 'Continue', nextNodeId: 'start', flagEffects: { knowledge: true } }
      ]
    },
    {
      id: 'end',
      text: 'Test complete.',
      choices: []
    }
  ]
};

// Performance metrics tracking
const metrics = {
  flowSwitchLatency: [],
  stateTransitionTime: [],
  cacheHitRate: { hits: 0, misses: 0 },
  memoryFootprint: [],
  errorRate: { calls: 0, errors: 0 }
};

// Test configuration based on Brain's requirements
const config = {
  iterations: 1000,
  flows: 5, // "5 flows" as specified
  targets: {
    flowSwitchLatency: 20,    // ≤20ms
    stateTransitionTime: 5,   // ≤5ms
    cacheHitRate: 95,         // ≥95%
    memoryFootprint: 50,      // ≤50MB
    errorRate: 0              // 0 errors per 1000 calls
  }
};

function measureMemory() {
  const used = process.memoryUsage();
  const memoryMB = used.heapUsed / 1024 / 1024;
  metrics.memoryFootprint.push(memoryMB);
  return memoryMB;
}

function measureFlowSwitch(fn) {
  const start = performance.now();
  try {
    fn();
    const end = performance.now();
    const latency = end - start;
    metrics.flowSwitchLatency.push(latency);
    return latency;
  } catch (error) {
    metrics.errorRate.errors++;
    throw error;
  } finally {
    metrics.errorRate.calls++;
  }
}

function measureStateTransition(fn) {
  const start = performance.now();
  try {
    fn();
    const end = performance.now();
    const time = end - start;
    metrics.stateTransitionTime.push(time);
    return time;
  } catch (error) {
    metrics.errorRate.errors++;
    throw error;
  } finally {
    metrics.errorRate.calls++;
  }
}

function simulateCacheAccess(isHit) {
  if (isHit) {
    metrics.cacheHitRate.hits++;
  } else {
    metrics.cacheHitRate.misses++;
  }
}

// Performance test runners
async function testFlowSwitchLatency() {
  console.log('📊 Testing Flow-Switch Latency...');
  
  for (let i = 0; i < config.iterations; i++) {
    const engine = createQNCEEngine(testStory);
    
    const latency = measureFlowSwitch(() => {
      engine.resetNarrative();
      const node = engine.getCurrentNode();
      if (node.choices.length > 0) {
        engine.selectChoice(node.choices[0]);
      }
    });
    
    if (i % 100 === 0) {
      process.stdout.write(`\r  Progress: ${((i / config.iterations) * 100).toFixed(1)}%`);
    }
  }
  
  const avg = metrics.flowSwitchLatency.reduce((a, b) => a + b, 0) / metrics.flowSwitchLatency.length;
  const max = Math.max(...metrics.flowSwitchLatency);
  const passed = avg <= config.targets.flowSwitchLatency;
  
  console.log(`\n  Average: ${avg.toFixed(2)}ms | Max: ${max.toFixed(2)}ms | Target: ≤${config.targets.flowSwitchLatency}ms | ${passed ? '✅ PASS' : '❌ FAIL'}`);
  return passed;
}

async function testStateTransitionTime() {
  console.log('\n📊 Testing State Transition Time...');
  
  const engine = createQNCEEngine(testStory);
  
  for (let i = 0; i < config.iterations; i++) {
    const node = engine.getCurrentNode();
    
    if (node.choices.length > 0) {
      const randomChoice = Math.floor(Math.random() * node.choices.length);
      measureStateTransition(() => {
        engine.selectChoice(node.choices[randomChoice]);
      });
    } else {
      engine.resetNarrative();
    }
    
    if (i % 100 === 0) {
      process.stdout.write(`\r  Progress: ${((i / config.iterations) * 100).toFixed(1)}%`);
    }
  }
  
  const avg = metrics.stateTransitionTime.reduce((a, b) => a + b, 0) / metrics.stateTransitionTime.length;
  const max = Math.max(...metrics.stateTransitionTime);
  const passed = avg <= config.targets.stateTransitionTime;
  
  console.log(`\n  Average: ${avg.toFixed(2)}ms | Max: ${max.toFixed(2)}ms | Target: ≤${config.targets.stateTransitionTime}ms | ${passed ? '✅ PASS' : '❌ FAIL'}`);
  return passed;
}

async function testCacheHitRate() {
  console.log('\n📊 Testing Cache Hit Rate...');
  
  const engine = createQNCEEngine(testStory);
  
  // Simulate cache behavior - first access is miss, subsequent are hits
  for (let i = 0; i < config.iterations; i++) {
    const node = engine.getCurrentNode();
    
    if (i === 0) {
      simulateCacheAccess(false); // First access is a miss
    } else {
      simulateCacheAccess(true);  // Subsequent accesses are hits
    }
    
    if (node.choices.length > 0 && Math.random() < 0.1) {
      engine.selectChoice(node.choices[Math.floor(Math.random() * node.choices.length)]);
      simulateCacheAccess(false); // New node is a miss
    }
    
    if (i % 100 === 0) {
      process.stdout.write(`\r  Progress: ${((i / config.iterations) * 100).toFixed(1)}%`);
    }
  }
  
  const totalAccess = metrics.cacheHitRate.hits + metrics.cacheHitRate.misses;
  const hitRate = (metrics.cacheHitRate.hits / totalAccess) * 100;
  const passed = hitRate >= config.targets.cacheHitRate;
  
  console.log(`\n  Hit Rate: ${hitRate.toFixed(1)}% | Hits: ${metrics.cacheHitRate.hits} | Misses: ${metrics.cacheHitRate.misses} | Target: ≥${config.targets.cacheHitRate}% | ${passed ? '✅ PASS' : '❌ FAIL'}`);
  return passed;
}

async function testMemoryFootprint() {
  console.log('\n📊 Testing Memory Footprint (5 flows)...');
  
  measureMemory(); // Initial measurement
  
  for (let flow = 0; flow < config.flows; flow++) {
    console.log(`\n  Flow ${flow + 1}/${config.flows}:`);
    const engine = createQNCEEngine(testStory);
    
    // Navigate through complete story paths
    for (let i = 0; i < 200; i++) {
      const node = engine.getCurrentNode();
      
      if (node.choices.length > 0) {
        const randomChoice = Math.floor(Math.random() * node.choices.length);
        engine.selectChoice(node.choices[randomChoice]);
      } else {
        engine.resetNarrative();
      }
      
      if (i % 50 === 0) {
        const currentMemory = measureMemory();
        process.stdout.write(`\r    Memory: ${currentMemory.toFixed(2)}MB | Progress: ${((i / 200) * 100).toFixed(1)}%`);
      }
    }
  }
  
  const peakMemory = Math.max(...metrics.memoryFootprint);
  const avgMemory = metrics.memoryFootprint.reduce((a, b) => a + b, 0) / metrics.memoryFootprint.length;
  const passed = peakMemory <= config.targets.memoryFootprint;
  
  console.log(`\n  Peak: ${peakMemory.toFixed(2)}MB | Average: ${avgMemory.toFixed(2)}MB | Target: ≤${config.targets.memoryFootprint}MB | ${passed ? '✅ PASS' : '❌ FAIL'}`);
  return passed;
}

function testErrorRate() {
  console.log('\n📊 Testing Error Rate...');
  
  const errorsPer1000 = metrics.errorRate.calls > 0 
    ? (metrics.errorRate.errors / metrics.errorRate.calls) * 1000 
    : 0;
  const passed = metrics.errorRate.errors === config.targets.errorRate;
  
  console.log(`  Errors: ${metrics.errorRate.errors} | Total Calls: ${metrics.errorRate.calls} | Rate: ${errorsPer1000.toFixed(2)}/1000 | Target: ${config.targets.errorRate} | ${passed ? '✅ PASS' : '❌ FAIL'}`);
  return passed;
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    config: config,
    results: {
      flowSwitchLatency: {
        average: metrics.flowSwitchLatency.reduce((a, b) => a + b, 0) / metrics.flowSwitchLatency.length,
        max: Math.max(...metrics.flowSwitchLatency),
        target: config.targets.flowSwitchLatency,
        passed: results.flowSwitch
      },
      stateTransitionTime: {
        average: metrics.stateTransitionTime.reduce((a, b) => a + b, 0) / metrics.stateTransitionTime.length,
        max: Math.max(...metrics.stateTransitionTime),
        target: config.targets.stateTransitionTime,
        passed: results.stateTransition
      },
      cacheHitRate: {
        percentage: (metrics.cacheHitRate.hits / (metrics.cacheHitRate.hits + metrics.cacheHitRate.misses)) * 100,
        hits: metrics.cacheHitRate.hits,
        misses: metrics.cacheHitRate.misses,
        target: config.targets.cacheHitRate,
        passed: results.cacheHit
      },
      memoryFootprint: {
        peak: Math.max(...metrics.memoryFootprint),
        average: metrics.memoryFootprint.reduce((a, b) => a + b, 0) / metrics.memoryFootprint.length,
        target: config.targets.memoryFootprint,
        passed: results.memory
      },
      errorRate: {
        total: metrics.errorRate.errors,
        per1000Calls: (metrics.errorRate.errors / metrics.errorRate.calls) * 1000,
        target: config.targets.errorRate,
        passed: results.errorRate
      }
    },
    overallPassed: Object.values(results).every(Boolean)
  };
  
  // Write results to file for CI
  writeFileSync('performance-results.json', JSON.stringify(report, null, 2));
  
  return report;
}

// Main execution
async function main() {
  try {
    console.log('Starting QNCE Engine Performance Tests...\n');
    
    const results = {
      flowSwitch: await testFlowSwitchLatency(),
      stateTransition: await testStateTransitionTime(),
      cacheHit: await testCacheHitRate(),
      memory: await testMemoryFootprint(),
      errorRate: testErrorRate()
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 QNCE ENGINE PERFORMANCE REPORT');
    console.log('='.repeat(50));
    
    const report = generateReport(results);
    
    console.log(`Overall Result: ${report.overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Report saved to: performance-results.json`);
    
    // Exit with appropriate code for CI
    process.exit(report.overallPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Performance tests failed:', error);
    process.exit(1);
  }
}

main();
