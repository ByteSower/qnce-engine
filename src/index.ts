// QNCE Engine - Main Export
export * from './engine/core.js';
export { DEMO_STORY } from './engine/demo-story.js';

// Sprint 3.4: Conditional choice display exports
export * from './engine/condition.js';

// Sprint 3.5: React integration for autosave/undo functionality
export * from './integrations/react.js';

// Sprint 3.6: UI Components
export * from './ui/index.js';

// Re-export for convenience
export {
  QNCEEngine,
  createQNCEEngine,
  loadStoryData,
  type Choice,
  type NarrativeNode,
  type QNCEState,
  type StoryData
} from './engine/core.js';

// Sprint 3.4: Conditional choice types
export {
  ConditionEvaluator,
  ConditionEvaluationError,
  conditionEvaluator,
  type ConditionContext,
  type CustomEvaluatorFunction
} from './engine/condition.js';

// Sprint 4.1: Telemetry primitives (experimental)
/** @experimental */
export type { QEvent, Telemetry, TelemetryAdapter, TelemetryOptions } from './telemetry/types.js';
/** @experimental */
export { createTelemetry, createTelemetryAdapter, ConsoleAdapter, FileAdapter } from './telemetry/core.js';
