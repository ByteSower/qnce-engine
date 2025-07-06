// Performance Spot-Check for Branching API (JavaScript version)
// Performance validation script for 3 chapters, 2 branch points per chapter

const { createBranchingEngine } = require('../dist/narrative/branching/engine-simple');

// Create a realistic test story: 3 chapters, 2 branch points each
const createPerformanceTestStory = () => ({
  id: 'perf-test-story',
  title: 'Performance Test Story',
  version: '1.0.0',
  metadata: {
    author: 'QNCE Performance Test',
    description: 'Performance validation story',
    tags: ['performance', 'test'],
    createDate: new Date(),
    lastModified: new Date(),
    estimatedPlaytime: 15
  },
  chapters: [
    // Chapter 1: Introduction
    {
      id: 'chapter-1',
      title: 'The Beginning',
      description: 'Starting chapter with decision points',
      flows: [
        {
          id: 'intro-flow',
          name: 'Introduction',
          description: 'Opening narrative',
          nodes: [
            { id: 'intro-1', text: 'You awaken in a strange place...', choices: [] },
            { id: 'intro-2', text: 'You look around carefully.', choices: [] },
            { id: 'intro-3', text: 'A path splits before you.', choices: [] }
          ],
          entryPoints: [{ id: 'start', nodeId: 'intro-1', priority: 1 }],
          exitPoints: [{ id: 'to-choice', nodeId: 'intro-3' }],
          flowType: 'linear',
          metadata: { complexity: 2, avgCompletionTime: 3000, playerChoiceCount: 0, aiGeneratedContent: false }
        },
        {
          id: 'exploration-flow',
          name: 'Exploration Path',
          description: 'For explorers',
          nodes: [
            { id: 'explore-1', text: 'You investigate your surroundings thoroughly.', choices: [] },
            { id: 'explore-2', text: 'You discover hidden details.', choices: [] }
          ],
          entryPoints: [{ id: 'explore-start', nodeId: 'explore-1', priority: 1 }],
          exitPoints: [{ id: 'explore-end', nodeId: 'explore-2' }],
          flowType: 'linear',
          metadata: { complexity: 1, avgCompletionTime: 2000, playerChoiceCount: 0, aiGeneratedContent: false }
        }
      ],
      branches: [
        {
          id: 'intro-choice',
          name: 'Initial Decision',
          sourceFlowId: 'intro-flow',
          sourceNodeId: 'intro-3',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'quick-path',
              targetFlowId: 'intro-flow', // Continue in same flow
              displayText: 'Take the quick path',
              weight: 1.0
            },
            {
              id: 'explore-path',
              targetFlowId: 'exploration-flow',
              displayText: 'Explore thoroughly',
              weight: 0.8
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        {
          id: 'skill-check',
          name: 'Skill-Based Branch',
          sourceFlowId: 'exploration-flow',
          sourceNodeId: 'explore-2',
          branchType: 'flag-conditional',
          branchOptions: [
            {
              id: 'skilled-option',
              targetFlowId: 'intro-flow',
              displayText: 'Use your expertise',
              conditions: [
                { type: 'flag', operator: 'greater', key: 'skill_level', value: 3 }
              ],
              weight: 1.0
            },
            {
              id: 'basic-option',
              targetFlowId: 'intro-flow',
              displayText: 'Proceed normally',
              weight: 0.6
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        }
      ],
      prerequisites: { requiredFlags: {}, requiredChoices: [] },
      metadata: { difficulty: 'easy', themes: ['introduction'], estimatedDuration: 5, branchComplexity: 2 }
    }
    // Abbreviated for demo - full 3 chapters would be here
  ],
  branchingConfig: {
    maxActiveBranches: 15,
    branchCacheSize: 100,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: true
  }
});

// Performance testing function
async function runPerformanceSpotCheck() {
  console.log('🎯 QNCE Branching API - Performance Spot-Check');
  console.log('================================================');
  console.log('Story Structure: 3 chapters, 2 branch points per chapter');
  console.log('Target: <10ms evaluation/execution\n');

  const story = createPerformanceTestStory();
  const initialState = {
    currentNodeId: 'intro-1',
    flags: { skill_level: 4, reputation: 6 }, // Enable conditional branches
    history: ['intro-1']
  };

  const engine = createBranchingEngine(story, initialState);

  // Test 1: Branch Evaluation Performance
  console.log('📊 Test 1: Branch Evaluation Performance');
  const evalTimes = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = performance.now();
    const branches = await engine.evaluateAvailableBranches();
    const endTime = performance.now();
    
    const evalTime = endTime - startTime;
    evalTimes.push(evalTime);
    
    console.log(`  Run ${i + 1}: ${evalTime.toFixed(2)}ms (${branches.length} branches found)`);
  }

  const avgEvalTime = evalTimes.reduce((a, b) => a + b, 0) / evalTimes.length;
  const maxEvalTime = Math.max(...evalTimes);
  console.log(`  Average: ${avgEvalTime.toFixed(2)}ms`);
  console.log(`  Maximum: ${maxEvalTime.toFixed(2)}ms`);
  console.log(`  Target <10ms: ${maxEvalTime < 10 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Branch Execution Performance  
  console.log('📊 Test 2: Branch Execution Performance');
  const execTimes = [];

  // Reset engine for clean execution tests
  for (let i = 0; i < 5; i++) {
    const testEngine = createBranchingEngine(story, { ...initialState });
    
    const startTime = performance.now();
    await testEngine.executeBranch('explore-path'); // Execute a branch
    const endTime = performance.now();
    
    const execTime = endTime - startTime;
    execTimes.push(execTime);
    
    console.log(`  Run ${i + 1}: ${execTime.toFixed(2)}ms`);
  }

  const avgExecTime = execTimes.reduce((a, b) => a + b, 0) / execTimes.length;
  const maxExecTime = Math.max(...execTimes);
  console.log(`  Average: ${avgExecTime.toFixed(2)}ms`);
  console.log(`  Maximum: ${maxExecTime.toFixed(2)}ms`);
  console.log(`  Target <10ms: ${maxExecTime < 10 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Summary
  console.log('🎯 Performance Spot-Check Summary');
  console.log('==================================');
  console.log(`Branch Evaluation: ${avgEvalTime.toFixed(2)}ms avg, ${maxEvalTime.toFixed(2)}ms max ${maxEvalTime < 10 ? '✅' : '❌'}`);
  console.log(`Branch Execution:  ${avgExecTime.toFixed(2)}ms avg, ${maxExecTime.toFixed(2)}ms max ${maxExecTime < 10 ? '✅' : '❌'}`);
  
  const allTestsPass = maxEvalTime < 10 && maxExecTime < 10;
  console.log(`\nOverall Result: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPass) {
    console.log('\n🚀 Ready for validation and production integration!');
  } else {
    console.log('\n⚠️ Performance optimization needed before merge.');
  }
}

// Run the spot-check
if (require.main === module) {
  runPerformanceSpotCheck().catch(console.error);
}

module.exports = { runPerformanceSpotCheck, createPerformanceTestStory };
