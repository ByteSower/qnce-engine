import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createQNCEEngine, type StoryData } from '../src/engine/core';
import { poolManager } from '../src/performance/ObjectPool';

// Test story data for object pooling tests
const testStoryData: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You are at the beginning of a journey.',
      choices: [
        { text: 'Go north', nextNodeId: 'north', flagEffects: { visited_north: true } },
        { text: 'Go south', nextNodeId: 'south', flagEffects: { visited_south: true } }
      ]
    },
    {
      id: 'north',
      text: 'You head north into the mountains.',
      choices: [
        { text: 'Return to start', nextNodeId: 'start' },
        { text: 'Continue deeper', nextNodeId: 'deep_north' }
      ]
    },
    {
      id: 'south',
      text: 'You head south to the coast.',
      choices: [
        { text: 'Return to start', nextNodeId: 'start' },
        { text: 'Explore the beach', nextNodeId: 'beach' }
      ]
    },
    {
      id: 'deep_north',
      text: 'You discover ancient ruins.',
      choices: [
        { text: 'Return to start', nextNodeId: 'start' }
      ]
    },
    {
      id: 'beach',
      text: 'You find a hidden treasure chest.',
      choices: [
        { text: 'Return to start', nextNodeId: 'start' }
      ]
    }
  ]
};

describe('QNCE Object Pooling Integration (S2-T1)', () => {
  beforeEach(() => {
    // Clear pools before each test
    poolManager.clearAllPools();
  });

  afterEach(() => {
    // Clean up after each test
    poolManager.clearAllPools();
  });

  test('should create engine without performance mode', () => {
    const engine = createQNCEEngine(testStoryData);
    expect(engine).toBeDefined();
    expect(engine.getPoolStats()).toBeNull();
  });

  test('should create engine with performance mode enabled', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    expect(engine).toBeDefined();
    expect(engine.getPoolStats()).toBeDefined();
    
    const stats = engine.getPoolStats();
    expect(stats).toHaveProperty('flows');
    expect(stats).toHaveProperty('nodes');
    expect(stats).toHaveProperty('assets');
  });

  test('should use object pooling for flow tracking in performance mode', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    
    // Get initial pool stats
    const initialStats = engine.getPoolStats();
    expect(initialStats?.flows.borrowed).toBe(0);
    expect(initialStats?.flows.inUse).toBe(0);
    
    // Make a choice to trigger flow creation
    const currentNode = engine.getCurrentNode();
    engine.selectChoice(currentNode.choices[0]);
    
    // Check that flows were created and tracked
    const activeFlows = engine.getActiveFlows();
    expect(activeFlows.length).toBe(1);
    expect(activeFlows[0].fromNodeId).toBe('start');
    expect(activeFlows[0].toNodeId).toBe('north');
    
    // Check pool stats show borrowed objects (but returned immediately after use)
    const afterStats = engine.getPoolStats();
    expect(afterStats?.flows.borrowed).toBeGreaterThan(0);
    expect(afterStats?.flows.returned).toBeGreaterThan(0);
    expect(afterStats?.flows.inUse).toBe(0); // Should be 0 since we return immediately
  });

  test('should reuse pooled objects across multiple transitions', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    
    // Make multiple transitions
    for (let i = 0; i < 5; i++) {
      const currentNode = engine.getCurrentNode();
      engine.selectChoice(currentNode.choices[0]);
      
      // Navigate back to start
      const newNode = engine.getCurrentNode();
      if (newNode.choices.some(c => c.nextNodeId === 'start')) {
        const backChoice = newNode.choices.find(c => c.nextNodeId === 'start')!;
        engine.selectChoice(backChoice);
      }
    }
    
    const stats = engine.getPoolStats();
    
    // Should have high reuse rate due to pooling
    expect(stats?.flows.borrowed).toBeGreaterThan(5);
    expect(stats?.flows.hitRate).toBeGreaterThan(0); // Some objects were reused
  });

  test('should clean up pooled objects on reset', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    
    // Create some flow events
    const currentNode = engine.getCurrentNode();
    engine.selectChoice(currentNode.choices[0]);
    engine.selectChoice(engine.getCurrentNode().choices[0]);
    
    // Verify flows exist
    expect(engine.getActiveFlows().length).toBeGreaterThan(0);
    
    // Reset narrative
    engine.resetNarrative();
    
    // Verify flows are cleaned up
    expect(engine.getActiveFlows().length).toBe(0);
    
    // Verify we're back at the start
    expect(engine.getCurrentNode().id).toBe('start');
  });

  test('should limit active flows to prevent memory leaks', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    
    // Create more than 10 flow events to trigger cleanup
    for (let i = 0; i < 15; i++) {
      const currentNode = engine.getCurrentNode();
      engine.selectChoice(currentNode.choices[0]);
      
      // Navigate back to start to create another flow
      const newNode = engine.getCurrentNode();
      const backChoice = newNode.choices.find(c => c.nextNodeId === 'start');
      if (backChoice) {
        engine.selectChoice(backChoice);
      }
    }
    
    const activeFlows = engine.getActiveFlows();
    
    // Should not exceed 10 active flows
    expect(activeFlows.length).toBeLessThanOrEqual(10);
  });

  test('should track performance metrics for pool efficiency', () => {
    const engine = createQNCEEngine(testStoryData, {}, true);
    
    // Make several transitions to generate pool activity
    const transitions = [
      ['start', 'north'],
      ['north', 'deep_north'],
      ['deep_north', 'start'],
      ['start', 'south'],
      ['south', 'beach'],
      ['beach', 'start']
    ];
    
    for (const [from, to] of transitions) {
      const currentNode = engine.getCurrentNode();
      const choice = currentNode.choices.find(c => c.nextNodeId === to);
      if (choice) {
        engine.selectChoice(choice);
      }
    }
    
    const stats = engine.getPoolStats();
    
    // Verify meaningful metrics are collected
    expect(stats?.flows.borrowed).toBeGreaterThan(0);
    expect(stats?.flows.created).toBeGreaterThan(0);
    expect(stats?.flows.returned).toBeGreaterThan(0);
    expect(typeof stats?.flows.hitRate).toBe('number');
  });

  test('should not affect engine behavior when performance mode is disabled', () => {
    const standardEngine = createQNCEEngine(testStoryData, {}, false);
    const performanceEngine = createQNCEEngine(testStoryData, {}, true);
    
    // Make the same sequence of choices in both engines
    const choices = [
      ['start', 'north'],
      ['north', 'deep_north'],
      ['deep_north', 'start']
    ];
    
    for (const [from, to] of choices) {
      // Standard engine
      const standardNode = standardEngine.getCurrentNode();
      const standardChoice = standardNode.choices.find(c => c.nextNodeId === to);
      if (standardChoice) {
        standardEngine.selectChoice(standardChoice);
      }
      
      // Performance engine
      const performanceNode = performanceEngine.getCurrentNode();
      const performanceChoice = performanceNode.choices.find(c => c.nextNodeId === to);
      if (performanceChoice) {
        performanceEngine.selectChoice(performanceChoice);
      }
    }
    
    // Both engines should have identical state
    expect(standardEngine.getState()).toEqual(performanceEngine.getState());
    expect(standardEngine.getCurrentNode().id).toBe(performanceEngine.getCurrentNode().id);
    expect(standardEngine.getFlags()).toEqual(performanceEngine.getFlags());
    expect(standardEngine.getHistory()).toEqual(performanceEngine.getHistory());
  });
});
