// QNCE Choice Validation System - Sprint 3.2
// Ensures only valid choices can be executed, providing robust error handling

import { Choice, NarrativeNode, QNCEState } from './core';

/**
 * Validation context containing all state needed for choice validation
 */
export interface ValidationContext {
  currentNode: NarrativeNode;
  state: QNCEState;
  availableChoices: Choice[];
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Result of choice validation with detailed information
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  failedConditions?: string[];
  suggestedChoices?: Choice[];
  metadata?: Record<string, unknown>;
}

/**
 * Choice validation rule interface for extensible validation logic
 */
export interface ValidationRule {
  name: string;
  priority: number; // Lower numbers = higher priority
  validate(choice: Choice, context: ValidationContext): ValidationResult;
}

/**
 * Core ChoiceValidator interface
 * Provides validation logic for choice execution and availability filtering
 */
export interface ChoiceValidator {
  /**
   * Validate a specific choice against current state
   * @param choice - The choice to validate
   * @param context - Current validation context
   * @returns Validation result with details
   */
  validate(choice: Choice, context: ValidationContext): ValidationResult;

  /**
   * Get all currently available/valid choices
   * @param context - Current validation context
   * @returns Array of valid choices
   */
  getAvailableChoices(context: ValidationContext): Choice[];

  /**
   * Add a validation rule to the validator
   * @param rule - Validation rule to add
   */
  addRule(rule: ValidationRule): void;

  /**
   * Remove a validation rule by name
   * @param ruleName - Name of the rule to remove
   */
  removeRule(ruleName: string): void;

  /**
   * Get all registered validation rules
   * @returns Array of validation rules sorted by priority
   */
  getRules(): ValidationRule[];
}

/**
 * Built-in validation rules for common scenarios
 */
export class StandardValidationRules {
  /**
   * Validates that choice exists in the current node's choices
   */
  static readonly CHOICE_EXISTS: ValidationRule = {
    name: 'choice-exists',
    priority: 1,
    validate(choice: Choice, context: ValidationContext): ValidationResult {
      const exists = context.currentNode.choices.some(c => 
        c.text === choice.text && c.nextNodeId === choice.nextNodeId
      );
      
      return {
        isValid: exists,
        reason: exists ? undefined : `Choice "${choice.text}" is not available from current node`,
        suggestedChoices: exists ? undefined : context.currentNode.choices
      };
    }
  };

  /**
   * Validates flag-based conditions for choice availability
   */
  static readonly FLAG_CONDITIONS: ValidationRule = {
    name: 'flag-conditions',
    priority: 2,
    validate(choice: Choice, context: ValidationContext): ValidationResult {
      // Check if choice has flag requirements
      if (choice.flagRequirements) {
        const missingFlags: string[] = [];
        const conflictingFlags: string[] = [];
        
        for (const [flagName, requiredValue] of Object.entries(choice.flagRequirements)) {
          const currentValue = context.state.flags[flagName];
          
          if (requiredValue === true && !currentValue) {
            missingFlags.push(flagName);
          } else if (requiredValue === false && currentValue) {
            conflictingFlags.push(flagName);
          } else if (typeof requiredValue !== 'boolean' && currentValue !== requiredValue) {
            missingFlags.push(`${flagName}=${requiredValue}`);
          }
        }
        
        if (missingFlags.length > 0 || conflictingFlags.length > 0) {
          const reasons = [];
          if (missingFlags.length > 0) {
            reasons.push(`Missing required flags: ${missingFlags.join(', ')}`);
          }
          if (conflictingFlags.length > 0) {
            reasons.push(`Conflicting flags: ${conflictingFlags.join(', ')}`);
          }
          
          return {
            isValid: false,
            reason: `Flag conditions not met: ${reasons.join('; ')}`,
            failedConditions: [...missingFlags, ...conflictingFlags],
            metadata: {
              missingFlags,
              conflictingFlags,
              currentFlags: context.state.flags
            }
          };
        }
      }
      
      return {
        isValid: true,
        reason: undefined
      };
    }
  };

  /**
   * Validates choice is not disabled or marked as unavailable
   */
  static readonly CHOICE_ENABLED: ValidationRule = {
    name: 'choice-enabled',
    priority: 3,
    validate(choice: Choice, _context: ValidationContext): ValidationResult {
      if (choice.enabled === false) {
        return {
          isValid: false,
          reason: `Choice "${choice.text}" is currently disabled`,
          failedConditions: ['choice-disabled']
        };
      }
      
      return {
        isValid: true,
        reason: undefined
      };
    }
  };

  /**
   * Validates time-based requirements for choice availability
   */
  static readonly TIME_CONDITIONS: ValidationRule = {
    name: 'time-conditions',
    priority: 4,
    validate(choice: Choice, context: ValidationContext): ValidationResult {
      if (choice.timeRequirements) {
        const now = new Date();
        const currentTime = context.timestamp || now.getTime();
        const failures: string[] = [];
        
        if (choice.timeRequirements.availableAfter) {
          const afterTime = new Date(choice.timeRequirements.availableAfter).getTime();
          if (currentTime < afterTime) {
            failures.push(`not available until ${choice.timeRequirements.availableAfter}`);
          }
        }
        
        if (choice.timeRequirements.availableBefore) {
          const beforeTime = new Date(choice.timeRequirements.availableBefore).getTime();
          if (currentTime > beforeTime) {
            failures.push(`no longer available after ${choice.timeRequirements.availableBefore}`);
          }
        }
        
        if (choice.timeRequirements.minTime && currentTime < choice.timeRequirements.minTime) {
          failures.push(`minimum time not reached`);
        }
        
        if (choice.timeRequirements.maxTime && currentTime > choice.timeRequirements.maxTime) {
          failures.push(`maximum time exceeded`);
        }
        
        if (failures.length > 0) {
          return {
            isValid: false,
            reason: `Time conditions not met: ${failures.join(', ')}`,
            failedConditions: failures,
            metadata: {
              currentTime,
              timeRequirements: choice.timeRequirements
            }
          };
        }
      }
      
      return {
        isValid: true,
        reason: undefined
      };
    }
  };

  /**
   * Validates inventory-based requirements for choice availability
   */
  static readonly INVENTORY_CONDITIONS: ValidationRule = {
    name: 'inventory-conditions',
    priority: 5,
    validate(choice: Choice, context: ValidationContext): ValidationResult {
      if (choice.inventoryRequirements) {
        const inventory = context.state.flags.inventory as Record<string, number> || {};
        const missingItems: string[] = [];
        
        for (const [itemName, requiredQuantity] of Object.entries(choice.inventoryRequirements)) {
          const currentQuantity = inventory[itemName] || 0;
          if (currentQuantity < requiredQuantity) {
            missingItems.push(`${itemName} (need ${requiredQuantity}, have ${currentQuantity})`);
          }
        }
        
        if (missingItems.length > 0) {
          return {
            isValid: false,
            reason: `Insufficient inventory: ${missingItems.join(', ')}`,
            failedConditions: missingItems,
            metadata: {
              currentInventory: inventory,
              requirements: choice.inventoryRequirements
            }
          };
        }
      }
      
      return {
        isValid: true,
        reason: undefined
      };
    }
  };
}

/**
 * Default implementation of ChoiceValidator
 * Uses a rule-based system for extensible validation logic
 */
export class DefaultChoiceValidator implements ChoiceValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    // Add standard validation rules by default
    this.addRule(StandardValidationRules.CHOICE_EXISTS);
    this.addRule(StandardValidationRules.FLAG_CONDITIONS);
    this.addRule(StandardValidationRules.CHOICE_ENABLED);
    this.addRule(StandardValidationRules.TIME_CONDITIONS);
    this.addRule(StandardValidationRules.INVENTORY_CONDITIONS);
  }

  validate(choice: Choice, context: ValidationContext): ValidationResult {
    // Run all validation rules in priority order
    const sortedRules = this.getRules();
    
    for (const rule of sortedRules) {
      const result = rule.validate(choice, context);
      
      // If any rule fails, return that failure
      if (!result.isValid) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            failedRule: rule.name,
            rulesPassed: sortedRules.indexOf(rule)
          }
        };
      }
    }

    // All rules passed
    return {
      isValid: true,
      metadata: {
        rulesChecked: sortedRules.length,
        allRulesPassed: true
      }
    };
  }

  getAvailableChoices(context: ValidationContext): Choice[] {
    return context.currentNode.choices.filter(choice => {
      const result = this.validate(choice, context);
      return result.isValid;
    });
  }

  addRule(rule: ValidationRule): void {
    // Remove any existing rule with the same name
    this.removeRule(rule.name);
    
    // Add the new rule
    this.rules.push(rule);
    
    // Sort by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  getRules(): ValidationRule[] {
    return [...this.rules].sort((a, b) => a.priority - b.priority);
  }
}

/**
 * Factory function to create a choice validator with default rules
 */
export function createChoiceValidator(): ChoiceValidator {
  return new DefaultChoiceValidator();
}

/**
 * Utility function to create validation context from engine state
 */
export function createValidationContext(
  currentNode: NarrativeNode,
  state: QNCEState,
  availableChoices: Choice[],
  metadata?: Record<string, unknown>
): ValidationContext {
  return {
    currentNode,
    state,
    availableChoices,
    timestamp: performance.now(),
    metadata
  };
}
