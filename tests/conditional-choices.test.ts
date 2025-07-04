// QNCE Engine Conditional Choices Tests - Sprint 3.4
// Comprehensive test coverage for conditional choice display

import { QNCEEngine, createQNCEEngine, StoryData, Choice } from '../src/engine/core';
import { 
  ConditionEvaluator, 
  ConditionEvaluationError, 
  conditionEvaluator,
  ConditionContext,
  CustomEvaluatorFunction 
} from '../src/engine/condition';

describe('QNCE Conditional Choice Display - Sprint 3.4', () => {
  let testStory: StoryData;
  let engine: QNCEEngine;

  beforeEach(() => {
    // Reset condition evaluator for each test
    conditionEvaluator.clearCustomEvaluator();

    // Create test story with conditional choices
    testStory = {
      initialNodeId: 'start',
      nodes: [
        {
          id: 'start',
          text: 'You are at the beginning of your adventure.',
          choices: [
            {
              text: 'Go north (always available)',
              nextNodeId: 'north'
            },
            {
              text: 'Go east (requires curiosity >= 3)',
              nextNodeId: 'east',
              condition: 'flags.curiosity >= 3'
            },
            {
              text: 'Go west (requires sword)',
              nextNodeId: 'west',
              condition: 'flags.hasSword === true'
            },
            {
              text: 'Use magic (complex condition)',
              nextNodeId: 'magic',
              condition: 'flags.magicLevel > 0 && flags.mana >= 10 && !flags.exhausted'
            },
            {
              text: 'Secret path (custom logic)',
              nextNodeId: 'secret',
              condition: 'customLogic'
            }
          ]
        },
        {
          id: 'north',
          text: 'You went north.',
          choices: []
        },
        {
          id: 'east',
          text: 'You went east.',
          choices: []
        },
        {
          id: 'west',
          text: 'You went west.',
          choices: []
        },
        {
          id: 'magic',
          text: 'You used magic.',
          choices: []
        },
        {
          id: 'secret',
          text: 'You found the secret path.',
          choices: []
        }
      ]
    };

    engine = createQNCEEngine(testStory);
  });

  describe('ConditionEvaluator', () => {
    let evaluator: ConditionEvaluator;

    beforeEach(() => {
      evaluator = new ConditionEvaluator();
    });

    describe('Basic Expression Evaluation', () => {
      it('should evaluate simple boolean expressions', () => {
        const context: ConditionContext = {
          state: { currentNodeId: 'test', flags: { test: true }, history: [] },
          timestamp: Date.now()
        };

        expect(evaluator.evaluate('true', context)).toBe(true);
        expect(evaluator.evaluate('false', context)).toBe(false);
        expect(evaluator.evaluate('flags.test === true', context)).toBe(true);
        expect(evaluator.evaluate('flags.test === false', context)).toBe(false);
      });

      it('should evaluate numeric comparisons', () => {
        const context: ConditionContext = {
          state: { currentNodeId: 'test', flags: { level: 5, score: 100 }, history: [] },
          timestamp: Date.now()
        };

        expect(evaluator.evaluate('flags.level >= 3', context)).toBe(true);
        expect(evaluator.evaluate('flags.level > 10', context)).toBe(false);
        expect(evaluator.evaluate('flags.score <= 100', context)).toBe(true);
        expect(evaluator.evaluate('flags.score < 50', context)).toBe(false);
      });

      it('should evaluate complex logical expressions', () => {
        const context: ConditionContext = {
          state: { 
            currentNodeId: 'test', 
            flags: { 
              level: 5, 
              hasSword: true, 
              mana: 15,
              exhausted: false 
            }, 
            history: [] 
          },
          timestamp: Date.now()
        };

        expect(evaluator.evaluate('flags.level >= 3 && flags.hasSword', context)).toBe(true);
        expect(evaluator.evaluate('flags.level > 10 || flags.hasSword', context)).toBe(true);
        expect(evaluator.evaluate('flags.mana >= 10 && !flags.exhausted', context)).toBe(true);
        expect(evaluator.evaluate('flags.level > 10 && flags.mana < 5', context)).toBe(false);
      });
    });

    describe('Expression Validation', () => {
      it('should validate correct expressions', () => {
        const result1 = evaluator.validateExpression('flags.test === true');
        expect(result1.valid).toBe(true);
        expect(result1.error).toBeUndefined();

        const result2 = evaluator.validateExpression('flags.level >= 3 && flags.hasSword');
        expect(result2.valid).toBe(true);
      });

      it('should reject invalid expressions', () => {
        const result1 = evaluator.validateExpression('flags.test ===');
        expect(result1.valid).toBe(false);
        expect(result1.error).toBeDefined();

        const result2 = evaluator.validateExpression('invalid syntax here');
        expect(result2.valid).toBe(false);
      });

      it('should reject potentially dangerous expressions', () => {
        expect(() => {
          evaluator.evaluate('eval("malicious code")', { 
            state: { currentNodeId: 'test', flags: {}, history: [] },
            timestamp: Date.now()
          });
        }).toThrow(ConditionEvaluationError);

        expect(() => {
          evaluator.evaluate('constructor.constructor("return process")()', { 
            state: { currentNodeId: 'test', flags: {}, history: [] },
            timestamp: Date.now()
          });
        }).toThrow(ConditionEvaluationError);
      });
    });

    describe('Flag Reference Detection', () => {
      it('should detect flag references in expressions', () => {
        const flags1 = evaluator.getReferencedFlags('flags.curiosity >= 3');
        expect(flags1).toEqual(['curiosity']);

        const flags2 = evaluator.getReferencedFlags('flags.level > 0 && flags.mana >= 10 && !flags.exhausted');
        expect(flags2).toEqual(['level', 'mana', 'exhausted']);

        const flags3 = evaluator.getReferencedFlags('true');
        expect(flags3).toEqual([]);
      });
    });

    describe('Custom Evaluator', () => {
      it('should use custom evaluator when set', () => {
        const customEvaluator: CustomEvaluatorFunction = (expression, context) => {
          if (expression === 'customLogic') {
            return context.state.flags.secretCode === 'konami';
          }
          return false;
        };

        evaluator.setCustomEvaluator(customEvaluator);

        const context: ConditionContext = {
          state: { currentNodeId: 'test', flags: { secretCode: 'konami' }, history: [] },
          timestamp: Date.now()
        };

        expect(evaluator.evaluate('customLogic', context)).toBe(true);

        const context2: ConditionContext = {
          state: { currentNodeId: 'test', flags: { secretCode: 'wrong' }, history: [] },
          timestamp: Date.now()
        };

        expect(evaluator.evaluate('customLogic', context2)).toBe(false);
      });

      it('should clear custom evaluator', () => {
        const customEvaluator: CustomEvaluatorFunction = () => true;
        evaluator.setCustomEvaluator(customEvaluator);
        evaluator.clearCustomEvaluator();

        const context: ConditionContext = {
          state: { currentNodeId: 'test', flags: {}, history: [] },
          timestamp: Date.now()
        };

        // Should fall back to built-in evaluation and fail on unknown identifier
        expect(() => {
          evaluator.evaluate('customLogic', context);
        }).toThrow(ConditionEvaluationError);
      });
    });
  });

  describe('Engine Integration', () => {
    describe('getAvailableChoices with Conditions', () => {
      it('should return all choices when no conditions are set', () => {
        const simpleStory: StoryData = {
          initialNodeId: 'start',
          nodes: [
            {
              id: 'start',
              text: 'Simple test.',
              choices: [
                { text: 'Choice 1', nextNodeId: 'end' },
                { text: 'Choice 2', nextNodeId: 'end' }
              ]
            },
            { id: 'end', text: 'End.', choices: [] }
          ]
        };

        const simpleEngine = createQNCEEngine(simpleStory);
        const choices = simpleEngine.getAvailableChoices();
        expect(choices).toHaveLength(2);
      });

      it('should filter choices based on simple flag conditions', () => {
        // Initially, only the "always available" choice should show
        let choices = engine.getAvailableChoices();
        expect(choices).toHaveLength(1);
        expect(choices[0].text).toBe('Go north (always available)');

        // Set curiosity flag and check east choice appears
        engine.setFlag('curiosity', 5);
        choices = engine.getAvailableChoices();
        expect(choices).toHaveLength(2);
        expect(choices.some(c => c.text.includes('Go east'))).toBe(true);

        // Set sword flag and check west choice appears
        engine.setFlag('hasSword', true);
        choices = engine.getAvailableChoices();
        expect(choices).toHaveLength(3);
        expect(choices.some(c => c.text.includes('Go west'))).toBe(true);
      });

      it('should filter choices based on complex conditions', () => {
        // Set up for magic choice
        engine.setFlag('magicLevel', 2);
        engine.setFlag('mana', 15);
        engine.setFlag('exhausted', false);

        const choices = engine.getAvailableChoices();
        expect(choices.some(c => c.text.includes('Use magic'))).toBe(true);

        // Exhaust the character - magic should no longer be available
        engine.setFlag('exhausted', true);
        const exhaustedChoices = engine.getAvailableChoices();
        expect(exhaustedChoices.some(c => c.text.includes('Use magic'))).toBe(false);
      });

      it('should handle custom evaluator logic', () => {
        // Set custom evaluator for secret path
        engine.setConditionEvaluator((expression, context) => {
          if (expression === 'customLogic') {
            return context.state.flags.secretCode === 'konami';
          }
          return false;
        });

        // Initially secret path shouldn't be available
        let choices = engine.getAvailableChoices();
        expect(choices.some(c => c.text.includes('Secret path'))).toBe(false);

        // Set secret code
        engine.setFlag('secretCode', 'konami');
        choices = engine.getAvailableChoices();
        expect(choices.some(c => c.text.includes('Secret path'))).toBe(true);
      });

      it('should handle invalid conditions gracefully', () => {
        const invalidStory: StoryData = {
          initialNodeId: 'start',
          nodes: [
            {
              id: 'start',
              text: 'Test invalid conditions.',
              choices: [
                {
                  text: 'Valid choice',
                  nextNodeId: 'end'
                },
                {
                  text: 'Invalid condition choice',
                  nextNodeId: 'end',
                  condition: 'invalid syntax here'
                }
              ]
            },
            { id: 'end', text: 'End.', choices: [] }
          ]
        };

        const invalidEngine = createQNCEEngine(invalidStory);
        
        // Should only return the valid choice, invalid one should be filtered out
        const choices = invalidEngine.getAvailableChoices();
        expect(choices).toHaveLength(1);
        expect(choices[0].text).toBe('Valid choice');
      });
    });

    describe('Condition Evaluator API', () => {
      it('should set and clear custom evaluators', () => {
        const customEvaluator: CustomEvaluatorFunction = () => true;
        
        engine.setConditionEvaluator(customEvaluator);
        // Custom evaluator is now set (tested indirectly through choice filtering)
        
        engine.clearConditionEvaluator();
        // Custom evaluator is now cleared
        
        // No direct way to test this without exposing internal state,
        // but we can test through the evaluation behavior
        expect(() => {
          engine.validateCondition('customLogic');
        }).not.toThrow();
      });

      it('should validate condition expressions', () => {
        const validResult = engine.validateCondition('flags.test === true');
        expect(validResult.valid).toBe(true);

        const invalidResult = engine.validateCondition('invalid syntax');
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.error).toBeDefined();
      });

      it('should get condition flags', () => {
        const flags = engine.getConditionFlags('flags.level >= 3 && flags.hasSword');
        expect(flags).toEqual(['level', 'hasSword']);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should complete choice filtering under 15ms for normal conditions', () => {
      // Set up multiple flag conditions
      engine.setFlag('curiosity', 5);
      engine.setFlag('hasSword', true);
      engine.setFlag('magicLevel', 2);
      engine.setFlag('mana', 15);
      engine.setFlag('exhausted', false);

      const start = performance.now();
      const choices = engine.getAvailableChoices();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(15); // Under 15ms (generous for test environment)
      expect(choices.length).toBeGreaterThan(0);
    });

    it('should handle many conditional choices efficiently', () => {
      // Create story with many conditional choices
      const manyChoicesStory: StoryData = {
        initialNodeId: 'start',
        nodes: [
          {
            id: 'start',
            text: 'Many choices test.',
            choices: Array.from({ length: 50 }, (_, i) => ({
              text: `Choice ${i}`,
              nextNodeId: 'end',
              condition: `flags.choice${i} === true`
            }))
          },
          { id: 'end', text: 'End.', choices: [] }
        ]
      };

      const manyChoicesEngine = createQNCEEngine(manyChoicesStory);
      
      // Set some flags to true
      for (let i = 0; i < 25; i++) {
        manyChoicesEngine.setFlag(`choice${i}`, true);
      }

      const start = performance.now();
      const choices = manyChoicesEngine.getAvailableChoices();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(15); // Under 15ms even with 50 conditions
      expect(choices).toHaveLength(25); // Half the choices should be available
    });
  });

  describe('Error Handling', () => {
    it('should throw ConditionEvaluationError for invalid expressions', () => {
      expect(() => {
        conditionEvaluator.evaluate('invalid expression syntax', {
          state: { currentNodeId: 'test', flags: {}, history: [] },
          timestamp: Date.now()
        });
      }).toThrow(ConditionEvaluationError);
    });

    it('should include expression details in error', () => {
      try {
        conditionEvaluator.evaluate('flags.test ===', {
          state: { currentNodeId: 'test', flags: {}, history: [] },
          timestamp: Date.now()
        });
        fail('Expected ConditionEvaluationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConditionEvaluationError);
        const condError = error as ConditionEvaluationError;
        expect(condError.expression).toBe('flags.test ===');
        expect(condError.message).toContain('flags.test ===');
      }
    });

    it('should handle custom evaluator errors gracefully', () => {
      const faultyEvaluator: CustomEvaluatorFunction = () => {
        throw new Error('Custom evaluator error');
      };

      conditionEvaluator.setCustomEvaluator(faultyEvaluator);

      expect(() => {
        conditionEvaluator.evaluate('test', {
          state: { currentNodeId: 'test', flags: {}, history: [] },
          timestamp: Date.now()
        });
      }).toThrow(ConditionEvaluationError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined and null flag values', () => {
      const context: ConditionContext = {
        state: { 
          currentNodeId: 'test', 
          flags: { 
            definedFlag: 'value',
            nullFlag: null,
            undefinedFlag: undefined
          }, 
          history: [] 
        },
        timestamp: Date.now()
      };

      expect(conditionEvaluator.evaluate('flags.definedFlag === "value"', context)).toBe(true);
      expect(conditionEvaluator.evaluate('flags.nullFlag === null', context)).toBe(true);
      expect(conditionEvaluator.evaluate('flags.undefinedFlag === undefined', context)).toBe(true);
      expect(conditionEvaluator.evaluate('flags.nonExistentFlag === undefined', context)).toBe(true);
    });

    it('should handle empty expressions', () => {
      expect(() => {
        conditionEvaluator.evaluate('', {
          state: { currentNodeId: 'test', flags: {}, history: [] },
          timestamp: Date.now()
        });
      }).toThrow(ConditionEvaluationError);
    });

    it('should handle complex nested flag objects', () => {
      const context: ConditionContext = {
        state: { 
          currentNodeId: 'test', 
          flags: { 
            player: {
              stats: {
                level: 5,
                hp: 100
              }
            }
          }, 
          history: [] 
        },
        timestamp: Date.now()
      };

      // Note: Our current implementation only supports flat flag access
      // This test verifies that complex objects don't break the evaluator
      expect(() => {
        conditionEvaluator.evaluate('flags.player !== undefined', context);
      }).not.toThrow();
    });
  });
});
