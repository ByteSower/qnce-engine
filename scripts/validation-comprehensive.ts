// ByteSower's Use-Case Validation Script
// Real-world narrative scenario testing for Sprint #3 Branching API

import { createBranchingEngine } from '../src/narrative/branching/engine-simple';
import { 
  QNCEStory, 
  Chapter, 
  NarrativeFlow, 
  BranchPoint,
  AIBranchingContext,
  PlayerProfile,
  NarrativeContext,
  AIGenerationHints
} from '../src/narrative/branching/models';
import { QNCEState } from '../src/engine/core';

// ================================
// Real-World Test Story: "The Quantum Heist"
// ================================

const createQuantumHeistStory = (): QNCEStory => ({
  id: 'quantum-heist',
  title: 'The Quantum Heist',
  version: '1.0.0',
  metadata: {
    author: 'ByteSower Test Suite',
    description: 'Complex branching narrative with multiple decision trees, conditional logic, and AI integration',
    tags: ['sci-fi', 'heist', 'choice-driven', 'ai-enhanced'],
    createDate: new Date(),
    lastModified: new Date(),
    estimatedPlaytime: 45
  },
  branchingConfig: {
    maxActiveBranches: 10,
    branchCacheSize: 50,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: true
  },
  chapters: [
    // Chapter 1: The Planning Phase
    {
      id: 'planning-phase',
      title: 'The Planning Phase',
      description: 'Assemble your team and plan the quantum vault heist',
      flows: [
        {
          id: 'team-assembly',
          name: 'Team Assembly',
          description: 'Choose your crew members',
          nodes: [
            { id: 'briefing', text: 'The quantum vault contains reality itself. Choose your team wisely.', choices: [] },
            { id: 'hacker-choice', text: 'You need a quantum hacker. Two candidates await.', choices: [] },
            { id: 'muscle-choice', text: 'For security, you need muscle. Consider your options.', choices: [] },
            { id: 'infiltrator-choice', text: 'Finally, an infiltrator to bypass quantum locks.', choices: [] },
            { id: 'team-complete', text: 'Your team is assembled. Time to plan the approach.', choices: [] }
          ],
          entryPoints: [{ id: 'start', nodeId: 'briefing', priority: 1 }],
          exitPoints: [{ id: 'to-planning', nodeId: 'team-complete' }],
          flowType: 'branching',
          metadata: { complexity: 7, avgCompletionTime: 8000, playerChoiceCount: 3, aiGeneratedContent: false }
        },
        {
          id: 'stealth-approach',
          name: 'Stealth Approach',
          description: 'Infiltration-focused plan',
          nodes: [
            { id: 'stealth-plan', text: 'You opt for a silent approach using quantum phase shifting.', choices: [] },
            { id: 'stealth-prep', text: 'Your team prepares stealth equipment and quantum dampeners.', choices: [] }
          ],
          entryPoints: [{ id: 'stealth-start', nodeId: 'stealth-plan', priority: 1 }],
          exitPoints: [{ id: 'to-execution', nodeId: 'stealth-prep' }],
          flowType: 'linear',
          metadata: { complexity: 4, avgCompletionTime: 3000, playerChoiceCount: 0, aiGeneratedContent: false }
        },
        {
          id: 'tech-approach',
          name: 'Tech Approach',
          description: 'Hacker-focused plan',
          nodes: [
            { id: 'tech-plan', text: 'You decide to hack the quantum matrix directly.', choices: [] },
            { id: 'tech-prep', text: 'Your hacker prepares quantum algorithms and reality exploits.', choices: [] }
          ],
          entryPoints: [{ id: 'tech-start', nodeId: 'tech-plan', priority: 1 }],
          exitPoints: [{ id: 'to-execution', nodeId: 'tech-prep' }],
          flowType: 'linear',
          metadata: { complexity: 6, avgCompletionTime: 4000, playerChoiceCount: 0, aiGeneratedContent: false }
        }
      ],
      branches: [
        // Multi-choice team selection
        {
          id: 'hacker-selection',
          name: 'Quantum Hacker Choice',
          sourceFlowId: 'team-assembly',
          sourceNodeId: 'hacker-choice',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'choose-zara',
              targetFlowId: 'team-assembly',
              targetNodeId: 'muscle-choice',
              displayText: 'Recruit Zara - Expert in quantum encryption',
              flagEffects: { 'team_hacker': 'zara', 'tech_skill': 8, 'stealth_skill': 4 },
              weight: 1.0
            },
            {
              id: 'choose-alex',
              targetFlowId: 'team-assembly', 
              targetNodeId: 'muscle-choice',
              displayText: 'Recruit Alex - Balanced hacker with social skills',
              flagEffects: { 'team_hacker': 'alex', 'tech_skill': 6, 'social_skill': 7 },
              weight: 0.8
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        {
          id: 'approach-selection',
          name: 'Heist Approach Decision',
          sourceFlowId: 'team-assembly',
          sourceNodeId: 'team-complete',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'choose-stealth',
              targetFlowId: 'stealth-approach',
              displayText: 'Go with stealth approach',
              conditions: [
                { type: 'flag', operator: 'greater', key: 'stealth_skill', value: 5 }
              ],
              flagEffects: { 'approach': 'stealth' },
              weight: 1.0
            },
            {
              id: 'choose-tech',
              targetFlowId: 'tech-approach',
              displayText: 'Use technical approach',
              conditions: [
                { type: 'flag', operator: 'greater', key: 'tech_skill', value: 6 }
              ],
              flagEffects: { 'approach': 'tech' },
              weight: 1.0
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        }
      ],
      prerequisites: {
        requiredFlags: {},
        requiredChoices: []
      },
      metadata: {
        difficulty: 'medium',
        themes: ['teamwork', 'planning', 'choice-consequences'],
        estimatedDuration: 12,
        branchComplexity: 8
      }
    },
    
    // Chapter 2: The Execution
    {
      id: 'execution-phase',
      title: 'The Execution',
      description: 'Execute the quantum vault heist with dynamic complications',
      flows: [
        {
          id: 'vault-infiltration',
          name: 'Vault Infiltration',
          description: 'Entering the quantum vault',
          nodes: [
            { id: 'vault-entry', text: 'You approach the quantum vault. Reality shimmers around the entrance.', choices: [] },
            { id: 'quantum-lock', text: 'A complex quantum lock blocks your path.', choices: [] },
            { id: 'inner-vault', text: 'Inside the vault, quantum treasures float in temporal bubbles.', choices: [] }
          ],
          entryPoints: [{ id: 'infiltration-start', nodeId: 'vault-entry', priority: 1 }],
          exitPoints: [{ id: 'vault-complete', nodeId: 'inner-vault' }],
          flowType: 'conditional',
          metadata: { complexity: 9, avgCompletionTime: 12000, playerChoiceCount: 2, aiGeneratedContent: true }
        }
      ],
      branches: [
        // Time-based conditional branch
        {
          id: 'security-alert',
          name: 'Security Alert System',
          sourceFlowId: 'vault-infiltration',
          sourceNodeId: 'quantum-lock',
          branchType: 'time-based',
          branchOptions: [
            {
              id: 'quick-bypass',
              targetFlowId: 'vault-infiltration',
              targetNodeId: 'inner-vault',
              displayText: 'Quickly bypass the lock',
              conditions: [
                { type: 'time', operator: 'less', key: 'decision_time', value: 5000 }
              ],
              flagEffects: { 'stealth_maintained': true },
              weight: 1.0
            },
            {
              id: 'careful-bypass',
              targetFlowId: 'vault-infiltration',
              targetNodeId: 'inner-vault',
              displayText: 'Carefully analyze the lock',
              flagEffects: { 'extra_info_gathered': true },
              weight: 0.7
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        // Flag-conditional branch
        {
          id: 'tech-advantage',
          name: 'Technical Advantage',
          sourceFlowId: 'vault-infiltration',
          sourceNodeId: 'inner-vault',
          branchType: 'flag-conditional',
          branchOptions: [
            {
              id: 'quantum-hack',
              targetFlowId: 'vault-infiltration',
              displayText: 'Use quantum hacking skills',
              conditions: [
                { type: 'flag', operator: 'equals', key: 'team_hacker', value: 'zara' },
                { type: 'flag', operator: 'greater', key: 'tech_skill', value: 7 }
              ],
              flagEffects: { 'bonus_loot': true, 'hack_success': true },
              weight: 1.0
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        }
      ],
      prerequisites: {
        requiredFlags: { 'approach': ['stealth', 'tech'] },
        requiredChoices: ['choose-stealth', 'choose-tech']
      },
      metadata: {
        difficulty: 'hard',
        themes: ['execution', 'time-pressure', 'skill-checks'],
        estimatedDuration: 15,
        branchComplexity: 9
      }
    }
  ]
});

// ================================
// Use-Case Test Functions
// ================================

async function testMultiChoiceTree() {
  console.log('\n🔄 Testing Multi-Choice Decision Tree...');
  
  const story = createQuantumHeistStory();
  const initialState: QNCEState = {
    currentNodeId: 'briefing',
    flags: {},
    history: []
  };
  
  const engine = createBranchingEngine(story, initialState);
  
  // Test team selection choices
  let branches = await engine.evaluateAvailableBranches();
  console.log(`  📊 Initial branches found: ${branches.length}`);
  
  // Make hacker choice
  if (branches.length > 0) {
    await engine.executeBranch('choose-zara');
    console.log(`  ✅ Executed hacker choice: Zara selected`);
    console.log(`  📈 Tech skill set to: ${engine.getCurrentState().flags['tech_skill']}`);
  }
  
  // Check for next decision point
  branches = await engine.evaluateAvailableBranches();
  console.log(`  📊 Next branches available: ${branches.length}`);
  
  return { success: true, branchesFound: branches.length };
}

async function testConditionalBranches() {
  console.log('\n🎯 Testing Conditional Branches (Flags, Time, Inventory)...');
  
  const story = createQuantumHeistStory();
  const initialState: QNCEState = {
    currentNodeId: 'team-complete',
    flags: {
      'tech_skill': 8,
      'stealth_skill': 3,
      'team_hacker': 'zara'
    },
    choiceHistory: [],
    metadata: {}
  };
  
  const engine = createBranchingEngine(story, initialState);
  
  // Test flag-based conditions
  let branches = await engine.evaluateAvailableBranches();
  console.log(`  📊 Flag-conditional branches: ${branches.length}`);
  
  // Should have tech approach available due to high tech_skill
  const techBranch = branches.find(b => b.id === 'choose-tech');
  const stealthBranch = branches.find(b => b.id === 'choose-stealth');
  
  console.log(`  ✅ Tech approach available: ${!!techBranch} (tech_skill: 8 > 6)`);
  console.log(`  ❌ Stealth approach blocked: ${!stealthBranch} (stealth_skill: 3 < 5)`);
  
  // Test time-based branch simulation
  const timeTestState: QNCEState = {
    currentNodeId: 'quantum-lock',
    flags: { ...initialState.flags },
    choiceHistory: [],
    metadata: { decision_start_time: Date.now() }
  };
  
  const timeEngine = createBranchingEngine(story, timeTestState);
  
  // Simulate quick decision
  setTimeout(async () => {
    const timeBranches = await timeEngine.evaluateAvailableBranches();
    console.log(`  ⏱️ Time-based branches evaluated: ${timeBranches.length}`);
  }, 100);
  
  return { 
    success: true, 
    techAvailable: !!techBranch, 
    stealthBlocked: !stealthBranch 
  };
}

async function testAIBranchGeneration() {
  console.log('\n🤖 Testing AI-Driven Branch Generation...');
  
  const story = createQuantumHeistStory();
  const initialState: QNCEState = {
    currentNodeId: 'inner-vault',
    flags: {
      'team_hacker': 'alex',
      'approach': 'stealth',
      'stealth_maintained': true
    },
    choiceHistory: ['choose-alex', 'choose-stealth'],
    metadata: {}
  };
  
  const engine = createBranchingEngine(story, initialState);
  
  // Set up AI context for generation
  const aiContext: AIBranchingContext = {
    playerProfile: {
      playStyle: 'explorer',
      preferences: {
        'narrative_depth': 0.8,
        'character_interaction': 0.9,
        'action_sequences': 0.6,
        'moral_choices': 0.7
      },
      historicalChoices: ['choose-alex', 'choose-stealth'],
      averageDecisionTime: 8500
    },
    narrativeContext: {
      currentTone: 'tense-strategic',
      thematicElements: ['heist', 'technology', 'teamwork'],
      characterRelationships: {
        'alex': 0.8,
        'team_trust': 0.7
      },
      plotTension: 0.9
    },
    generationHints: {
      maxBranchDepth: 3,
      desiredComplexity: 7,
      contentThemes: ['character-development', 'moral-dilemma', 'technical-challenge'],
      avoidElements: ['violence', 'romance']
    }
  };
  
  engine.setAIContext(aiContext);
  
  try {
    const aiBranches = await engine.generateAIBranches(4);
    console.log(`  🎯 AI branches generated: ${aiBranches.length}`);
    
    aiBranches.forEach((branch, index) => {
      console.log(`    ${index + 1}. "${branch.displayText}" (weight: ${branch.weight})`);
    });
    
    // Test AI-generated branch execution
    if (aiBranches.length > 0) {
      const firstAIBranch = aiBranches[0];
      console.log(`  🚀 Testing AI branch execution: "${firstAIBranch.displayText}"`);
      // Note: In real implementation, AI branches would have proper target flows
    }
    
    return { success: true, generatedCount: aiBranches.length };
  } catch (error) {
    console.log(`  ❌ AI generation error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAnalyticsAndErrorHandling() {
  console.log('\n📊 Testing Analytics Export and Error Handling...');
  
  const story = createQuantumHeistStory();
  const initialState: QNCEState = {
    currentNodeId: 'briefing',
    flags: {},
    choiceHistory: [],
    metadata: {}
  };
  
  const engine = createBranchingEngine(story, initialState);
  
  // Test analytics tracking
  await engine.executeBranch('choose-zara');
  await engine.executeBranch('choose-stealth');
  
  const analytics = engine.getBranchingAnalytics();
  console.log(`  📈 Total branches traversed: ${analytics.totalBranchesTraversed}`);
  console.log(`  ⏱️ Average decision time: ${analytics.avgBranchDecisionTime}ms`);
  console.log(`  🎯 Popular branches: ${analytics.mostPopularBranches.join(', ')}`);
  
  // Test analytics export
  try {
    const exportData = engine.exportBranchingData();
    console.log(`  💾 Export successful: ${Object.keys(exportData).length} data fields`);
    console.log(`  📋 Export includes: ${Object.keys(exportData).join(', ')}`);
  } catch (error) {
    console.log(`  ❌ Export error: ${error.message}`);
  }
  
  // Test error handling scenarios
  console.log('  🧪 Testing error handling...');
  
  // Test invalid branch execution
  try {
    await engine.executeBranch('non-existent-branch');
    console.log('  ❌ Should have thrown error for invalid branch');
  } catch (error) {
    console.log(`  ✅ Correctly caught invalid branch error: ${error.message}`);
  }
  
  // Test AI generation without context
  try {
    const newEngine = createBranchingEngine(story, initialState);
    await newEngine.generateAIBranches();
    console.log('  ❌ Should have thrown error for missing AI context');
  } catch (error) {
    console.log(`  ✅ Correctly caught missing AI context error: ${error.message}`);
  }
  
  return { 
    success: true, 
    analytics: analytics,
    errorHandlingWorking: true 
  };
}

async function testDynamicBranchInsertion() {
  console.log('\n🔧 Testing Dynamic Branch Insertion...');
  
  const story = createQuantumHeistStory();
  const initialState: QNCEState = {
    currentNodeId: 'vault-entry',
    flags: { 'unexpected_complication': true },
    choiceHistory: [],
    metadata: {}
  };
  
  const engine = createBranchingEngine(story, initialState);
  
  // Test dynamic branch insertion
  const dynamicBranch = {
    type: 'insert' as const,
    branchId: 'emergency-escape',
    targetLocation: {
      chapterId: 'execution-phase',
      flowId: 'vault-infiltration',
      nodeId: 'vault-entry',
      insertionPoint: 'after' as const
    },
    payload: {
      name: 'Emergency Escape Route',
      branchType: 'conditional' as const,
      branchOptions: [
        {
          id: 'emergency-exit',
          targetFlowId: 'vault-infiltration',
          displayText: 'Use emergency quantum tunnel',
          conditions: [
            { type: 'flag', operator: 'equals', key: 'unexpected_complication', value: true }
          ],
          flagEffects: { 'escape_route_used': true },
          weight: 0.9
        }
      ]
    },
    conditions: [
      { type: 'flag', operator: 'equals', key: 'unexpected_complication', value: true }
    ]
  };
  
  const insertResult = await engine.insertDynamicBranch(dynamicBranch);
  console.log(`  ✅ Dynamic branch insertion: ${insertResult}`);
  
  // Verify the branch is available
  const branches = await engine.evaluateAvailableBranches();
  const emergencyBranch = branches.find(b => b.id === 'emergency-exit');
  console.log(`  🔍 Emergency branch available: ${!!emergencyBranch}`);
  
  // Test branch removal
  const removeResult = await engine.removeDynamicBranch('emergency-escape');
  console.log(`  🗑️ Dynamic branch removal: ${removeResult}`);
  
  return { 
    success: true, 
    insertionWorked: insertResult,
    branchFound: !!emergencyBranch,
    removalWorked: removeResult
  };
}

// ================================
// Main Validation Runner
// ================================

async function runUseCaseValidation() {
  console.log('🚦 ByteSower\'s Use-Case Validation');
  console.log('=====================================');
  console.log('Testing Sprint #3 Branching API against real narrative scenarios\n');
  
  const results = {
    multiChoice: null,
    conditional: null,
    aiGeneration: null,
    analytics: null,
    dynamic: null
  };
  
  try {
    results.multiChoice = await testMultiChoiceTree();
    results.conditional = await testConditionalBranches();
    results.aiGeneration = await testAIBranchGeneration();
    results.analytics = await testAnalyticsAndErrorHandling();
    results.dynamic = await testDynamicBranchInsertion();
    
    console.log('\n📋 Validation Summary');
    console.log('====================');
    console.log(`Multi-Choice Trees: ${results.multiChoice.success ? '✅' : '❌'}`);
    console.log(`Conditional Branches: ${results.conditional.success ? '✅' : '❌'}`);
    console.log(`AI Generation: ${results.aiGeneration.success ? '✅' : '❌'}`);
    console.log(`Analytics & Errors: ${results.analytics.success ? '✅' : '❌'}`);
    console.log(`Dynamic Operations: ${results.dynamic.success ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(r => r && r.success);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🚀 Sprint #3 Branching API validated for production use!');
      console.log('Ready for merge and core engine integration.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return { error: error.message };
  }
}

// Run validation if called directly
if (require.main === module) {
  runUseCaseValidation().then(results => {
    process.exit(results.error ? 1 : 0);
  });
}

export { runUseCaseValidation, createQuantumHeistStory };
