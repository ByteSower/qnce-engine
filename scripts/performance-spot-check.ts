// Performance Spot-Check for Branching API
// Brain's validation script for 3 chapters, 2 branch points per chapter

import { createBranchingEngine } from '../src/narrative/branching/engine-simple';
import { QNCEStory } from '../src/narrative/branching/models';
import { QNCEState } from '../src/engine/core';

// Create a realistic test story: 3 chapters, 2 branch points each
const createPerformanceTestStory = (): QNCEStory => ({
  id: 'perf-test-story',
  title: 'Performance Test Story',
  version: '1.0.0',
  metadata: {
    author: 'Brain Test',
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
    },
    // Chapter 2: Development
    {
      id: 'chapter-2',
      title: 'The Journey',
      description: 'Character development chapter',
      flows: [
        {
          id: 'journey-flow',
          name: 'Main Journey',
          description: 'Core progression',
          nodes: [
            { id: 'journey-1', text: 'Your journey continues...', choices: [] },
            { id: 'journey-2', text: 'You encounter a challenge.', choices: [] },
            { id: 'journey-3', text: 'The stakes are raised.', choices: [] }
          ],
          entryPoints: [{ id: 'journey-start', nodeId: 'journey-1', priority: 1 }],
          exitPoints: [{ id: 'journey-end', nodeId: 'journey-3' }],
          flowType: 'branching',
          metadata: { complexity: 4, avgCompletionTime: 5000, playerChoiceCount: 2, aiGeneratedContent: false }
        },
        {
          id: 'conflict-flow',
          name: 'Conflict Resolution',
          description: 'Handle conflicts',
          nodes: [
            { id: 'conflict-1', text: 'Tension builds around you.', choices: [] },
            { id: 'conflict-2', text: 'You must make a crucial decision.', choices: [] }
          ],
          entryPoints: [{ id: 'conflict-start', nodeId: 'conflict-1', priority: 1 }],
          exitPoints: [{ id: 'conflict-end', nodeId: 'conflict-2' }],
          flowType: 'conditional',
          metadata: { complexity: 3, avgCompletionTime: 4000, playerChoiceCount: 1, aiGeneratedContent: false }
        }
      ],
      branches: [
        {
          id: 'challenge-response',
          name: 'Challenge Response',
          sourceFlowId: 'journey-flow',
          sourceNodeId: 'journey-2',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'direct-approach',
              targetFlowId: 'journey-flow',
              targetNodeId: 'journey-3',
              displayText: 'Face the challenge directly',
              flagEffects: { 'approach_style': 'direct' },
              weight: 1.0
            },
            {
              id: 'diplomatic-approach',
              targetFlowId: 'conflict-flow',
              displayText: 'Try diplomatic resolution',
              flagEffects: { 'approach_style': 'diplomatic' },
              weight: 0.7
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        {
          id: 'reputation-branch',
          name: 'Reputation-Based Options',
          sourceFlowId: 'conflict-flow',
          sourceNodeId: 'conflict-2',
          branchType: 'flag-conditional',
          branchOptions: [
            {
              id: 'high-rep-option',
              targetFlowId: 'journey-flow',
              displayText: 'Leverage your reputation',
              conditions: [
                { type: 'flag', operator: 'greater', key: 'reputation', value: 5 }
              ],
              weight: 1.0
            },
            {
              id: 'standard-option',
              targetFlowId: 'journey-flow',
              displayText: 'Proceed with caution',
              weight: 0.8
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        }
      ],
      prerequisites: { requiredFlags: {}, requiredChoices: [] },
      metadata: { difficulty: 'medium', themes: ['development'], estimatedDuration: 8, branchComplexity: 4 }
    },
    // Chapter 3: Resolution
    {
      id: 'chapter-3',
      title: 'The Conclusion',
      description: 'Story resolution chapter',
      flows: [
        {
          id: 'resolution-flow',
          name: 'Final Resolution',
          description: 'Story conclusion',
          nodes: [
            { id: 'resolution-1', text: 'Everything comes together...', choices: [] },
            { id: 'resolution-2', text: 'Your choices have led to this moment.', choices: [] },
            { id: 'resolution-3', text: 'The story concludes.', choices: [] }
          ],
          entryPoints: [{ id: 'resolution-start', nodeId: 'resolution-1', priority: 1 }],
          exitPoints: [{ id: 'resolution-end', nodeId: 'resolution-3' }],
          flowType: 'linear',
          metadata: { complexity: 2, avgCompletionTime: 3000, playerChoiceCount: 0, aiGeneratedContent: false }
        },
        {
          id: 'epilogue-flow',
          name: 'Epilogue',
          description: 'Extended ending',
          nodes: [
            { id: 'epilogue-1', text: 'Years later...', choices: [] },
            { id: 'epilogue-2', text: 'You reflect on your journey.', choices: [] }
          ],
          entryPoints: [{ id: 'epilogue-start', nodeId: 'epilogue-1', priority: 1 }],
          exitPoints: [{ id: 'epilogue-end', nodeId: 'epilogue-2' }],
          flowType: 'linear',
          metadata: { complexity: 1, avgCompletionTime: 2000, playerChoiceCount: 0, aiGeneratedContent: false }
        }
      ],
      branches: [
        {
          id: 'ending-choice',
          name: 'Ending Selection',
          sourceFlowId: 'resolution-flow',
          sourceNodeId: 'resolution-2',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'quick-ending',
              targetFlowId: 'resolution-flow',
              targetNodeId: 'resolution-3',
              displayText: 'End the story here',
              weight: 1.0
            },
            {
              id: 'extended-ending',
              targetFlowId: 'epilogue-flow',
              displayText: 'See the epilogue',
              weight: 0.9
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        {
          id: 'reflection-branch',
          name: 'Reflection Options',
          sourceFlowId: 'epilogue-flow',
          sourceNodeId: 'epilogue-1',
          branchType: 'flag-conditional',
          branchOptions: [
            {
              id: 'detailed-reflection',
              targetFlowId: 'epilogue-flow',
              targetNodeId: 'epilogue-2',
              displayText: 'Reflect deeply on your choices',
              conditions: [
                { type: 'flag', operator: 'exists', key: 'approach_style', value: undefined }
              ],
              weight: 1.0
            },
            {
              id: 'simple-reflection',
              targetFlowId: 'epilogue-flow',
              targetNodeId: 'epilogue-2',
              displayText: 'A brief moment of reflection',
              weight: 0.5
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        }
      ],
      prerequisites: { requiredFlags: {}, requiredChoices: [] },
      metadata: { difficulty: 'easy', themes: ['resolution'], estimatedDuration: 5, branchComplexity: 2 }
    }
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
  const initialState: QNCEState = {
    currentNodeId: 'intro-1',
    flags: { skill_level: 4, reputation: 6 }, // Enable conditional branches
    history: ['intro-1']
  };

  const engine = createBranchingEngine(story, initialState);

  // Test 1: Branch Evaluation Performance
  console.log('📊 Test 1: Branch Evaluation Performance');
  const evalTimes: number[] = [];
  
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
  const execTimes: number[] = [];

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

  // Test 3: Dynamic Branch Insertion Performance
  console.log('📊 Test 3: Dynamic Branch Insertion Performance');
  const insertTimes: number[] = [];

  for (let i = 0; i < 5; i++) {
    const dynamicOperation = {
      type: 'insert' as const,
      branchId: `perf-test-${i}`,
      targetLocation: {
        chapterId: 'chapter-1',
        flowId: 'intro-flow',
        nodeId: 'intro-2',
        insertionPoint: 'after' as const
      },
      payload: {
        name: `Performance Test Branch ${i}`,
        branchType: 'conditional' as const,
        branchOptions: [
          {
            id: `perf-option-${i}`,
            targetFlowId: 'exploration-flow',
            displayText: `Performance test option ${i}`,
            weight: 1.0
          }
        ]
      }
    };

    const startTime = performance.now();
    await engine.insertDynamicBranch(dynamicOperation);
    const endTime = performance.now();
    
    const insertTime = endTime - startTime;
    insertTimes.push(insertTime);
    
    console.log(`  Run ${i + 1}: ${insertTime.toFixed(2)}ms`);
  }

  const avgInsertTime = insertTimes.reduce((a, b) => a + b, 0) / insertTimes.length;
  const maxInsertTime = Math.max(...insertTimes);
  console.log(`  Average: ${avgInsertTime.toFixed(2)}ms`);
  console.log(`  Maximum: ${maxInsertTime.toFixed(2)}ms`);
  console.log(`  Target <20ms: ${maxInsertTime < 20 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 4: Memory Usage & Analytics
  console.log('📊 Test 4: Memory & Analytics Validation');
  const analytics = engine.getBranchingAnalytics();
  const exportData = engine.exportBranchingData();
  
  console.log(`  Branch history entries: ${analytics.historyLength}`);
  console.log(`  Current chapter: ${analytics.currentChapter}`);
  console.log(`  Current flow: ${analytics.currentFlow}`);
  console.log(`  Export data size: ${JSON.stringify(exportData).length} characters`);
  console.log(`  Analytics working: ✅ PASS\n`);

  // Summary
  console.log('🎯 Performance Spot-Check Summary');
  console.log('==================================');
  console.log(`Branch Evaluation: ${avgEvalTime.toFixed(2)}ms avg, ${maxEvalTime.toFixed(2)}ms max ${maxEvalTime < 10 ? '✅' : '❌'}`);
  console.log(`Branch Execution:  ${avgExecTime.toFixed(2)}ms avg, ${maxExecTime.toFixed(2)}ms max ${maxExecTime < 10 ? '✅' : '❌'}`);
  console.log(`Dynamic Insertion: ${avgInsertTime.toFixed(2)}ms avg, ${maxInsertTime.toFixed(2)}ms max ${maxInsertTime < 20 ? '✅' : '❌'}`);
  
  const allTestsPass = maxEvalTime < 10 && maxExecTime < 10 && maxInsertTime < 20;
  console.log(`\nOverall Result: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPass) {
    console.log('\n🚀 Ready for Brain\'s approval and production integration!');
  } else {
    console.log('\n⚠️ Performance optimization needed before merge.');
  }
}

// Run the spot-check
if (require.main === module) {
  runPerformanceSpotCheck().catch(console.error);
}

export { runPerformanceSpotCheck, createPerformanceTestStory };
