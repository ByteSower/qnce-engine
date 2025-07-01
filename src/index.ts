// QNCE Engine - Main Export
export * from './engine/core.js';
export { DEMO_STORY } from './engine/demo-story.js';

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
