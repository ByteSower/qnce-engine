// Sprint 3.2: Choice Validation Tests
// Comprehensive test coverage for choice validation system

import { 
  createQNCEEngine, 
  QNCEEngine, 
  Choice, 
  StoryData,
  ChoiceValidationError,
  QNCENavigationError
} from '../src/engine/core';
import { 
  DefaultChoiceValidator, 
  createValidationContext,
  StandardValidationRules,
  ValidationRule,
  ValidationResult
} from '../src/engine/validation';
import { isChoiceValidationError } from '../src/engine/errors';

describe('QNCE Choice Validation System - Sprint 3.2', () => {
  
  let engine: QNCEEngine;
  let testStory: StoryData;

  beforeEach(() => {
    // Setup test story with various choice scenarios
    testStory = {
      initialNodeId: 'start',
      nodes: [
        {
          id: 'start',
          text: 'You are at the beginning of your journey.',
          choices: [
            { text: 'Go left', nextNodeId: 'left' },
            { text: 'Go right', nextNodeId: 'right' },
            { text: 'Stay here', nextNodeId: 'start' } // Self-loop for testing
          ]
        },
        {
          id: 'left',
          text: 'You went left and found a treasure.',
          choices: [
            { text: 'Take treasure', nextNodeId: 'treasure', flagEffects: { hasTreasure: true } },
            { text: 'Leave it', nextNodeId: 'end' }
          ]
        },
        {
          id: 'right',
          text: 'You went right and met a guard.',
          choices: [
            { text: 'Fight guard', nextNodeId: 'fight' },
            { text: 'Talk to guard', nextNodeId: 'talk' }
          ]
        },
        {
          id: 'treasure',
          text: 'You have the treasure! What now?',
          choices: [
            { text: 'Continue exploring', nextNodeId: 'explore' }
          ]
        },
        {
          id: 'fight',
          text: 'You fought bravely.',
          choices: []
        },
        {
          id: 'talk',
          text: 'You had a nice conversation.',
          choices: []
        },
        {
          id: 'explore',
          text: 'You explore with your treasure.',
          choices: []
        },
        {
          id: 'end',
          text: 'Your journey ends here.',
          choices: []
        }
      ]
    };

    engine = createQNCEEngine(testStory);
  });

  describe('ChoiceValidator Interface Implementation', () => {
    let validator: DefaultChoiceValidator;

    beforeEach(() => {
      validator = new DefaultChoiceValidator();
    });

    test('should create validator with default rules', () => {
      expect(validator).toBeDefined();
      expect(validator.getRules()).toHaveLength(5); // Enhanced standard rules
      expect(validator.getRules()[0].name).toBe('choice-exists');
      expect(validator.getRules()[1].name).toBe('flag-conditions');
      expect(validator.getRules()[2].name).toBe('choice-enabled');
      expect(validator.getRules()[3].name).toBe('time-conditions');
      expect(validator.getRules()[4].name).toBe('inventory-conditions');
    });

    test('should validate valid choice correctly', () => {
      const currentNode = testStory.nodes[0]; // start node
      const validChoice = currentNode.choices[0]; // "Go left"
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      const result = validator.validate(validChoice, context);
      
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.metadata?.allRulesPassed).toBe(true);
    });

    test('should reject invalid choice not in current node', () => {
      const currentNode = testStory.nodes[0]; // start node
      const invalidChoice: Choice = { text: 'Invalid option', nextNodeId: 'nowhere' };
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      const result = validator.validate(invalidChoice, context);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('is not available from current node');
      expect(result.metadata?.failedRule).toBe('choice-exists');
      expect(result.suggestedChoices).toEqual(currentNode.choices);
    });

    test('should get only available choices', () => {
      const currentNode = testStory.nodes[0]; // start node
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      const availableChoices = validator.getAvailableChoices(context);
      
      expect(availableChoices).toHaveLength(3);
      expect(availableChoices).toEqual(currentNode.choices);
    });

    test('should add and remove validation rules', () => {
      const customRule: ValidationRule = {
        name: 'custom-test-rule',
        priority: 10,
        validate: () => ({ isValid: false, reason: 'Custom rule failed' })
      };

      validator.addRule(customRule);
      expect(validator.getRules()).toHaveLength(6); // 5 default + 1 custom
      expect(validator.getRules().some(r => r.name === 'custom-test-rule')).toBe(true);

      validator.removeRule('custom-test-rule');
      expect(validator.getRules()).toHaveLength(5); // Back to default
      expect(validator.getRules().some(r => r.name === 'custom-test-rule')).toBe(false);
    });

    test('should sort rules by priority', () => {
      const highPriorityRule: ValidationRule = {
        name: 'high-priority',
        priority: 0,
        validate: () => ({ isValid: true })
      };

      validator.addRule(highPriorityRule);
      const rules = validator.getRules();
      
      expect(rules[0].name).toBe('high-priority');
      expect(rules[0].priority).toBe(0);
    });
  });

  describe('Engine Integration', () => {
    
    test('should use validator in getAvailableChoices()', () => {
      const availableChoices = engine.getAvailableChoices();
      
      expect(availableChoices).toHaveLength(3);
      expect(availableChoices[0].text).toBe('Go left');
      expect(availableChoices[1].text).toBe('Go right');
      expect(availableChoices[2].text).toBe('Stay here');
    });

    test('should validate choice in makeChoice() - valid choice', () => {
      expect(() => {
        engine.makeChoice(0); // Go left
      }).not.toThrow();
      
      expect(engine.getCurrentNode().id).toBe('left');
    });

    test('should validate choice in makeChoice() - invalid index', () => {
      expect(() => {
        engine.makeChoice(99); // Out of bounds
      }).toThrow(QNCENavigationError);
    });

    test('should validate choice in makeChoice() - negative index', () => {
      expect(() => {
        engine.makeChoice(-1);
      }).toThrow(QNCENavigationError);
    });

    test('should provide validation utilities', () => {
      const validator = engine.getChoiceValidator();
      expect(validator).toBeDefined();
      
      const validChoice = engine.getAvailableChoices()[0];
      expect(engine.isChoiceValid(validChoice)).toBe(true);
      
      const invalidChoice: Choice = { text: 'Invalid', nextNodeId: 'nowhere' };
      expect(engine.isChoiceValid(invalidChoice)).toBe(false);
      
      const validationResult = engine.validateChoice(validChoice);
      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    
    test('should throw ChoiceValidationError for invalid choice', () => {
      // Test scenario: choice becomes invalid after being listed
      // We'll manually call validateChoice to trigger validation failure
      const validator = engine.getChoiceValidator();
      const testChoice: Choice = { text: 'Invalid choice', nextNodeId: 'nonexistent' };
      
      expect(() => {
        // Manually validate a choice that doesn't exist in current node
        const currentNode = engine.getCurrentNode();
        const context = createValidationContext(
          currentNode,
          engine.getState(),
          currentNode.choices
        );
        const result = validator.validate(testChoice, context);
        
        if (!result.isValid) {
          throw new ChoiceValidationError(testChoice, result, currentNode.choices);
        }
      }).toThrow(ChoiceValidationError);
    });

    test('should provide detailed error information', () => {
      // Create a detailed ChoiceValidationError directly to test error information
      const testChoice: Choice = { text: 'Go left', nextNodeId: 'left' };
      const validationResult: ValidationResult = {
        isValid: false,
        reason: 'Detailed validation failure',
        failedConditions: ['condition1', 'condition2'],
        suggestedChoices: [{ text: 'Alternative', nextNodeId: 'alt' }]
      };
      const availableChoices = engine.getCurrentNode().choices;
      
      const error = new ChoiceValidationError(testChoice, validationResult, availableChoices);
      
      expect(isChoiceValidationError(error)).toBe(true);
      expect(error.message).toBe('Detailed validation failure');
      expect(error.validationResult.failedConditions).toEqual(['condition1', 'condition2']);
      expect(error.choice.text).toBe('Go left');
      expect(error.availableChoices).toHaveLength(3);
      
      const userMessage = error.getUserFriendlyMessage();
      expect(userMessage).toContain('Available choices:');
      expect(userMessage).toContain('1. Go left');
      
      const debugInfo = error.getDebugInfo();
      expect(debugInfo.error).toBe('ChoiceValidationError');          expect((debugInfo.choice as Record<string, unknown>).text).toBe('Go left');
    });
  });

  describe('Standard Validation Rules', () => {
    
    test('CHOICE_EXISTS rule validates correctly', () => {
      const currentNode = testStory.nodes[0];
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      // Valid choice
      const validChoice = currentNode.choices[0];
      const validResult = StandardValidationRules.CHOICE_EXISTS.validate(validChoice, context);
      expect(validResult.isValid).toBe(true);

      // Invalid choice
      const invalidChoice: Choice = { text: 'Not available', nextNodeId: 'nowhere' };
      const invalidResult = StandardValidationRules.CHOICE_EXISTS.validate(invalidChoice, context);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.reason).toContain('is not available from current node');
      expect(invalidResult.suggestedChoices).toEqual(currentNode.choices);
    });

    test('FLAG_CONDITIONS rule passes by default for choices without requirements', () => {
      const currentNode = testStory.nodes[0];
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      const choice = currentNode.choices[0]; // Choice without flag requirements
      const result = StandardValidationRules.FLAG_CONDITIONS.validate(choice, context);
      
      expect(result.isValid).toBe(true);
    });

    test('CHOICE_ENABLED rule passes by default for choices without explicit enabled state', () => {
      const currentNode = testStory.nodes[0];
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      const choice = currentNode.choices[0]; // Choice without enabled property
      const result = StandardValidationRules.CHOICE_ENABLED.validate(choice, context);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    
    test('should handle node with no choices', () => {
      // Navigate to an end node
      engine.makeChoice(0); // Go left
      engine.makeChoice(1); // Leave treasure
      
      const availableChoices = engine.getAvailableChoices();
      expect(availableChoices).toHaveLength(0);
      
      expect(() => {
        engine.makeChoice(0); // No choices available
      }).toThrow(QNCENavigationError);
    });

    test('should handle self-referencing choices', () => {
      engine.makeChoice(2); // Stay here (self-loop)
      
      expect(engine.getCurrentNode().id).toBe('start');
      expect(engine.getAvailableChoices()).toHaveLength(3);
    });

    test('should validate choices after state changes', () => {
      // Move to a node and validate choices there
      engine.makeChoice(0); // Go left
      
      const newChoices = engine.getAvailableChoices();
      expect(newChoices).toHaveLength(2);
      expect(newChoices[0].text).toBe('Take treasure');
      expect(newChoices[1].text).toBe('Leave it');
      
      // Validate each choice
      expect(engine.isChoiceValid(newChoices[0])).toBe(true);
      expect(engine.isChoiceValid(newChoices[1])).toBe(true);
    });

    test('should handle validation context creation', () => {
      const currentNode = engine.getCurrentNode();
      const state = engine.getState();
      const choices = engine.getAvailableChoices();
      
      const context = createValidationContext(currentNode, state, choices, { test: true });
      
      expect(context.currentNode).toBe(currentNode);
      expect(context.state).toBe(state);
      expect(context.availableChoices).toBe(choices);
      expect(context.metadata?.test).toBe(true);
      expect(context.timestamp).toBeDefined();
    });
  });

  describe('Performance and Integration', () => {
    
    test('should maintain performance during validation', () => {
      const startTime = performance.now();
      
      // Perform multiple validations
      for (let i = 0; i < 100; i++) {
        const choices = engine.getAvailableChoices();
        choices.forEach(choice => {
          engine.isChoiceValid(choice);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 100 iterations)
      expect(duration).toBeLessThan(100);
    });

    test('should not affect existing choice flows', () => {
      // Test that adding validation doesn't break existing functionality
      const _initialNode = engine.getCurrentNode().id;
      
      engine.makeChoice(0); // Go left
      expect(engine.getCurrentNode().id).toBe('left');
      
      engine.makeChoice(0); // Take treasure
      expect(engine.getCurrentNode().id).toBe('treasure');
      expect(engine.getFlags().hasTreasure).toBe(true);
      
      engine.makeChoice(0); // Continue exploring
      expect(engine.getCurrentNode().id).toBe('explore');
    });
  });

  describe('Advanced Validation Rules', () => {
    
    test('FLAG_CONDITIONS rule validates flag requirements', () => {
      const currentNode = testStory.nodes[0];
      const state = engine.getState();
      state.flags.hasKey = true;
      state.flags.playerLevel = 5;
      
      const context = createValidationContext(
        currentNode,
        state,
        currentNode.choices
      );

      // Choice with satisfied flag requirements
      const validChoice: Choice = { 
        text: 'Use key', 
        nextNodeId: 'unlock',
        flagRequirements: { hasKey: true, playerLevel: 5 }
      };
      
      let result = StandardValidationRules.FLAG_CONDITIONS.validate(validChoice, context);
      expect(result.isValid).toBe(true);

      // Choice with unsatisfied flag requirements
      const invalidChoice: Choice = { 
        text: 'Cast spell', 
        nextNodeId: 'magic',
        flagRequirements: { hasMagic: true, playerLevel: 10 }
      };
      
      result = StandardValidationRules.FLAG_CONDITIONS.validate(invalidChoice, context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Flag conditions not met');
      expect(result.failedConditions).toContain('hasMagic');
      expect(result.failedConditions).toContain('playerLevel=10');
    });

    test('CHOICE_ENABLED rule validates enabled state', () => {
      const currentNode = testStory.nodes[0];
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );

      // Enabled choice (default)
      const enabledChoice: Choice = { text: 'Go forward', nextNodeId: 'forward' };
      let result = StandardValidationRules.CHOICE_ENABLED.validate(enabledChoice, context);
      expect(result.isValid).toBe(true);

      // Explicitly enabled choice
      const explicitlyEnabledChoice: Choice = { 
        text: 'Go forward', 
        nextNodeId: 'forward',
        enabled: true
      };
      result = StandardValidationRules.CHOICE_ENABLED.validate(explicitlyEnabledChoice, context);
      expect(result.isValid).toBe(true);

      // Disabled choice
      const disabledChoice: Choice = { 
        text: 'Broken bridge', 
        nextNodeId: 'fall',
        enabled: false
      };
      result = StandardValidationRules.CHOICE_ENABLED.validate(disabledChoice, context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('is currently disabled');
    });

    test('TIME_CONDITIONS rule validates time requirements', () => {
      const currentNode = testStory.nodes[0];
      const now = new Date();
      const futureTime = new Date(now.getTime() + 3600000); // 1 hour from now
      const pastTime = new Date(now.getTime() - 3600000); // 1 hour ago
      
      const context = createValidationContext(
        currentNode,
        engine.getState(),
        currentNode.choices
      );
      // Set current timestamp in context
      context.timestamp = now.getTime();

      // Choice available after past time (should be valid)
      const validChoice: Choice = { 
        text: 'Enter shop', 
        nextNodeId: 'shop',
        timeRequirements: { availableAfter: pastTime }
      };
      
      let result = StandardValidationRules.TIME_CONDITIONS.validate(validChoice, context);
      expect(result.isValid).toBe(true);

      // Choice available after future time (should be invalid)
      const invalidChoice: Choice = { 
        text: 'Time-locked door', 
        nextNodeId: 'future',
        timeRequirements: { availableAfter: futureTime }
      };
      
      result = StandardValidationRules.TIME_CONDITIONS.validate(invalidChoice, context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Time conditions not met');
      expect(result.failedConditions![0]).toContain('not available until');
    });

    test('INVENTORY_CONDITIONS rule validates inventory requirements', () => {
      const currentNode = testStory.nodes[0];
      const state = engine.getState();
      state.flags.inventory = { gold: 50, keys: 2, potions: 0 };
      
      const context = createValidationContext(
        currentNode,
        state,
        currentNode.choices
      );

      // Choice with satisfied inventory requirements
      const validChoice: Choice = { 
        text: 'Buy sword', 
        nextNodeId: 'shop',
        inventoryRequirements: { gold: 30, keys: 1 }
      };
      
      let result = StandardValidationRules.INVENTORY_CONDITIONS.validate(validChoice, context);
      expect(result.isValid).toBe(true);

      // Choice with unsatisfied inventory requirements
      const invalidChoice: Choice = { 
        text: 'Buy castle', 
        nextNodeId: 'rich',
        inventoryRequirements: { gold: 1000, potions: 5 }
      };
      
      result = StandardValidationRules.INVENTORY_CONDITIONS.validate(invalidChoice, context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Insufficient inventory');
      expect(result.failedConditions).toContain('gold (need 1000, have 50)');
      expect(result.failedConditions).toContain('potions (need 5, have 0)');
    });
  });
});
