// QNCE Branching System Tests
// Sprint #3 - Advanced Narrative & AI Integration

import { QNCEBranchingEngine, createBranchingEngine } from '../src/narrative/branching/engine-simple';
import { 
  QNCEStory, 
  Chapter, 
  NarrativeFlow, 
  BranchPoint,
  AIBranchingContext 
} from '../src/narrative/branching/models';
import { QNCEState } from '../src/engine/core';

// Test data
const createTestStory = (): QNCEStory => ({
  id: 'test-story',
  title: 'Test Branching Story',
  version: '1.0.0',
  metadata: {
    author: 'Test Author',
    description: 'A test story for branching',
    tags: ['test'],
    createDate: new Date(),
    lastModified: new Date(),
    estimatedPlaytime: 10
  },
  chapters: [
    {
      id: 'chapter-1',
      title: 'Test Chapter',
      description: 'A test chapter',
      flows: [
        {
          id: 'flow-main',
          name: 'Main Flow',
          description: 'Main story flow',
          nodes: [
            {
              id: 'node-1',
              text: 'You find yourself at a crossroads.',
              choices: []
            },
            {
              id: 'node-2', 
              text: 'You chose the left path.',
              choices: []
            },
            {
              id: 'node-3',
              text: 'You chose the right path.',
              choices: []
            }
          ],
          entryPoints: [
            { id: 'start', nodeId: 'node-1', priority: 1 }
          ],
          exitPoints: [
            { id: 'left-exit', nodeId: 'node-2' },
            { id: 'right-exit', nodeId: 'node-3' }
          ],
          flowType: 'branching',
          metadata: {
            complexity: 3,
            avgCompletionTime: 5000,
            playerChoiceCount: 1,
            aiGeneratedContent: false
          }
        },
        {
          id: 'flow-alternate',
          name: 'Alternate Flow',
          description: 'Alternate story path',
          nodes: [
            {
              id: 'alt-node-1',
              text: 'You discover a hidden passage.',
              choices: []
            }
          ],
          entryPoints: [
            { id: 'alt-start', nodeId: 'alt-node-1', priority: 1 }
          ],
          exitPoints: [],
          flowType: 'linear',
          metadata: {
            complexity: 1,
            avgCompletionTime: 2000,
            playerChoiceCount: 0,
            aiGeneratedContent: false
          }
        }
      ],
      branches: [
        {
          id: 'crossroads-branch',
          name: 'Crossroads Decision',
          sourceFlowId: 'flow-main',
          sourceNodeId: 'node-1',
          branchType: 'choice-driven',
          branchOptions: [
            {
              id: 'left-option',
              targetFlowId: 'flow-main',
              targetNodeId: 'node-2',
              displayText: 'Take the left path',
              weight: 1.0
            },
            {
              id: 'right-option',
              targetFlowId: 'flow-main',
              targetNodeId: 'node-3',
              displayText: 'Take the right path',
              weight: 1.0
            },
            {
              id: 'hidden-option',
              targetFlowId: 'flow-alternate',
              targetNodeId: 'alt-node-1',
              displayText: 'Search for hidden passages',
              conditions: [
                { type: 'flag', operator: 'equals', key: 'exploration_skill', value: 'high' }
              ],
              weight: 0.5
            }
          ],
          metadata: {
            usageCount: 0,
            avgTraversalTime: 0,
            playerPreference: 0,
            lastUsed: new Date()
          }
        }
      ],
      prerequisites: {
        requiredFlags: {},
        requiredChoices: []
      },
      metadata: {
        difficulty: 'easy',
        themes: ['exploration'],
        estimatedDuration: 5,
        branchComplexity: 3
      }
    }
  ],
  branchingConfig: {
    maxActiveBranches: 10,
    branchCacheSize: 50,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: true
  }
});

const createTestState = (): QNCEState => ({
  currentNodeId: 'node-1',
  flags: {},
  history: ['node-1']
});

describe('QNCE Branching System', () => {
  let engine: QNCEBranchingEngine;
  let story: QNCEStory;
  let initialState: QNCEState;

  beforeEach(() => {
    story = createTestStory();
    initialState = createTestState();
    engine = createBranchingEngine(story, initialState);
  });

  describe('Engine Creation & Initialization', () => {
    test('should create branching engine with valid story', () => {
      expect(engine).toBeInstanceOf(QNCEBranchingEngine);
    });

    test('should initialize with correct context', () => {
      const analytics = engine.getBranchingAnalytics();
      expect(analytics.currentChapter).toBe('chapter-1');
      expect(analytics.currentFlow).toBe('flow-main');
      expect(analytics.historyLength).toBe(0);
    });
  });

  describe('Branch Evaluation', () => {
    test('should find available branches for current node', async () => {
      const branches = await engine.evaluateAvailableBranches();
      
      expect(branches).toHaveLength(2); // left and right options (hidden requires flag)
      expect(branches.find(b => b.id === 'left-option')).toBeDefined();
      expect(branches.find(b => b.id === 'right-option')).toBeDefined();
      expect(branches.find(b => b.id === 'hidden-option')).toBeUndefined();
    });

    test('should include conditional branches when conditions are met', async () => {
      // Set flag to enable hidden option
      engine['context'].activeState.flags.exploration_skill = 'high';
      
      const branches = await engine.evaluateAvailableBranches();
      
      expect(branches).toHaveLength(3);
      expect(branches.find(b => b.id === 'hidden-option')).toBeDefined();
    });

    test('should exclude branches when conditions are not met', async () => {
      // Set flag to wrong value
      engine['context'].activeState.flags.exploration_skill = 'low';
      
      const branches = await engine.evaluateAvailableBranches();
      
      expect(branches).toHaveLength(2);
      expect(branches.find(b => b.id === 'hidden-option')).toBeUndefined();
    });
  });

  describe('Branch Execution', () => {
    test('should execute valid branch transition', async () => {
      const success = await engine.executeBranch('left-option');
      
      expect(success).toBe(true);
      
      const analytics = engine.getBranchingAnalytics();
      expect(analytics.historyLength).toBe(1);
    });

    test('should throw error for invalid branch option', async () => {
      await expect(engine.executeBranch('invalid-option')).rejects.toThrow();
    });

    test('should apply flag effects during branch execution', async () => {
      // Add flag effects to a branch option
      const branch = story.chapters[0].branches[0];
      branch.branchOptions[0].flagEffects = { 'path_taken': 'left' };

      const success = await engine.executeBranch('left-option');
      
      expect(success).toBe(true);
      expect(engine['context'].activeState.flags.path_taken).toBe('left');
    });

    test('should transition to correct flow and node', async () => {
      await engine.executeBranch('left-option');
      
      const currentState = engine['context'].activeState;
      expect(currentState.currentNodeId).toBe('node-2');
      expect(currentState.history).toContain('node-2');
    });
  });

  describe('Dynamic Branch Operations', () => {
    test('should insert dynamic branch at runtime', async () => {
      const operation = {
        type: 'insert' as const,
        branchId: 'dynamic-test',
        targetLocation: {
          chapterId: 'chapter-1',
          flowId: 'flow-main',
          nodeId: 'node-1',
          insertionPoint: 'after' as const
        },
        payload: {
          name: 'Dynamic Test Branch',
          branchType: 'conditional' as const,
          branchOptions: [
            {
              id: 'dynamic-option',
              targetFlowId: 'flow-alternate',
              displayText: 'Take the dynamic path',
              weight: 1.0
            }
          ]
        }
      };

      const success = await engine.insertDynamicBranch(operation);
      expect(success).toBe(true);

      // Verify branch was added
      const chapter = story.chapters[0];
      const dynamicBranch = chapter.branches.find(b => b.id === 'dynamic-test');
      expect(dynamicBranch).toBeDefined();
      expect(dynamicBranch?.branchOptions).toHaveLength(1);
    });

    test('should remove dynamic branch', async () => {
      // First insert a branch
      const operation = {
        type: 'insert' as const,
        branchId: 'temp-branch',
        targetLocation: {
          chapterId: 'chapter-1',
          flowId: 'flow-main',
          nodeId: 'node-1',
          insertionPoint: 'after' as const
        }
      };

      await engine.insertDynamicBranch(operation);
      
      // Then remove it
      const success = await engine.removeDynamicBranch('temp-branch');
      expect(success).toBe(true);

      // Verify branch was removed
      const chapter = story.chapters[0];
      const removedBranch = chapter.branches.find(b => b.id === 'temp-branch');
      expect(removedBranch).toBeUndefined();
    });

    test('should fail to remove non-existent branch', async () => {
      const success = await engine.removeDynamicBranch('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('AI Integration', () => {
    test('should set AI context', () => {
      const aiContext: AIBranchingContext = {
        playerProfile: {
          playStyle: 'explorer',
          preferences: { exploration: 0.9 },
          historicalChoices: [],
          averageDecisionTime: 5000
        },
        narrativeContext: {
          currentTone: 'mysterious',
          thematicElements: ['discovery'],
          characterRelationships: {},
          plotTension: 0.3
        },
        generationHints: {
          maxBranchDepth: 3,
          desiredComplexity: 5,
          contentThemes: ['exploration'],
          avoidElements: ['combat']
        }
      };

      engine.setAIContext(aiContext);
      expect(engine['aiContext']).toBe(aiContext);
    });

    test('should generate AI branches based on player profile', async () => {
      const aiContext: AIBranchingContext = {
        playerProfile: {
          playStyle: 'explorer',
          preferences: {},
          historicalChoices: [],
          averageDecisionTime: 5000
        },
        narrativeContext: {
          currentTone: 'mysterious',
          thematicElements: [],
          characterRelationships: {},
          plotTension: 0.5
        },
        generationHints: {
          maxBranchDepth: 3,
          desiredComplexity: 5,
          contentThemes: [],
          avoidElements: []
        }
      };

      engine.setAIContext(aiContext);
      const aiBranches = await engine.generateAIBranches(2);

      expect(aiBranches).toHaveLength(1); // Explorer gets exploration option
      expect(aiBranches[0].displayText).toContain('Investigate');
    });

    test('should throw error when generating AI branches without context', async () => {
      await expect(engine.generateAIBranches()).rejects.toThrow();
    });
  });

  describe('Analytics & Monitoring', () => {
    test('should track branch execution analytics', async () => {
      await engine.executeBranch('left-option');
      
      const analytics = engine.getBranchingAnalytics();
      expect(analytics.historyLength).toBe(1);
    });

    test('should export branching data', () => {
      const exportData = engine.exportBranchingData();
      
      expect(exportData.story.id).toBe('test-story');
      expect(exportData.session.currentState).toBeDefined();
      expect(exportData.session.analytics).toBeDefined();
    });

    test('should update popular branches tracking', async () => {
      await engine.executeBranch('left-option');
      
      const analytics = engine.getBranchingAnalytics();
      // Note: This test checks internal state, might need adjustment based on implementation
    });
  });

  describe('Condition Evaluation', () => {
    test('should evaluate equals condition correctly', async () => {
      engine['context'].activeState.flags.test_flag = 'test_value';
      
      const condition = {
        type: 'flag' as const,
        operator: 'equals' as const,
        key: 'test_flag',
        value: 'test_value'
      };

      const result = await engine['evaluateCondition'](condition);
      expect(result).toBe(true);
    });

    test('should evaluate not_equals condition correctly', async () => {
      engine['context'].activeState.flags.test_flag = 'different_value';
      
      const condition = {
        type: 'flag' as const,
        operator: 'not_equals' as const,
        key: 'test_flag',
        value: 'test_value'
      };

      const result = await engine['evaluateCondition'](condition);
      expect(result).toBe(true);
    });

    test('should evaluate greater condition correctly', async () => {
      engine['context'].activeState.flags.level = 5;
      
      const condition = {
        type: 'flag' as const,
        operator: 'greater' as const,
        key: 'level',
        value: 3
      };

      const result = await engine['evaluateCondition'](condition);
      expect(result).toBe(true);
    });

    test('should evaluate custom evaluator', async () => {
      const condition = {
        type: 'custom' as const,
        operator: 'equals' as const,
        key: 'unused',
        value: 'unused',
        evaluator: (state: QNCEState) => state.currentNodeId === 'node-1'
      };

      const result = await engine['evaluateCondition'](condition);
      expect(result).toBe(true);
    });
  });
});

// Performance benchmarks
describe('Branching Performance', () => {
  test('should evaluate branches within performance target', async () => {
    const story = createTestStory();
    const state = createTestState();
    const engine = createBranchingEngine(story, state);

    const startTime = performance.now();
    await engine.evaluateAvailableBranches();
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(5); // < 5ms target
  });

  test('should execute branches within performance target', async () => {
    const story = createTestStory();
    const state = createTestState();
    const engine = createBranchingEngine(story, state);

    const startTime = performance.now();
    await engine.executeBranch('left-option');
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(10); // < 10ms target
  });
});
