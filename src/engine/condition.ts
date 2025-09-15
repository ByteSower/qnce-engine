// QNCE Condition Evaluator - Sprint 3.4
// Parses and evaluates conditional expressions for choice visibility

import { QNCEState } from './core';
import { internString } from '../utils/intern';

/**
 * Error thrown when condition evaluation fails
 * @public
 */
export class ConditionEvaluationError extends Error {
  constructor(message: string, public readonly expression?: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConditionEvaluationError';
  }
}

/**
 * Context object passed to condition evaluators
 * @public
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
 * @public
 */
export type CustomEvaluatorFunction = (expression: string, context: ConditionContext) => boolean;

/**
 * Built-in expression operators
 */
type Primitive = string | number | boolean | null | undefined;
type OperatorFn = (a: Primitive, b: Primitive) => unknown;
// Reserved for future static analysis/validation passes (currently not referenced)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OPERATORS: Record<string, OperatorFn> = {
  '>=': (a, b) => (a as number | string) >= (b as number | string),
  '<=': (a, b) => (a as number | string) <= (b as number | string),
  '>': (a, b) => (a as number | string) > (b as number | string),
  '<': (a, b) => (a as number | string) < (b as number | string),
  '==': (a, b) => (a as unknown) == (b as unknown), // eslint-disable-line eqeqeq
  '===': (a, b) => a === b,
  '!=': (a, b) => (a as unknown) != (b as unknown), // eslint-disable-line eqeqeq
  '!==': (a, b) => a !== b,
  '&&': (a, b) => (a as unknown) && (b as unknown),
  '||': (a, b) => (a as unknown) || (b as unknown),
};

/**
 * Condition evaluator service for parsing and executing conditional expressions
 * @public
 */
export class ConditionEvaluator {
  private customEvaluator?: CustomEvaluatorFunction;
  
  // Cache compiled functions for better performance
  private functionCache: Map<string, Function> = new Map();
  private maxCacheSize = 100;

  // Expression canonicalization (sanitized+interned) LRU cache
  private expressionCache: Map<string, string> = new Map();
  private maxExpressionCacheSize = 256;

  // Lightweight evaluation context pool (optional)
  private contextPool: Array<{
    flags: Record<string, unknown>;
    state: { currentNodeId: string; flags: Record<string, unknown>; history: string[] };
    timestamp: number;
    customData: Record<string, unknown> | undefined;
  }> = [];
  private maxContextPoolSize = 64;
  private poolingEnabled = false;

  /** @internal Enable/disable context pooling (engine toggles in perf mode) */
  enablePooling(enable: boolean) { this.poolingEnabled = enable; }
  /** @internal Adjust pool cap during tuning */
  setMaxContextPoolSize(size: number) { this.maxContextPoolSize = size; }

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
  const sanitizedExpression = this.internAndNormalize(expression);
    
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
      const result = !!func(
        evalContext.flags,
        evalContext.state,
        evalContext.timestamp,
        evalContext.customData
      );
      this.releaseEvaluationContext(evalContext);
      return result;
    } catch (error) {
      this.releaseEvaluationContext(evalContext);
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

  const sanitized = expression.trim();
    
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

  /** Normalize + intern expression with LRU retention */
  private internAndNormalize(expression: string): string {
    const sanitized = this.sanitizeExpression(expression);
    if (this.expressionCache.has(sanitized)) {
      const existing = this.expressionCache.get(sanitized)!;
      return existing;
    }
    const canonical = internString(sanitized);
    if (this.expressionCache.size >= this.maxExpressionCacheSize) {
      const first = this.expressionCache.keys().next().value;
      if (first) this.expressionCache.delete(first);
    }
    this.expressionCache.set(canonical, canonical);
    return canonical;
  }

  /**
   * Create a safe evaluation context from the condition context
   */
  private createEvaluationContext(context: ConditionContext) {
    if (!this.poolingEnabled || this.contextPool.length === 0) {
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
    const ctx = this.contextPool.pop()!;
    ctx.flags = { ...context.state.flags };
    ctx.state.currentNodeId = context.state.currentNodeId;
    ctx.state.flags = { ...context.state.flags };
    ctx.state.history = [...context.state.history];
    ctx.timestamp = context.timestamp;
    ctx.customData = context.customData ? { ...context.customData } : {};
    return ctx;
  }

  private releaseEvaluationContext(ctx: { flags: Record<string, unknown>; state: { currentNodeId: string; flags: Record<string, unknown>; history: string[] }; timestamp: number; customData: Record<string, unknown> | undefined; }) {
    if (!this.poolingEnabled) return;
    if (this.contextPool.length < this.maxContextPoolSize) {
      ctx.customData = undefined; // drop potentially large data refs
      this.contextPool.push(ctx);
    }
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
/** @public */
export const conditionEvaluator = new ConditionEvaluator();
