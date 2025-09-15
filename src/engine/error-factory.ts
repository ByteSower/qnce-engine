// Structured error factory for QNCE Engine
// Provides normalized creation utilities so all engine subsystems emit consistent error metadata.
import { QNCEError } from './errors';

/** @public */
export type QNCEErrorKind =
  | 'navigation'
  | 'choice-validation'
  | 'story-data'
  | 'state'
  | 'hook'
  | 'condition'
  | 'persistence'
  | 'telemetry'
  | 'adapter'
  | 'unknown';

/** Hook execution stage for errors arising inside hooks */
/** @public */
export type HookStage = 'pre-choice' | 'post-choice';

/** Standardized context captured with every structured error */
/** @public */
export interface QNCEErrorContext {
  storyId?: string;
  nodeId?: string;
  fromNodeId?: string;
  toNodeId?: string;
  choiceText?: string;
  hookStage?: HookStage;
  adapter?: string; // storage or story adapter id/type
  operation?: string; // e.g. 'loadState', 'save', 'evaluateCondition'
  conditionExpression?: string;
  flagKey?: string;
  flagValue?: unknown;
  serialized?: boolean;
  retryable?: boolean;
  cause?: unknown; // original error object
  [extra: string]: unknown; // extension surface
}

/** Shape returned by factory functions */
/** @public */
export interface StructuredQNCEError {
  error: QNCEError;              // Rich Error subclass instance
  kind: QNCEErrorKind;           // Normalized category
  code: string;                  // Machine-readable code (SCREAMING_SNAKE)
  message: string;               // Human message
  timestamp: number;             // High resolution timestamp (ms since process start)
  context: QNCEErrorContext;     // Additional diagnostic context
}

/** Mapping from kind to canonical error code */
const KIND_CODE_MAP: Record<QNCEErrorKind, string> = {
  navigation: 'NAVIGATION_ERROR',
  'choice-validation': 'CHOICE_VALIDATION_ERROR',
  'story-data': 'STORY_DATA_ERROR',
  state: 'STATE_ERROR',
  hook: 'HOOK_ERROR',
  condition: 'CONDITION_ERROR',
  persistence: 'PERSISTENCE_ERROR',
  telemetry: 'TELEMETRY_ERROR',
  adapter: 'ADAPTER_ERROR',
  unknown: 'UNKNOWN_ERROR'
};

/**
 * Core factory – always returns a StructuredQNCEError.
 * Prefer this over direct `new QNCEError` when emitting from engine internals.
 * @public
 */
export function createStructuredError(kind: QNCEErrorKind, message: string, context: QNCEErrorContext = {}): StructuredQNCEError {
  const code = KIND_CODE_MAP[kind] || KIND_CODE_MAP.unknown;
  const meta = { kind, ...context } as Record<string, unknown>;
  const err = new QNCEError(message, code, meta);
  return {
    error: err,
    kind,
    code,
    message: err.message,
    timestamp: err.timestamp,
    context
  };
}

/**
 * Convenience helpers by category
 * @public
 */
export const ErrorFactory = {
  navigation: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('navigation', msg, ctx),
  choiceValidation: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('choice-validation', msg, ctx),
  storyData: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('story-data', msg, ctx),
  state: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('state', msg, ctx),
  hook: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('hook', msg, ctx),
  condition: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('condition', msg, ctx),
  persistence: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('persistence', msg, ctx),
  telemetry: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('telemetry', msg, ctx),
  adapter: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('adapter', msg, ctx),
  unknown: (msg: string, ctx?: QNCEErrorContext) => createStructuredError('unknown', msg, ctx)
};

/** Serialize a structured error into a safe plain object for logging or transport */
/** @public */
export function serializeStructuredError(struct: StructuredQNCEError) {
  return {
    code: struct.code,
    kind: struct.kind,
    message: struct.message,
    timestamp: struct.timestamp,
    context: { ...struct.context, cause: undefined }, // do not deep serialize cause
    stack: struct.error.stack
  };
}

/** Try to unwrap unknown thrown values into a structured error (best effort) */
/** @public */
export function toStructuredError(input: unknown, fallbackMessage = 'Unhandled error'): StructuredQNCEError {
  if (input instanceof QNCEError) {
    return {
      error: input,
      kind: (input.metadata?.kind as QNCEErrorKind) || 'unknown',
      code: input.errorCode,
      message: input.message,
      timestamp: input.timestamp,
      context: (input.metadata as QNCEErrorContext) || {}
    };
  }
  if (input instanceof Error) {
    return createStructuredError('unknown', input.message || fallbackMessage, { cause: input });
  }
  return createStructuredError('unknown', fallbackMessage, { cause: input });
}
