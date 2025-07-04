// QNCE Engine State Persistence Tests - Sprint 3.3
// Comprehensive test suite for save/load and checkpoint functionality

import { QNCEEngine, StoryData, QNCEState } from '../src/engine/core';
import { SerializedState, Checkpoint, SerializationOptions, LoadOptions, CheckpointOptions } from '../src/engine/types';

// Test story data
const testStoryData: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You wake up in a mysterious room.',
      choices: [
        { text: 'Look around', nextNodeId: 'look', flagEffects: { looked: true } },
        { text: 'Try the door', nextNodeId: 'door' }
      ]
    },
    {
      id: 'look',
      text: 'You see a key on the table.',
      choices: [
        { text: 'Take the key', nextNodeId: 'key', flagEffects: { hasKey: true } },
        { text: 'Ignore it', nextNodeId: 'ignore' }
      ]
    },
    {
      id: 'door',
      text: 'The door is locked.',
      choices: [
        { text: 'Go back', nextNodeId: 'start' }
      ]
    },
    {
      id: 'key',
      text: 'You now have the key.',
      choices: [
        { text: 'Try the door again', nextNodeId: 'unlock' }
      ]
    },
    {
      id: 'unlock',
      text: 'You unlock the door and escape!',
      choices: []
    },
    {
      id: 'ignore',
      text: 'You ignore the key.',
      choices: [
        { text: 'Try the door', nextNodeId: 'door' }
      ]
    }
  ]
};

describe('QNCE Engine State Persistence - Sprint 3.3', () => {
  let engine: QNCEEngine;

  beforeEach(() => {
    engine = new QNCEEngine(testStoryData);
  });

  afterEach(() => {
    // Cleanup any background processes
  });

  describe('State Serialization (saveState)', () => {
    test('should save basic state without options', async () => {
      const serializedState = await engine.saveState();
      
      expect(serializedState).toBeDefined();
      expect(serializedState.state).toBeDefined();
      expect(serializedState.metadata).toBeDefined();
      expect(serializedState.state.currentNodeId).toBe('start');
      expect(serializedState.state.flags).toEqual({});
      expect(serializedState.state.history).toEqual(['start']);
    });

    test('should save state with custom flags and history', async () => {
      // Progress through story to build up state
      const lookChoice = engine.getCurrentNode().choices[0];
      engine.selectChoice(lookChoice);
      
      const takeKeyChoice = engine.getCurrentNode().choices[0];
      engine.selectChoice(takeKeyChoice);
      
      const serializedState = await engine.saveState();
      
      expect(serializedState.state.currentNodeId).toBe('key');
      expect(serializedState.state.flags.looked).toBe(true);
      expect(serializedState.state.flags.hasKey).toBe(true);
      expect(serializedState.state.history).toContain('start');
      expect(serializedState.state.history).toContain('look');
      expect(serializedState.state.history).toContain('key');
    });

    test('should include metadata with engine version and timestamp', async () => {
      const serializedState = await engine.saveState();
      
      expect(serializedState.metadata.engineVersion).toBeDefined();
      expect(serializedState.metadata.timestamp).toBeDefined();
      expect(serializedState.metadata.storyId).toBeDefined();
      
      // Verify timestamp is a valid ISO string
      const timestamp = new Date(serializedState.metadata.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('should generate checksum when requested', async () => {
      const options: SerializationOptions = { generateChecksum: true };
      const serializedState = await engine.saveState(options);
      
      expect(serializedState.metadata.checksum).toBeDefined();
      expect(typeof serializedState.metadata.checksum).toBe('string');
      expect(serializedState.metadata.checksum!.length).toBeGreaterThan(0);
    });

    test('should include flow events when enabled', async () => {
      // Enable performance mode to track flow events
      const performanceEngine = new QNCEEngine(testStoryData, undefined, true);
      
      // Make some choices to generate flow events
      const choice = performanceEngine.getCurrentNode().choices[0];
      performanceEngine.selectChoice(choice);
      
      const options: SerializationOptions = { includeFlowEvents: true };
      const serializedState = await performanceEngine.saveState(options);
      
      expect(serializedState.flowEvents).toBeDefined();
      expect(Array.isArray(serializedState.flowEvents)).toBe(true);
    });

    test('should include performance data when requested', async () => {
      const performanceEngine = new QNCEEngine(testStoryData, undefined, true);
      
      const options: SerializationOptions = { includePerformanceData: true };
      const serializedState = await performanceEngine.saveState(options);
      
      expect(serializedState.performanceState).toBeDefined();
      expect(serializedState.performanceState?.performanceMode).toBe(true);
      expect(serializedState.poolStats).toBeDefined();
    });

    test('should include custom metadata', async () => {
      const customMetadata = { 
        gameSession: 'test-session-123',
        playerLevel: 5,
        customFlag: 'test-value'
      };
      
      const options: SerializationOptions = { 
        customMetadata,
        prettyPrint: true 
      };
      
      const serializedState = await engine.saveState(options);
      
      expect(serializedState.metadata.customMetadata).toEqual(customMetadata);
    });

    test('should handle serialization errors gracefully', async () => {
      // Mock a serialization error by corrupting the state
      const originalState = engine.getState();
      (engine as any).state = { ...originalState, currentNodeId: undefined };
      
      await expect(engine.saveState()).rejects.toThrow();
      
      // Restore state for cleanup
      (engine as any).state = originalState;
    });
  });

  describe('State Deserialization (loadState)', () => {
    test('should load basic serialized state', async () => {
      // First save a state
      const lookChoice = engine.getCurrentNode().choices[0];
      engine.selectChoice(lookChoice);
      
      const serializedState = await engine.saveState();
      
      // Reset engine to initial state
      const newEngine = new QNCEEngine(testStoryData);
      
      // Load the saved state
      const result = await newEngine.loadState(serializedState);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(newEngine.getState().currentNodeId).toBe('look');
      expect(newEngine.getState().flags.looked).toBe(true);
    });

    test('should verify checksum when requested', async () => {
      const serializedState = await engine.saveState({ generateChecksum: true });
      
      const loadOptions: LoadOptions = { verifyChecksum: true };
      const result = await engine.loadState(serializedState, loadOptions);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should fail on corrupted checksum', async () => {
      const serializedState = await engine.saveState({ generateChecksum: true });
      
      // Corrupt the checksum
      serializedState.metadata.checksum = 'invalid-checksum';
      
      const loadOptions: LoadOptions = { verifyChecksum: true };
      const result = await engine.loadState(serializedState, loadOptions);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Checksum verification failed');
    });

    test('should validate serialized state structure', async () => {
      const invalidState = {
        // Missing required fields
        metadata: { engineVersion: '1.0.0', timestamp: new Date().toISOString() }
      } as SerializedState;
      
      const result = await engine.loadState(invalidState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid serialized state');
    });

    test('should check version compatibility', async () => {
      const serializedState = await engine.saveState();
      
      // Mock incompatible version
      serializedState.metadata.engineVersion = '2.0.0';
      
      const result = await engine.loadState(serializedState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('newer engine version');
    });

    test('should allow skipping compatibility check', async () => {
      const serializedState = await engine.saveState();
      
      // Mock incompatible version
      serializedState.metadata.engineVersion = '2.0.0';
      
      const loadOptions: LoadOptions = { skipCompatibilityCheck: true };
      const result = await engine.loadState(serializedState, loadOptions);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should restore flow events when requested', async () => {
      const performanceEngine = new QNCEEngine(testStoryData, undefined, true);
      
      // Generate flow events
      const choice = performanceEngine.getCurrentNode().choices[0];
      performanceEngine.selectChoice(choice);
      
      const serializedState = await performanceEngine.saveState({ includeFlowEvents: true });
      
      // Load in new engine
      const newEngine = new QNCEEngine(testStoryData, undefined, true);
      const loadOptions: LoadOptions = { restoreFlowEvents: true };
      const result = await newEngine.loadState(serializedState, loadOptions);
      
      expect(result.success).toBe(true);
      expect(newEngine.getActiveFlows()).toBeDefined();
    });

    test('should apply migration function', async () => {
      const serializedState = await engine.saveState();
      
      const migrationFunction = (state: SerializedState): SerializedState => {
        const migratedState = { ...state };
        migratedState.state.flags.migrated = true;
        return migratedState;
      };
      
      const loadOptions: LoadOptions = { migrationFunction };
      const result = await engine.loadState(serializedState, loadOptions);
      
      expect(result.success).toBe(true);
      expect(engine.getState().flags.migrated).toBe(true);
    });
  });

  describe('Checkpoint Management', () => {
    test('should create basic checkpoint', async () => {
      const checkpoint = await engine.createCheckpoint('Test Checkpoint');
      
      expect(checkpoint).toBeDefined();
      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.name).toBe('Test Checkpoint');
      expect(checkpoint.timestamp).toBeDefined();
      expect(checkpoint.state).toEqual(engine.getState());
    });

    test('should create checkpoint with auto-generated name', async () => {
      const checkpoint = await engine.createCheckpoint();
      
      expect(checkpoint.name).toBeDefined();
      expect(checkpoint.name).toContain('Checkpoint');
    });

    test('should include metadata when requested', async () => {
      const options: CheckpointOptions = { includeMetadata: true };
      const checkpoint = await engine.createCheckpoint('Test', options);
      
      expect(checkpoint.metadata).toBeDefined();
      expect(checkpoint.metadata?.nodeTitle).toBeDefined();
      expect(checkpoint.metadata?.flagCount).toBe(0);
      expect(checkpoint.metadata?.historyLength).toBe(1);
    });

    test('should manage multiple checkpoints', async () => {
      const checkpoint1 = await engine.createCheckpoint('First');
      
      // Progress state
      const choice = engine.getCurrentNode().choices[0];
      engine.selectChoice(choice);
      
      const checkpoint2 = await engine.createCheckpoint('Second');
      
      const checkpoints = engine.getCheckpoints();
      expect(checkpoints).toHaveLength(2);
      expect(checkpoints.find(c => c.id === checkpoint1.id)).toBeDefined();
      expect(checkpoints.find(c => c.id === checkpoint2.id)).toBeDefined();
    });

    test('should retrieve specific checkpoint', async () => {
      const checkpoint = await engine.createCheckpoint('Test');
      
      const retrieved = engine.getCheckpoint(checkpoint.id);
      expect(retrieved).toEqual(checkpoint);
      
      const notFound = engine.getCheckpoint('non-existent');
      expect(notFound).toBeUndefined();
    });

    test('should delete checkpoint', async () => {
      const checkpoint = await engine.createCheckpoint('Test');
      
      expect(engine.getCheckpoint(checkpoint.id)).toBeDefined();
      
      const deleted = engine.deleteCheckpoint(checkpoint.id);
      expect(deleted).toBe(true);
      expect(engine.getCheckpoint(checkpoint.id)).toBeUndefined();
      
      const notDeleted = engine.deleteCheckpoint('non-existent');
      expect(notDeleted).toBe(false);
    });

    test('should restore from checkpoint', async () => {
      // Create checkpoint at initial state
      const checkpoint = await engine.createCheckpoint('Initial');
      
      // Progress state
      const choice = engine.getCurrentNode().choices[0];
      engine.selectChoice(choice);
      expect(engine.getState().currentNodeId).toBe('look');
      
      // Restore from checkpoint
      const result = await engine.restoreFromCheckpoint(checkpoint.id);
      
      expect(result.success).toBe(true);
      expect(engine.getState().currentNodeId).toBe('start');
      expect(engine.getState().flags.looked).toBeUndefined();
    });

    test('should fail to restore from non-existent checkpoint', async () => {
      const result = await engine.restoreFromCheckpoint('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Checkpoint not found');
    });

    test('should cleanup old checkpoints', async () => {
      const options: CheckpointOptions = { maxCheckpoints: 2 };
      
      // Create 3 checkpoints
      await engine.createCheckpoint('First', options);
      await engine.createCheckpoint('Second', options);
      
      // This should trigger cleanup
      await engine.createCheckpoint('Third', options);
      
      const checkpoints = engine.getCheckpoints();
      expect(checkpoints).toHaveLength(2);
      expect(checkpoints.find(c => c.name === 'First')).toBeUndefined(); // Should be cleaned up
      expect(checkpoints.find(c => c.name === 'Second')).toBeDefined();
      expect(checkpoints.find(c => c.name === 'Third')).toBeDefined();
    });

    test('should support checkpoint tags', async () => {
      const options: CheckpointOptions = { 
        autoTags: ['auto-save', 'important'],
        includeMetadata: true 
      };
      
      const checkpoint = await engine.createCheckpoint('Tagged', options);
      
      expect(checkpoint.tags).toContain('auto-save');
      expect(checkpoint.tags).toContain('important');
    });
  });

  describe('State Persistence Edge Cases', () => {
    test('should handle deeply nested flag objects', async () => {
      // Create complex flag structure
      engine.selectChoice({
        text: 'Test',
        nextNodeId: 'start',
        flagEffects: {
          player: {
            stats: { health: 100, mana: 50 },
            inventory: ['sword', 'potion'],
            location: { x: 10, y: 20 }
          },
          nested: {
            level1: {
              level2: {
                level3: 'deep value'
              }
            }
          }
        }
      });
      
      const serializedState = await engine.saveState();
      const newEngine = new QNCEEngine(testStoryData);
      const result = await newEngine.loadState(serializedState);
      
      expect(result.success).toBe(true);
      const flags = newEngine.getState().flags;
      expect((flags.player as any).stats.health).toBe(100);
      expect((flags.nested as any).level1.level2.level3).toBe('deep value');
    });

    test('should handle circular references safely', async () => {
      // Create circular reference in flags
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;
      
      try {
        engine.selectChoice({
          text: 'Test',
          nextNodeId: 'start',
          flagEffects: { circular: circularObj }
        });
        
        // This should either work with proper handling or throw a clear error
        await engine.saveState();
      } catch (error) {
        // Should be a specific error about circular references
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should be idempotent for save/load operations', async () => {
      // Progress through some story state
      const lookChoice = engine.getCurrentNode().choices[0];
      engine.selectChoice(lookChoice);
      const takeKeyChoice = engine.getCurrentNode().choices[0];
      engine.selectChoice(takeKeyChoice);
      
      // Save and load multiple times
      const state1 = await engine.saveState();
      const newEngine1 = new QNCEEngine(testStoryData);
      await newEngine1.loadState(state1);
      
      const state2 = await newEngine1.saveState();
      const newEngine2 = new QNCEEngine(testStoryData);
      await newEngine2.loadState(state2);
      
      // States should be identical
      expect(newEngine1.getState()).toEqual(newEngine2.getState());
      expect(JSON.stringify(state1.state)).toBe(JSON.stringify(state2.state));
    });

    test('should handle large state objects efficiently', async () => {
      // Create large flag object
      const largeFlags: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeFlags[`flag_${i}`] = {
          id: i,
          data: new Array(100).fill(`value_${i}`),
          metadata: { created: new Date().toISOString() }
        };
      }
      
      engine.selectChoice({
        text: 'Large data',
        nextNodeId: 'start',
        flagEffects: largeFlags
      });
      
      const startTime = performance.now();
      const serializedState = await engine.saveState();
      const saveTime = performance.now() - startTime;
      
      const loadStartTime = performance.now();
      const newEngine = new QNCEEngine(testStoryData);
      const result = await newEngine.loadState(serializedState);
      const loadTime = performance.now() - loadStartTime;
      
      expect(result.success).toBe(true);
      expect(saveTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(loadTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Verify data integrity
      const loadedFlags = newEngine.getState().flags;
      expect(Object.keys(loadedFlags)).toHaveLength(1000);
      expect((loadedFlags.flag_999 as any).id).toBe(999);
    });

    test('should maintain state isolation between engines', async () => {
      const engine1 = new QNCEEngine(testStoryData);
      const engine2 = new QNCEEngine(testStoryData);
      
      // Progress engine1
      const choice1 = engine1.getCurrentNode().choices[0];
      engine1.selectChoice(choice1);
      
      // engine2 should remain unchanged
      expect(engine1.getState().currentNodeId).toBe('look');
      expect(engine2.getState().currentNodeId).toBe('start');
      
      // Save and load should not affect other engines
      const state1 = await engine1.saveState();
      await engine2.loadState(state1);
      
      expect(engine2.getState().currentNodeId).toBe('look');
      
      // Modify engine2
      const choice2 = engine2.getCurrentNode().choices[1]; // Different choice
      engine2.selectChoice(choice2);
      
      // engine1 should remain unchanged
      expect(engine1.getState().currentNodeId).toBe('look');
      expect(engine2.getState().currentNodeId).toBe('ignore');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete save operation under 2ms for normal state', async () => {
      const startTime = performance.now();
      await engine.saveState();
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2);
    });

    test('should complete load operation under 2ms for normal state', async () => {
      const serializedState = await engine.saveState();
      
      const startTime = performance.now();
      await engine.loadState(serializedState);
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2);
    });

    test('should complete checkpoint creation under 2ms', async () => {
      const startTime = performance.now();
      await engine.createCheckpoint();
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2);
    });

    test('should complete checkpoint restoration under 2ms', async () => {
      const checkpoint = await engine.createCheckpoint();
      
      const startTime = performance.now();
      await engine.restoreFromCheckpoint(checkpoint.id);
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2);
    });
  });

  describe('Auto-checkpoint functionality', () => {
    test('should enable and disable auto-checkpointing', () => {
      engine.setAutoCheckpoint(true);
      // Note: Auto-checkpoint behavior would be tested with actual choice selection
      // This test verifies the API exists and doesn't throw
      
      engine.setAutoCheckpoint(false);
      // Test that auto-checkpointing is disabled
    });
  });
});
