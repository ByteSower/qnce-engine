// QNCE Condition Evaluator - Sprint 3.4
// Parses and evaluates conditional expressions for choice visibility

import { QNCEState } from './core';

/**
 * Error thrown when condition evaluation fails
 */
export class ConditionEvaluationError extends Error {
  constructor(message: string, public readonly expression?: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConditionEvaluationError';
  }
}

/**
 * Context object passed to condition evaluators
 */
export interface ConditionContext {
  /** Current engine state */
  state: QNCEState;
  /** Current timestamp for time-based conditions */
  timestamp: number;
  /** Additional custom context data */
  customData?: Record<string, unknown>;
}

/**
 * Custom evaluator function signature
 */
export type CustomEvaluatorFunction = (expression: string, context: ConditionContext) => boolean;

/**
 * Built-in expression operators
 */
const OPERATORS = {
  '>=': (a: any, b: any) => a >= b,
  '<=': (a: any, b: any) => a <= b,
  '>': (a: any, b: any) => a > b,
  '<': (a: any, b: any) => a < b,
  '==': (a: any, b: any) => a == b,
  '===': (a: any, b: any) => a === b,
  '!=': (a: any, b: any) => a != b,
  '!==': (a: any, b: any) => a !== b,
  '&&': (a: any, b: any) => a && b,
  '||': (a: any, b: any) => a || b,
} as const;

/**
 * Condition evaluator service for parsing and executing conditional expressions
 */
export class ConditionEvaluator {
  private customEvaluator?: CustomEvaluatorFunction;
  
  // Cache compiled functions for better performance
  private functionCache: Map<string, Function> = new Map();
  private maxCacheSize: number = 100;

  /**
   * Set a custom evaluator function for handling complex conditions
   */
  setCustomEvaluator(evaluator: CustomEvaluatorFunction): void {
    this.customEvaluator = evaluator;
  }

  /**
   * Clear the custom evaluator
   */
  clearCustomEvaluator(): void {
    this.customEvaluator = undefined;
  }

  /**
   * Evaluate a condition expression against the provided context
   */
  evaluate(expression: string, context: ConditionContext): boolean {
    try {
      // If custom evaluator is set, use it first
      if (this.customEvaluator) {
        return this.customEvaluator(expression, context);
      }

      // Use built-in evaluator
      return this.evaluateBuiltIn(expression, context);
    } catch (error) {
      throw new ConditionEvaluationError(
        `Failed to evaluate condition: ${expression}`,
        expression,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Built-in expression evaluator with support for common patterns
   */
  private evaluateBuiltIn(expression: string, context: ConditionContext): boolean {
    // Handle empty expressions
    if (!expression || expression.trim() === '') {
      throw new ConditionEvaluationError(
        'Empty or whitespace-only condition expression',
        expression
      );
    }

    // Sanitize and prepare expression
    const sanitizedExpression = this.sanitizeExpression(expression);
    
    // Handle simple cases first
    if (sanitizedExpression === 'true') return true;
    if (sanitizedExpression === 'false') return false;

    // Create safe evaluation context
    const evalContext = this.createEvaluationContext(context);
    
    // Check function cache for performance
    let func = this.functionCache.get(sanitizedExpression);
    if (!func) {
      try {
        // Use Function constructor for safe evaluation (better than eval)
        func = new Function('flags', 'state', 'timestamp', 'customData', `
          "use strict";
          return ${sanitizedExpression};
        `);
        
        // Cache the function for future use
        if (this.functionCache.size >= this.maxCacheSize) {
          // Remove oldest entry when cache is full
          const firstKey = this.functionCache.keys().next().value;
          if (firstKey) {
            this.functionCache.delete(firstKey);
          }
        }
        this.functionCache.set(sanitizedExpression, func);
      } catch (error) {
        throw new ConditionEvaluationError(
          `Invalid expression syntax: ${expression}`,
          expression,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
    
    try {
      return !!func(
        evalContext.flags,
        evalContext.state,
        evalContext.timestamp,
        evalContext.customData
      );
    } catch (error) {
      throw new ConditionEvaluationError(
        `Runtime error evaluating: ${expression}`,
        expression,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sanitize expression to prevent code injection
   */
  private sanitizeExpression(expression: string): string {
    // Remove potentially dangerous patterns
    const dangerous = [
      /\beval\b/g,
      /\bFunction\b/g,
      /\bconstructor\b/g,
      /\bprototype\b/g,
      /\b__proto__\b/g,
      /\bimport\b/g,
      /\brequire\b/g,
      /\bprocess\b/g,
      /\bglobal\b/g,
      /\bwindow\b/g,
      /\bdocument\b/g,
    ];

    let sanitized = expression.trim();
    
    for (const pattern of dangerous) {
      if (pattern.test(sanitized)) {
        throw new ConditionEvaluationError(
          `Potentially unsafe expression detected: ${expression}`,
          expression
        );
      }
    }

    return sanitized;
  }

  /**
   * Create a safe evaluation context from the condition context
   */
  private createEvaluationContext(context: ConditionContext) {
    return {
      flags: { ...context.state.flags },
      state: {
        currentNodeId: context.state.currentNodeId,
        flags: { ...context.state.flags },
        history: [...context.state.history],
      },
      timestamp: context.timestamp,
      customData: context.customData ? { ...context.customData } : {},
    };
  }

  /**
   * Validate that an expression is syntactically correct without evaluating it
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      this.sanitizeExpression(expression);
      
      // Try to create the function without executing it
      new Function('flags', 'state', 'timestamp', 'customData', `
        "use strict";
        return ${expression};
      `);
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get list of flag names referenced in an expression
   */
  getReferencedFlags(expression: string): string[] {
    const flagPattern = /flags\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const matches = [];
    let match;
    
    while ((match = flagPattern.exec(expression)) !== null) {
      matches.push(match[1]);
    }
    
    return Array.from(new Set(matches)); // Remove duplicates
  }
}

// Create a global instance for the engine to use
export const conditionEvaluator = new ConditionEvaluator();
