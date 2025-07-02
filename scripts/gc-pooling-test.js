// S2-T1: Object Pooling GC Impact Test
// Measures GC pressure reduction from object pooling

const { createQNCEEngine } = require('../dist/engine/core.js');
const { poolManager } = require('../dist/performance/ObjectPool.js');

// Test story data
const testStoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'Beginning of journey.',
      choices: [
        { text: 'Go north', nextNodeId: 'north' },
        { text: 'Go south', nextNodeId: 'south' }
      ]
    },
    {
      id: 'north',
      text: 'You are in the north.',
      choices: [
        { text: 'Return', nextNodeId: 'start' },
        { text: 'Go deeper', nextNodeId: 'deep_north' }
      ]
    },
    {
      id: 'south',
      text: 'You are in the south.',
      choices: [
        { text: 'Return', nextNodeId: 'start' },
        { text: 'Explore', nextNodeId: 'explore_south' }
      ]
    },
    {
      id: 'deep_north',
      text: 'Deep in the north.',
      choices: [{ text: 'Return to start', nextNodeId: 'start' }]
    },
    {
      id: 'explore_south',
      text: 'Exploring the south.',
      choices: [{ text: 'Return to start', nextNodeId: 'start' }]
    }
  ]
};

function measureGCPressure() {
  if (global.gc) {
    // Force GC and get initial memory
    global.gc();
    const initialMemory = process.memoryUsage();
    
    return {
      start: initialMemory,
      end: () => {
        global.gc();
        const finalMemory = process.memoryUsage();
        return {
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external
        };
      }
    };
  } else {
    console.warn('GC not exposed. Run with --expose-gc for accurate GC measurements.');
    return {
      start: process.memoryUsage(),
      end: () => ({ heapUsed: 0, heapTotal: 0, external: 0 })
    };
  }
}

async function testWithoutPooling(iterations = 1000) {
  console.log(`\n📊 Testing WITHOUT Object Pooling (${iterations} iterations)...`);
  
  const gcMeasure = measureGCPressure();
  const startTime = process.hrtime.bigint();
  
  // Create engine without performance mode (no pooling)
  const engine = createQNCEEngine(testStoryData, {}, false);
  
  for (let i = 0; i < iterations; i++) {
    // Simulate user journey through narrative
    const choices = ['north', 'deep_north', 'start', 'south', 'explore_south', 'start'];
    
    for (const targetNodeId of choices) {
      const currentNode = engine.getCurrentNode();
      const choice = currentNode.choices.find(c => c.nextNodeId === targetNodeId);
      if (choice) {
        engine.selectChoice(choice);
      }
    }
    
    // Reset for next iteration
    engine.resetNarrative();
  }
  
  const endTime = process.hrtime.bigint();
  const memoryDelta = gcMeasure.end();
  
  return {
    time: Number(endTime - startTime) / 1000000, // Convert to milliseconds
    memory: memoryDelta,
    objectsCreated: iterations * 6, // Approximate objects created per iteration
    gcPressure: memoryDelta.heapUsed / (1024 * 1024) // MB
  };
}

async function testWithPooling(iterations = 1000) {
  console.log(`\n📊 Testing WITH Object Pooling (${iterations} iterations)...`);
  
  // Clear pools before test
  poolManager.clearAllPools();
  
  const gcMeasure = measureGCPressure();
  const startTime = process.hrtime.bigint();
  
  // Create engine with performance mode (object pooling enabled)
  const engine = createQNCEEngine(testStoryData, {}, true);
  
  for (let i = 0; i < iterations; i++) {
    // Simulate user journey through narrative
    const choices = ['north', 'deep_north', 'start', 'south', 'explore_south', 'start'];
    
    for (const targetNodeId of choices) {
      const currentNode = engine.getCurrentNode();
      const choice = currentNode.choices.find(c => c.nextNodeId === targetNodeId);
      if (choice) {
        engine.selectChoice(choice);
      }
    }
    
    // Reset for next iteration
    engine.resetNarrative();
  }
  
  const endTime = process.hrtime.bigint();
  const memoryDelta = gcMeasure.end();
  const poolStats = poolManager.getAllStats();
  
  return {
    time: Number(endTime - startTime) / 1000000, // Convert to milliseconds
    memory: memoryDelta,
    poolStats,
    gcPressure: memoryDelta.heapUsed / (1024 * 1024) // MB
  };
}

async function runGCComparisonTest() {
  console.log('🎯 QNCE Object Pooling GC Impact Analysis - Sprint #2 S2-T1');
  console.log('==================================================');
  
  const iterations = 1000;
  
  // Test without pooling
  const withoutPooling = await testWithoutPooling(iterations);
  
  // Test with pooling
  const withPooling = await testWithPooling(iterations);
  
  // Calculate improvements
  const gcReduction = ((withoutPooling.gcPressure - withPooling.gcPressure) / withoutPooling.gcPressure) * 100;
  const timeReduction = ((withoutPooling.time - withPooling.time) / withoutPooling.time) * 100;
  
  console.log('\n==================================================');
  console.log('📈 PERFORMANCE COMPARISON RESULTS');
  console.log('==================================================');
  
  console.log('🚫 WITHOUT Object Pooling:');
  console.log(`   Execution Time: ${withoutPooling.time.toFixed(2)}ms`);
  console.log(`   GC Pressure: ${withoutPooling.gcPressure.toFixed(2)}MB`);
  console.log(`   Heap Growth: ${(withoutPooling.memory.heapUsed / (1024 * 1024)).toFixed(2)}MB`);
  
  console.log('\n✅ WITH Object Pooling:');
  console.log(`   Execution Time: ${withPooling.time.toFixed(2)}ms`);
  console.log(`   GC Pressure: ${withPooling.gcPressure.toFixed(2)}MB`);
  console.log(`   Heap Growth: ${(withPooling.memory.heapUsed / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`   Pool Hit Rate: ${withPooling.poolStats.flows.hitRate.toFixed(1)}%`);
  console.log(`   Objects Borrowed: ${withPooling.poolStats.flows.borrowed}`);
  console.log(`   Objects Returned: ${withPooling.poolStats.flows.returned}`);
  
  console.log('\n📊 IMPROVEMENTS:');
  console.log(`   GC Pressure Reduction: ${gcReduction.toFixed(1)}% ${gcReduction >= 50 ? '✅' : '❌'}`);
  console.log(`   Performance Improvement: ${timeReduction >= 0 ? '+' : ''}${timeReduction.toFixed(1)}%`);
  
  console.log('\n🎯 S2-T1 ACCEPTANCE CRITERIA:');
  console.log(`   GC Pause Reduction ≥50%: ${gcReduction >= 50 ? '✅ PASS' : '❌ FAIL'} (${gcReduction.toFixed(1)}%)`);
  
  console.log('\n==================================================');
  
  // Save detailed results
  const results = {
    timestamp: new Date().toISOString(),
    test: 'S2-T1 Object Pooling GC Impact',
    iterations,
    withoutPooling,
    withPooling,
    improvements: {
      gcReduction: gcReduction,
      timeReduction: timeReduction
    },
    acceptanceCriteria: {
      gcReductionTarget: 50,
      gcReductionActual: gcReduction,
      passed: gcReduction >= 50
    }
  };
  
  require('fs').writeFileSync('./gc-pooling-results.json', JSON.stringify(results, null, 2));
  console.log('📁 Detailed results saved to: gc-pooling-results.json');
  
  return results;
}

if (require.main === module) {
  runGCComparisonTest().catch(console.error);
}

module.exports = { runGCComparisonTest };
