// QNCE Engine - Sprint 3.5: Autosave & Undo/Redo Tests
// Comprehensive test coverage for autosave hooks and undo/redo functionality

import { QNCEEngine, createQNCEEngine, StoryData, QNCEState } from '../src/engine/core';
import { 
  AutosaveConfig, 
  UndoRedoConfig, 
  UndoRedoResult, 
  AutosaveResult 
} from '../src/engine/types';

// Test story data for autosave and undo/redo tests
const testStoryData: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You are at the beginning of your journey.',
      choices: [
        { text: 'Go left', nextNodeId: 'left', flagEffects: { went_left: true } },
        { text: 'Go right', nextNodeId: 'right', flagEffects: { went_right: true } }
      ]
    },
    {
      id: 'left',
      text: 'You went left and found a treasure chest.',
      choices: [
        { text: 'Open chest', nextNodeId: 'treasure', flagEffects: { has_treasure: true } },
        { text: 'Go back', nextNodeId: 'start' }
      ]
    },
    {
      id: 'right',
      text: 'You went right and met a wizard.',
      choices: [
        { text: 'Talk to wizard', nextNodeId: 'wizard', flagEffects: { talked_to_wizard: true } },
        { text: 'Go back', nextNodeId: 'start' }
      ]
    },
    {
      id: 'treasure',
      text: 'You found gold!',
      choices: [
        { text: 'Continue', nextNodeId: 'end', flagEffects: { has_gold: true } }
      ]
    },
    {
      id: 'wizard',
      text: 'The wizard gives you a spell.',
      choices: [
        { text: 'Continue', nextNodeId: 'end', flagEffects: { has_spell: true } }
      ]
    },
    {
      id: 'end',
      text: 'Your journey ends here.',
      choices: []
    }
  ]
};

describe('QNCE Engine - Sprint 3.5: Autosave & Undo/Redo', () => {
  let engine: QNCEEngine;

  beforeEach(() => {
    engine = createQNCEEngine(testStoryData);
  });

  describe('Undo/Redo Configuration', () => {
    test('should have default undo/redo configuration', () => {
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);
      expect(engine.getUndoCount()).toBe(0);
      expect(engine.getRedoCount()).toBe(0);
    });

    test('should allow configuration of undo/redo settings', () => {
      const config: Partial<UndoRedoConfig> = {
        enabled: true,
        maxUndoEntries: 10,
        maxRedoEntries: 5,
        trackFlagChanges: false
      };

      engine.configureUndoRedo(config);
      
      // Configuration should be applied (we can't directly test private properties,
      // but we can test the behavior)
      expect(engine.canUndo()).toBe(false); // Still false until we make changes
      expect(engine.canRedo()).toBe(false);
    });
  });

  describe('Undo/Redo Functionality', () => {
    beforeEach(() => {
      // Enable undo/redo for tests
      engine.configureUndoRedo({ enabled: true });
    });

    test('should track state changes for undo', () => {
      const initialState = engine.getState();
      
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Go left
      
      expect(engine.canUndo()).toBe(true);
      expect(engine.getUndoCount()).toBe(1);
      expect(engine.canRedo()).toBe(false);
      
      // Current state should be different
      const currentState = engine.getState();
      expect(currentState.currentNodeId).toBe('left');
      expect(currentState.flags.went_left).toBe(true);
    });

    test('should undo choice selection', () => {
      const initialState = JSON.parse(JSON.stringify(engine.getState())); // Deep copy to prevent mutation
      
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Go left
      
      // Undo the choice
      const undoResult = engine.undo();
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.restoredState).toEqual(initialState);
      expect(undoResult.stackSizes?.undoCount).toBe(0);
      expect(undoResult.stackSizes?.redoCount).toBe(1);
      
      // State should be restored
      expect(engine.getState()).toEqual(initialState);
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(true);
    });

    test('should redo undone operation', () => {
      const initialState = JSON.parse(JSON.stringify(engine.getState())); // Deep copy
      
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Go left
      const afterChoiceState = JSON.parse(JSON.stringify(engine.getState())); // Deep copy
      
      // Undo the choice
      engine.undo();
      expect(engine.getState()).toEqual(initialState);
      
      // Redo the choice
      const redoResult = engine.redo();
      
      expect(redoResult.success).toBe(true);
      expect(redoResult.restoredState?.currentNodeId).toBe('left');
      expect(redoResult.stackSizes?.undoCount).toBe(1);
      expect(redoResult.stackSizes?.redoCount).toBe(0);
      
      // State should be back to after choice
      expect(engine.getState().currentNodeId).toBe('left');
      expect(engine.getState().flags.went_left).toBe(true);
      expect(engine.canUndo()).toBe(true);
      expect(engine.canRedo()).toBe(false);
    });

    test('should track flag changes for undo', () => {
      const initialState = engine.getState();
      
      // Set a flag
      engine.setFlag('test_flag', 'test_value');
      
      expect(engine.canUndo()).toBe(true);
      expect(engine.getUndoCount()).toBe(1);
      
      // Undo flag change
      const undoResult = engine.undo();
      expect(undoResult.success).toBe(true);
      expect(engine.getFlags().test_flag).toBeUndefined();
    });

    test('should track state loading for undo', () => {
      const initialState = engine.getState();
      
      // Create a different state
      const newState: QNCEState = {
        currentNodeId: 'left',
        flags: { test: true },
        history: ['start', 'left']
      };
      
      // Load the new state
      engine.loadSimpleState(newState);
      
      expect(engine.canUndo()).toBe(true);
      expect(engine.getUndoCount()).toBe(1);
      
      // Undo state load
      const undoResult = engine.undo();
      expect(undoResult.success).toBe(true);
      expect(engine.getState()).toEqual(initialState);
    });

    test('should handle multiple undo/redo operations', () => {
      const states: QNCEState[] = [JSON.parse(JSON.stringify(engine.getState()))]; // Deep copy initial state
      
      // Make multiple choices
      let choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Go left
      states.push(JSON.parse(JSON.stringify(engine.getState())));
      
      choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Open chest
      states.push(JSON.parse(JSON.stringify(engine.getState())));
      
      choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Continue
      states.push(JSON.parse(JSON.stringify(engine.getState())));
      
      expect(engine.getUndoCount()).toBe(3);
      expect(engine.canUndo()).toBe(true);
      
      // Undo back to start
      engine.undo(); // Back to treasure
      expect(engine.getState().currentNodeId).toBe('treasure');
      
      engine.undo(); // Back to left
      expect(engine.getState().currentNodeId).toBe('left');
      
      engine.undo(); // Back to start
      expect(engine.getState()).toEqual(states[0]);
      
      expect(engine.getUndoCount()).toBe(0);
      expect(engine.getRedoCount()).toBe(3);
      
      // Redo forward
      engine.redo(); // To left
      expect(engine.getState().currentNodeId).toBe('left');
      
      engine.redo(); // To treasure
      expect(engine.getState().currentNodeId).toBe('treasure');
      
      engine.redo(); // To end
      expect(engine.getState().currentNodeId).toBe('end');
    });

    test('should clear redo stack when new change is made after undo', () => {
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]); // Go left
      
      // Undo the choice
      engine.undo();
      expect(engine.getRedoCount()).toBe(1);
      
      // Make a different choice
      const newChoices = engine.getAvailableChoices();
      engine.selectChoice(newChoices[1]); // Go right instead
      
      // Redo stack should be cleared
      expect(engine.getRedoCount()).toBe(0);
      expect(engine.canRedo()).toBe(false);
      expect(engine.getState().currentNodeId).toBe('right');
    });

    test('should respect max undo entries limit', () => {
      // Configure small limit
      engine.configureUndoRedo({ maxUndoEntries: 2 });
      
      // Make multiple flag changes
      engine.setFlag('flag1', 'value1');
      engine.setFlag('flag2', 'value2');
      engine.setFlag('flag3', 'value3');
      
      // Should only keep last 2 entries
      expect(engine.getUndoCount()).toBe(2);
    });

    test('should respect max redo entries limit', () => {
      // Configure small redo limit
      engine.configureUndoRedo({ maxRedoEntries: 1 });
      
      // Make multiple changes
      engine.setFlag('flag1', 'value1');
      engine.setFlag('flag2', 'value2');
      
      // Undo both
      engine.undo();
      engine.undo();
      
      // Should only keep 1 redo entry
      expect(engine.getRedoCount()).toBe(1);
    });

    test('should handle undo when stack is empty', () => {
      const undoResult = engine.undo();
      
      expect(undoResult.success).toBe(false);
      expect(undoResult.error).toContain('No operations to undo');
    });

    test('should handle redo when stack is empty', () => {
      const redoResult = engine.redo();
      
      expect(redoResult.success).toBe(false);
      expect(redoResult.error).toContain('No operations to redo');
    });

    test('should clear history correctly', () => {
      // Make some changes
      engine.setFlag('flag1', 'value1');
      engine.setFlag('flag2', 'value2');
      
      expect(engine.getUndoCount()).toBe(2);
      
      // Clear history
      engine.clearHistory();
      
      expect(engine.getUndoCount()).toBe(0);
      expect(engine.getRedoCount()).toBe(0);
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);
    });

    test('should provide history summary', () => {
      // Make some changes
      engine.setFlag('flag1', 'value1');
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      
      const summary = engine.getHistorySummary();
      
      expect(summary.undoEntries).toHaveLength(2);
      expect(summary.redoEntries).toHaveLength(0);
      expect(summary.undoEntries[0].action).toBe('flag-change');
      expect(summary.undoEntries[1].action).toBe('choice');
    });
  });

  describe('Autosave Configuration', () => {
    test('should have default autosave configuration', () => {
      // Autosave should be disabled by default
      const config: Partial<AutosaveConfig> = {
        enabled: true,
        triggers: ['choice'],
        maxEntries: 5
      };
      
      engine.configureAutosave(config);
      
      // Test that configuration is applied by checking behavior
      // (we can't directly access private properties)
    });

    test('should allow configuration of autosave settings', () => {
      const config: Partial<AutosaveConfig> = {
        enabled: true,
        triggers: ['choice', 'flag-change'],
        maxEntries: 10,
        throttleMs: 500,
        includeMetadata: false
      };

      expect(() => engine.configureAutosave(config)).not.toThrow();
    });
  });

  describe('Autosave Functionality', () => {
    beforeEach(() => {
      // Enable autosave for tests
      engine.configureAutosave({ 
        enabled: true, 
        triggers: ['choice', 'flag-change'],
        throttleMs: 0 // Disable throttling for tests
      });
    });

    test('should trigger autosave on choice selection', async () => {
      const choices = engine.getAvailableChoices();
      
      // Select a choice (should trigger autosave)
      engine.selectChoice(choices[0]);
      
      // Give some time for async autosave
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that checkpoints were created (autosave creates checkpoints)
      const checkpoints = engine.getCheckpoints();
      const autosaveCheckpoints = checkpoints.filter(cp => 
        cp.tags?.includes('autosave') && cp.tags?.includes('choice')
      );
      expect(autosaveCheckpoints.length).toBeGreaterThan(0);
    });

    test('should trigger autosave on flag change', async () => {
      // Set a flag (should trigger autosave)
      engine.setFlag('test_flag', 'test_value');
      
      // Give some time for async autosave
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that checkpoints were created
      const checkpoints = engine.getCheckpoints();
      const autosaveCheckpoints = checkpoints.filter(cp => 
        cp.tags?.includes('autosave') && cp.tags?.includes('flag-change')
      );
      expect(autosaveCheckpoints.length).toBeGreaterThan(0);
    });

    test('should trigger autosave on state load', async () => {
      // Configure to trigger on state load
      engine.configureAutosave({ 
        enabled: true, 
        triggers: ['state-load'],
        throttleMs: 0
      });
      
      const newState: QNCEState = {
        currentNodeId: 'left',
        flags: { test: true },
        history: ['start', 'left']
      };
      
      // Load state (should trigger autosave)
      engine.loadSimpleState(newState);
      
      // Give some time for async autosave
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that checkpoints were created
      const checkpoints = engine.getCheckpoints();
      const autosaveCheckpoints = checkpoints.filter(cp => 
        cp.tags?.includes('autosave') && cp.tags?.includes('state-load')
      );
      expect(autosaveCheckpoints.length).toBeGreaterThan(0);
    });

    test('should handle manual autosave', async () => {
      const result = await engine.manualAutosave({ reason: 'test' });
      
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(result.trigger).toBe('manual');
      expect(typeof result.duration).toBe('number');
      expect(typeof result.size).toBe('number');
    });

    test('should respect autosave throttling', async () => {
      // Configure throttling
      engine.configureAutosave({ 
        enabled: true, 
        triggers: ['flag-change'],
        throttleMs: 100 // 100ms throttle
      });
      
      // Make rapid flag changes
      engine.setFlag('flag1', 'value1');
      
      // Wait for first autosave to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkpointsAfterFirst = engine.getCheckpoints().filter(cp => 
        cp.tags?.includes('autosave')
      ).length;
      
      // Make second flag change immediately (should be throttled)
      engine.setFlag('flag2', 'value2'); 
      
      // Give some time for any potential autosave
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkpointsAfterSecond = engine.getCheckpoints().filter(cp => 
        cp.tags?.includes('autosave')
      ).length;
      
      // Due to throttling, second change should not create a new autosave
      expect(checkpointsAfterSecond).toBe(checkpointsAfterFirst);
      
      // Wait for throttle to expire and try again
      await new Promise(resolve => setTimeout(resolve, 110));
      
      engine.setFlag('flag3', 'value3');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkpointsAfterThrottle = engine.getCheckpoints().filter(cp => 
        cp.tags?.includes('autosave')
      ).length;
      
      // After throttle expires, new autosave should be created
      expect(checkpointsAfterThrottle).toBeGreaterThan(checkpointsAfterSecond);
    });

    test('should not trigger autosave during undo/redo operations', async () => {
      // Enable both undo/redo and autosave
      engine.configureUndoRedo({ enabled: true });
      engine.configureAutosave({ 
        enabled: true, 
        triggers: ['choice'],
        throttleMs: 0
      });
      
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      
      // Wait for autosave
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkpointsAfterChoice = engine.getCheckpoints().length;
      
      // Undo (should not trigger autosave)
      engine.undo();
      
      // Wait to ensure no autosave happens
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkpointsAfterUndo = engine.getCheckpoints().length;
      
      // No new checkpoints should be created during undo
      expect(checkpointsAfterUndo).toBe(checkpointsAfterChoice);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete undo operation in under 1ms for normal state', () => {
      engine.configureUndoRedo({ enabled: true });
      
      // Make a simple choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      
      // Measure undo performance
      const startTime = performance.now();
      const result = engine.undo();
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1); // Less than 1ms
    });

    test('should complete redo operation in under 1ms for normal state', () => {
      engine.configureUndoRedo({ enabled: true });
      
      // Make a choice and undo it
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      engine.undo();
      
      // Measure redo performance
      const startTime = performance.now();
      const result = engine.redo();
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1); // Less than 1ms
    });

    test('should handle large state efficiently', () => {
      engine.configureUndoRedo({ enabled: true });
      
      // Create a larger state with many flags
      for (let i = 0; i < 100; i++) {
        engine.setFlag(`flag_${i}`, `value_${i}`);
      }
      
      // Measure undo performance with large state
      const startTime = performance.now();
      const result = engine.undo();
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5); // Allow slightly more time for large state
    });
  });

  describe('Integration with Existing Features', () => {
    test('should work with checkpoint system', async () => {
      engine.configureUndoRedo({ enabled: true });
      
      // Make a choice
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      
      // Create a manual checkpoint
      const checkpoint = await engine.createCheckpoint('test');
      
      // Make another choice
      const newChoices = engine.getAvailableChoices();
      engine.selectChoice(newChoices[0]);
      
      // Should be able to undo and also restore from checkpoint
      expect(engine.canUndo()).toBe(true);
      
      const restoreResult = await engine.restoreFromCheckpoint(checkpoint.id);
      expect(restoreResult.success).toBe(true);
      expect(engine.getState().currentNodeId).toBe('left');
    });

    test('should work with state persistence', async () => {
      engine.configureUndoRedo({ enabled: true });
      
      // Make changes
      const choices = engine.getAvailableChoices();
      engine.selectChoice(choices[0]);
      engine.setFlag('test', 'value');
      
      // Save and load state
      const savedState = await engine.saveState();
      const loadResult = await engine.loadState(savedState);
      
      expect(loadResult.success).toBe(true);
      expect(engine.canUndo()).toBe(true); // Undo history should be maintained
    });

    test('should work with performance mode', () => {
      const perfEngine = createQNCEEngine(testStoryData, undefined, true);
      perfEngine.configureUndoRedo({ enabled: true });
      
      // Make a choice in performance mode
      const choices = perfEngine.getAvailableChoices();
      perfEngine.selectChoice(choices[0]);
      
      // Undo should work in performance mode
      const result = perfEngine.undo();
      expect(result.success).toBe(true);
    });
  });
});
