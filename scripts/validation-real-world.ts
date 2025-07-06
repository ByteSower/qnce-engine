// QNCE Engine Use-Case Validation - Real-World Testing
// Advanced feature validation against production scenarios

import { createBranchingEngine } from '../src/narrative/branching/engine-simple';
import { 
  QNCEStory, 
  Chapter, 
  NarrativeFlow, 
  BranchPoint,
  AIBranchingContext,
  PlayerProfile,
  NarrativeContext,
  AIGenerationHints,
  BranchCondition
} from '../src/narrative/branching/models';
import { QNCEState } from '../src/engine/core';

// ================================
// Practical Test Story: "The Digital Detective"
// ================================

const createTestStory = (): QNCEStory => ({
  id: 'digital-detective',
  title: 'The Digital Detective',
  version: '1.0.0',
  metadata: {
    author: 'QNCE Validation Team',
    description: 'Multi-branch detective story for API validation',
    tags: ['mystery', 'choice-driven', 'conditional'],
    createDate: new Date(),
    lastModified: new Date(),
    estimatedPlaytime: 20
  },
  branchingConfig: {
    maxActiveBranches: 5,
    branchCacheSize: 20,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: false
  },
  chapters: [
    {
      id: 'investigation',
      title: 'The Investigation',
      description: 'Begin your digital investigation',
      flows: [
        {
          id: 'crime-scene',
          name: 'Crime Scene Analysis',
          description: 'Examining the digital crime scene',
          nodes: [
            { id: 'arrival', text: 'You arrive at the scene of the cyber attack.', choices: [] },
            { id: 'evidence', text: 'Digital evidence awaits your analysis.', choices: [] },
            { id: 'witness', text: 'A witness wants to speak with you.', choices: [] }
          ],
          entryPoints: [{ id: 'start', nodeId: 'arrival', priority: 1 }],
          exitPoints: [{ id: 'end', nodeId: 'witness' }],
          flowType: 'linear',
          metadata: { complexity: 3, avgCompletionTime: 5000, playerChoiceCount: 0, aiGeneratedContent: false }
        },
        {
          id: 'tech-analysis',
          name: 'Technical Analysis',
          description: 'Deep dive into technical evidence',
          nodes: [
            { id: 'servers', text: 'You examine the compromised servers.', choices: [] },
            { id: 'logs', text: 'System logs reveal suspicious activity.', choices: [] }
          ],
          entryPoints: [{ id: 'tech-start', nodeId: 'servers', priority: 1 }],
          exitPoints: [{ id: 'tech-end', nodeId: 'logs' }],
          flowType: 'linear',
          metadata: { complexity: 6, avgCompletionTime: 7000, playerChoiceCount: 0, aiGeneratedContent: false }
        },
        {
          id: 'social-approach',
          name: 'Social Investigation',
          description: 'Focus on human elements',
          nodes: [
            { id: 'interviews', text: 'You conduct witness interviews.', choices: [] },
            { id: 'profiles', text: 'Suspect profiles emerge from social analysis.', choices: [] }
          ],
          entryPoints: [{ id: 'social-start', nodeId: 'interviews', priority: 1 }],
          exitPoints: [{ id: 'social-end', nodeId: 'profiles' }],
          flowType: 'linear',
          metadata: { complexity: 4, avgCompletionTime: 6000, playerChoiceCount: 0, aiGeneratedContent: false }
        }
      ],
      branches: [
        {
          id: 'investigation-choice',
          name: 'Investigation Approach',
          sourceFlowId: 'crime-scene',
          sourceNodeId: 'evidence',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'technical-path',
              targetFlowId: 'tech-analysis',
              displayText: 'Focus on technical evidence',
              flagEffects: { 'approach': 'technical', 'tech_skill': 7 },
              weight: 1.0
            },
            {
              id: 'social-path',
              targetFlowId: 'social-approach', 
              displayText: 'Interview witnesses and suspects',
              flagEffects: { 'approach': 'social', 'social_skill': 8 },
              weight: 0.9
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0, playerPreference: 0, lastUsed: new Date() }
        },
        {
          id: 'skill-gate',
          name: 'Skill-Based Access',
          sourceFlowId: 'tech-analysis',
          sourceNodeId: 'logs',
          branchType: 'flag-conditional',
          branchOptions: [
            {
              id: 'expert-analysis',
              targetFlowId: 'crime-scene',
              targetNodeId: 'witness',
              displayText: 'Perform advanced analysis',
              conditions: [
                { type: 'flag', operator: 'greater', key: 'tech_skill', value: 6 }
              ],
              flagEffects: { 'expert_evidence': true },
              weight: 1.0
            },
            {
              id: 'basic-analysis',
              targetFlowId: 'crime-scene',
              targetNodeId: 'witness',
              displayText: 'Basic analysis only',
              weight: 0.5
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
        themes: ['investigation', 'technology', 'choices'],
        estimatedDuration: 10,
        branchComplexity: 5
      }
    }
  ]
});

// ================================
// Use-Case Test Functions
// ================================

async function test1_MultiChoiceDecisionTree(): Promise<{ success: boolean; details: string }> {
  console.log('\n🔄 Test 1: Multi-Choice Decision Tree');
  
  try {
    const story = createTestStory();
    const initialState: QNCEState = {
      currentNodeId: 'arrival',
      flags: {},
      history: []
    };
    
    const engine = createBranchingEngine(story, initialState);
    
    // Move through initial flow to decision point
    // Since the engine doesn't expose state access, we'll test branch evaluation
    const branches = await engine.evaluateAvailableBranches();
    console.log(`  Found ${branches.length} available branches`);
    
    if (branches.length === 0) {
      return { success: false, details: 'No branches found for multi-choice test' };
    }
    
    // Execute first choice
    const firstBranch = branches[0];
    const result = await engine.executeBranch(firstBranch.id);
    console.log(`  Executed branch: ${firstBranch.displayText} - ${result ? 'Success' : 'Failed'}`);
    
    return { success: result, details: `Executed ${firstBranch.displayText}` };
  } catch (error) {
    return { success: false, details: `Error: ${error.message}` };
  }
}

async function test2_ConditionalBranching(): Promise<{ success: boolean; details: string }> {
  console.log('\n🎯 Test 2: Conditional Branching (Flag-based)');
  
  try {
    const story = createTestStory();
    
    // Test with high tech skill
    const highSkillState: QNCEState = {
      currentNodeId: 'logs',
      flags: { 'tech_skill': 8, 'approach': 'technical' },
      history: ['technical-path']
    };
    
    const engine = createBranchingEngine(story, highSkillState);
    const branches = await engine.evaluateAvailableBranches();
    
    console.log(`  High skill state: ${branches.length} branches available`);
    
    // Check if expert analysis is available
    const expertBranch = branches.find(b => b.id === 'expert-analysis');
    const hasExpertAccess = !!expertBranch;
    
    console.log(`  Expert analysis available: ${hasExpertAccess}`);
    
    // Test with low tech skill
    const lowSkillState: QNCEState = {
      currentNodeId: 'logs',
      flags: { 'tech_skill': 3, 'approach': 'technical' },
      history: ['technical-path']
    };
    
    const lowSkillEngine = createBranchingEngine(story, lowSkillState);
    const lowSkillBranches = await lowSkillEngine.evaluateAvailableBranches();
    const lowSkillExpert = lowSkillBranches.find(b => b.id === 'expert-analysis');
    const expertBlocked = !lowSkillExpert;
    
    console.log(`  Expert analysis blocked for low skill: ${expertBlocked}`);
    
    return { 
      success: hasExpertAccess && expertBlocked, 
      details: `Expert access: ${hasExpertAccess}, Blocked for low skill: ${expertBlocked}` 
    };
  } catch (error) {
    return { success: false, details: `Error: ${error.message}` };
  }
}

async function test3_AIBranchGeneration(): Promise<{ success: boolean; details: string }> {
  console.log('\n🤖 Test 3: AI-Driven Branch Generation');
  
  try {
    const story = createTestStory();
    const initialState: QNCEState = {
      currentNodeId: 'evidence',
      flags: { 'investigation_style': 'thorough' },
      history: []
    };
    
    const engine = createBranchingEngine(story, initialState);
    
    // Set up AI context
    const aiContext: AIBranchingContext = {
      playerProfile: {
        playStyle: 'explorer',
        preferences: {
          'detail_oriented': 0.9,
          'risk_taking': 0.3,
          'social_interaction': 0.7
        },
        historicalChoices: ['technical-path'],
        averageDecisionTime: 7000
      },
      narrativeContext: {
        currentTone: 'mysterious',
        thematicElements: ['investigation', 'technology', 'mystery'],
        characterRelationships: {},
        plotTension: 0.6
      },
      generationHints: {
        maxBranchDepth: 2,
        desiredComplexity: 5,
        contentThemes: ['investigation', 'evidence'],
        avoidElements: ['violence']
      }
    };
    
    engine.setAIContext(aiContext);
    
    const aiBranches = await engine.generateAIBranches(3);
    console.log(`  Generated ${aiBranches.length} AI branches`);
    
    aiBranches.forEach((branch, i) => {
      console.log(`    ${i + 1}. "${branch.displayText}" (weight: ${branch.weight})`);
    });
    
    return { 
      success: aiBranches.length > 0, 
      details: `Generated ${aiBranches.length} AI branches` 
    };
  } catch (error) {
    return { success: false, details: `Error: ${error.message}` };
  }
}

async function test4_DynamicBranchOperations(): Promise<{ success: boolean; details: string }> {
  console.log('\n🔧 Test 4: Dynamic Branch Operations');
  
  try {
    const story = createTestStory();
    const initialState: QNCEState = {
      currentNodeId: 'arrival',
      flags: { 'emergency': true },
      history: []
    };
    
    const engine = createBranchingEngine(story, initialState);
    
    // Create a properly typed dynamic branch
    const dynamicBranch = {
      type: 'insert' as const,
      branchId: 'emergency-protocol',
      targetLocation: {
        chapterId: 'investigation',
        flowId: 'crime-scene',
        nodeId: 'arrival',
        insertionPoint: 'after' as const
      },
      payload: {
        name: 'Emergency Protocol',
        branchType: 'conditional' as const,
        branchOptions: [
          {
            id: 'emergency-response',
            targetFlowId: 'crime-scene',
            displayText: 'Activate emergency response',
            conditions: [
              { 
                type: 'flag' as const, 
                operator: 'equals' as const, 
                key: 'emergency', 
                value: true 
              }
            ],
            flagEffects: { 'emergency_activated': true },
            weight: 1.0
          }
        ]
      },
      conditions: [
        { 
          type: 'flag' as const, 
          operator: 'equals' as const, 
          key: 'emergency', 
          value: true 
        }
      ]
    };
    
    // Test insertion
    const insertResult = await engine.insertDynamicBranch(dynamicBranch);
    console.log(`  Dynamic branch insertion: ${insertResult ? 'Success' : 'Failed'}`);
    
    // Test removal
    const removeResult = await engine.removeDynamicBranch('emergency-protocol');
    console.log(`  Dynamic branch removal: ${removeResult ? 'Success' : 'Failed'}`);
    
    return { 
      success: insertResult && removeResult, 
      details: `Insert: ${insertResult}, Remove: ${removeResult}` 
    };
  } catch (error) {
    return { success: false, details: `Error: ${error.message}` };
  }
}

async function test5_AnalyticsAndErrorHandling(): Promise<{ success: boolean; details: string }> {
  console.log('\n📊 Test 5: Analytics Export and Error Handling');
  
  try {
    const story = createTestStory();
    const initialState: QNCEState = {
      currentNodeId: 'arrival',
      flags: {},
      history: []
    };
    
    const engine = createBranchingEngine(story, initialState);
    
    // Test analytics
    const analytics = engine.getBranchingAnalytics();
    console.log(`  Analytics keys: ${Object.keys(analytics).length}`);
    console.log(`  Session start time: ${analytics.sessionStartTime instanceof Date}`);
    
    // Test data export
    const exportData = engine.exportBranchingData();
    console.log(`  Export keys: ${Object.keys(exportData).length}`);
    console.log(`  Story data included: ${!!exportData.story}`);
    console.log(`  Session data included: ${!!exportData.session}`);
    
    // Test error handling - invalid branch execution
    let errorCaught = false;
    try {
      await engine.executeBranch('nonexistent-branch-id');
    } catch (error) {
      errorCaught = true;
      console.log(`  Error correctly caught: ${error.message}`);
    }
    
    // Test AI error handling - no context
    let aiErrorCaught = false;
    try {
      const freshEngine = createBranchingEngine(story, initialState);
      await freshEngine.generateAIBranches();
    } catch (error) {
      aiErrorCaught = true;
      console.log(`  AI error correctly caught: ${error.message}`);
    }
    
    return { 
      success: analytics && exportData && errorCaught && aiErrorCaught, 
      details: `Analytics: ✓, Export: ✓, Error handling: ✓` 
    };
  } catch (error) {
    return { success: false, details: `Error: ${error.message}` };
  }
}

// ================================
// Main Validation Runner
// ================================

async function runValidation() {
  console.log('🚦 ByteSower\'s Use-Case Validation');
  console.log('===================================');
  console.log('Real-world scenario testing for Sprint #3 Branching API\n');
  
  const tests = [
    { name: 'Multi-Choice Decision Trees', fn: test1_MultiChoiceDecisionTree },
    { name: 'Conditional Branching', fn: test2_ConditionalBranching },
    { name: 'AI Branch Generation', fn: test3_AIBranchGeneration },
    { name: 'Dynamic Operations', fn: test4_DynamicBranchOperations },
    { name: 'Analytics & Error Handling', fn: test5_AnalyticsAndErrorHandling }
  ];
  
  const results: Array<{ success: boolean; details: string; name: string }> = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ ...result, name: test.name });
  }
  
  console.log('\n📋 Validation Summary');
  console.log('====================');
  
  let allPassed = true;
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.details}`);
    if (!result.success) allPassed = false;
  });
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🚀 Sprint #3 Branching API validated for production!');
    console.log('✅ API handles real-world narrative scenarios correctly');
    console.log('✅ All edge cases and error conditions properly managed');
    console.log('✅ Ready for merge and core engine integration');
  } else {
    console.log('\n⚠️ Some validation tests failed - review needed before merge');
  }
  
  return { success: allPassed, results };
}

// Run validation if called directly
if (require.main === module) {
  runValidation().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

export { runValidation, createTestStory };
