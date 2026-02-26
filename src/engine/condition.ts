// QNCE Condition Evaluator - Sprint 3.4
// Parses and evaluates conditional expressions for choice visibility
// Safe expression evaluator: no dynamic code execution (no eval / new Function)

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

// ─── Safe expression parser ───────────────────────────────────────────────────
// Replaces `new Function` / `eval` with a whitelist-only recursive-descent
// parser.  Only the constructs listed in the grammar below are accepted;
// anything else throws, preventing arbitrary code execution.
//
// Grammar (EBNF):
//   expr         := or_expr
//   or_expr      := and_expr ('||' and_expr)*
//   and_expr     := not_expr ('&&' not_expr)*
//   not_expr     := '!' not_expr | compare_expr
//   compare_expr := add_expr (cmp_op add_expr)?
//     cmp_op     := '===' | '==' | '!==' | '!=' | '>=' | '<=' | '>' | '<'
//   add_expr     := mul_expr (('+' | '-') mul_expr)*
//   mul_expr     := unary (('*' | '/' | '%') unary)*
//   unary        := '-' unary | primary
//   primary      := '(' expr ')' | literal | member_access
//   literal      := 'true' | 'false' | 'null' | 'undefined' | NUMBER | STRING
//   member_access:= 'flags' '.' IDENT
//                 | 'state' '.' IDENT
//                 | 'customData' '.' IDENT
//                 | 'timestamp'

type TokenKind = 'number' | 'string' | 'ident' | 'op' | 'lparen' | 'rparen' | 'dot';
interface Token { readonly kind: TokenKind; readonly value: string; }
type SafeValue = string | number | boolean | null | undefined | object;

/** Tokenize a condition expression string into an array of Tokens. */
function tokenizeExpression(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }

    // Number literal
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ kind: 'number', value: num });
      continue;
    }

    // String literal (single or double quoted, basic escape support)
    if (ch === '"' || ch === "'") {
      const quote = ch; i++;
      let str = '';
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < expr.length) i++;  // skip escape prefix (bounds-safe)
        str += expr[i++];
      }
      if (expr[i] === quote) i++;
      tokens.push({ kind: 'string', value: str });
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let id = '';
      while (i < expr.length && /[a-zA-Z0-9_$]/.test(expr[i])) id += expr[i++];
      tokens.push({ kind: 'ident', value: id });
      continue;
    }

    // 3-char operators (must be checked before 2-char)
    const c3 = expr.slice(i, i + 3);
    if (c3 === '===' || c3 === '!==') {
      tokens.push({ kind: 'op', value: c3 }); i += 3; continue;
    }

    // 2-char operators
    const c2 = expr.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(c2)) {
      tokens.push({ kind: 'op', value: c2 }); i += 2; continue;
    }

    // 1-char operators
    if ('!<>+-*/%'.includes(ch)) {
      tokens.push({ kind: 'op', value: ch }); i++; continue;
    }
    if (ch === '(') { tokens.push({ kind: 'lparen', value: ch }); i++; continue; }
    if (ch === ')') { tokens.push({ kind: 'rparen', value: ch }); i++; continue; }
    if (ch === '.') { tokens.push({ kind: 'dot', value: ch }); i++; continue; }

    throw new Error(`Unexpected character '${ch}' in expression`);
  }
  return tokens;
}

/** Recursive-descent evaluator operating on a pre-tokenized expression. */
class SafeParser {
  pos = 0;
  private readonly toks: Token[];
  private readonly flags: Record<string, unknown>;
  private readonly state: { currentNodeId: string; flags: Record<string, unknown>; history: string[] };
  private readonly timestamp: number;
  private readonly customData: Record<string, unknown> | undefined;

  constructor(
    tokens: Token[],
    ctx: {
      flags: Record<string, unknown>;
      state: { currentNodeId: string; flags: Record<string, unknown>; history: string[] };
      timestamp: number;
      customData: Record<string, unknown> | undefined;
    }
  ) {
    this.toks = tokens;
    this.flags = ctx.flags;
    this.state = ctx.state;
    this.timestamp = ctx.timestamp;
    this.customData = ctx.customData;
  }

  evaluate(): SafeValue {
    const result = this.parseOr();
    if (this.pos < this.toks.length) {
      throw new Error(`Unexpected token '${this.toks[this.pos].value}'`);
    }
    return result;
  }

  private peek(): Token | undefined { return this.toks[this.pos]; }

  private advance(): Token {
    const t = this.toks[this.pos++];
    if (!t) throw new Error('Unexpected end of expression');
    return t;
  }

  private parseOr(): SafeValue {
    let left = this.parseAnd();
    while (this.peek()?.value === '||') {
      this.pos++;
      const right = this.parseAnd();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      left = ((left as any) || (right as any)) as SafeValue;
    }
    return left;
  }

  private parseAnd(): SafeValue {
    let left = this.parseNot();
    while (this.peek()?.value === '&&') {
      this.pos++;
      const right = this.parseNot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      left = ((left as any) && (right as any)) as SafeValue;
    }
    return left;
  }

  private parseNot(): SafeValue {
    if (this.peek()?.value === '!') { this.pos++; return !this.parseNot(); }
    return this.parseComparison();
  }

  private parseComparison(): SafeValue {
    const left = this.parseAdd();
    const op = this.peek();
    if (op?.kind === 'op' && ['===', '!==', '==', '!=', '>=', '<=', '>', '<'].includes(op.value)) {
      this.pos++;
      const right = this.parseAdd();
      switch (op.value) {
        case '===': return left === right;
        case '!==': return left !== right;
        // eslint-disable-next-line eqeqeq
        case '==':  return (left as unknown) == (right as unknown);
        // eslint-disable-next-line eqeqeq
        case '!=':  return (left as unknown) != (right as unknown);
        case '>=':  return (left as string | number) >= (right as string | number);
        case '<=':  return (left as string | number) <= (right as string | number);
        case '>':   return (left as string | number) >  (right as string | number);
        case '<':   return (left as string | number) <  (right as string | number);
      }
    }
    return left;
  }

  private parseAdd(): SafeValue {
    let left = this.parseMul();
    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      const op = this.advance().value;
      const right = this.parseMul();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      left = op === '+' ? ((left as any) + (right as any)) as SafeValue : (left as number) - (right as number);
    }
    return left;
  }

  private parseMul(): SafeValue {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek()?.value ?? '')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      if (op === '*') left = (left as number) * (right as number);
      else if (op === '/') left = (left as number) / (right as number);
      else left = (left as number) % (right as number);
    }
    return left;
  }

  private parseUnary(): SafeValue {
    if (this.peek()?.value === '-') { this.pos++; return -(this.parseUnary() as number); }
    return this.parsePrimary();
  }

  private parsePrimary(): SafeValue {
    const tok = this.peek();
    if (!tok) throw new Error('Unexpected end of expression');

    if (tok.kind === 'lparen') {
      this.pos++;
      const val = this.parseOr();
      if (this.peek()?.kind !== 'rparen') throw new Error("Expected ')'");
      this.pos++;
      return val;
    }

    if (tok.kind === 'number') { this.pos++; return parseFloat(tok.value); }
    if (tok.kind === 'string') { this.pos++; return tok.value; }

    if (tok.kind === 'ident') {
      this.pos++;
      switch (tok.value) {
        case 'true':      return true;
        case 'false':     return false;
        case 'null':      return null;
        case 'undefined': return undefined;
        case 'timestamp': return this.timestamp;
        case 'flags': {
          if (this.peek()?.kind !== 'dot') throw new Error("Expected '.' after 'flags'");
          this.pos++;
          const name = this.advance();
          if (name.kind !== 'ident') throw new Error("Expected identifier after 'flags.'");
          return this.flags[name.value] as SafeValue;
        }
        case 'state': {
          if (this.peek()?.kind !== 'dot') throw new Error("Expected '.' after 'state'");
          this.pos++;
          const name = this.advance();
          if (name.kind !== 'ident') throw new Error("Expected identifier after 'state.'");
          return (this.state as Record<string, unknown>)[name.value] as SafeValue;
        }
        case 'customData': {
          if (this.peek()?.kind !== 'dot') throw new Error("Expected '.' after 'customData'");
          this.pos++;
          const name = this.advance();
          if (name.kind !== 'ident') throw new Error("Expected identifier after 'customData.'");
          return (this.customData ? this.customData[name.value] : undefined) as SafeValue;
        }
        default:
          throw new Error(`Unknown identifier '${tok.value}'`);
      }
    }

    throw new Error(`Unexpected token '${tok.value}'`);
  }
}

// ─── ConditionEvaluator class ─────────────────────────────────────────────────

/**
 * Condition evaluator service for parsing and executing conditional expressions
 * @public
 */
export class ConditionEvaluator {
  private customEvaluator?: CustomEvaluatorFunction;

  // Cache tokenized expressions for better performance
  private tokenCache: Map<string, Token[]> = new Map();
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
   * Built-in expression evaluator – uses the safe recursive-descent parser;
   * no dynamic code generation (no eval / new Function).
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

    // Handle simple literal cases without parsing overhead
    if (sanitizedExpression === 'true') return true;
    if (sanitizedExpression === 'false') return false;

    // Create evaluation context (uses pool when pooling is enabled)
    const evalContext = this.createEvaluationContext(context);

    try {
      const tokens = this.getTokens(sanitizedExpression, expression);
      const parser = new SafeParser(tokens, evalContext);
      const result = !!parser.evaluate();
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

  /** Return cached token array for expression, tokenizing and caching if needed. */
  private getTokens(sanitizedExpression: string, originalExpression: string): Token[] {
    let tokens = this.tokenCache.get(sanitizedExpression);
    if (!tokens) {
      try {
        tokens = tokenizeExpression(sanitizedExpression);
      } catch (error) {
        throw new ConditionEvaluationError(
          `Invalid expression syntax: ${originalExpression}`,
          originalExpression,
          error instanceof Error ? error : new Error(String(error))
        );
      }
      if (this.tokenCache.size >= this.maxCacheSize) {
        const firstKey = this.tokenCache.keys().next().value;
        if (firstKey) this.tokenCache.delete(firstKey);
      }
      this.tokenCache.set(sanitizedExpression, tokens);
    }
    return tokens;
  }

  /**
   * Sanitize expression to prevent code injection (defense-in-depth layer).
   * The safe parser already rejects non-whitelisted identifiers; this check
   * provides an early, explicit rejection with a clearer error message.
   */
  private sanitizeExpression(expression: string): string {
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
      const sanitized = this.sanitizeExpression(expression);
      // Attempt to tokenize and parse with a dummy context to detect syntax errors
      const tokens = tokenizeExpression(sanitized);
      const dummyCtx = {
        flags: {} as Record<string, unknown>,
        state: { currentNodeId: '', flags: {} as Record<string, unknown>, history: [] as string[] },
        timestamp: 0,
        customData: undefined,
      };
      const parser = new SafeParser(tokens, dummyCtx);
      parser.evaluate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
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
