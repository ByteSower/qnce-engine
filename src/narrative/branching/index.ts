// QNCE Branching System - Main Export
// Sprint #3 - Advanced Narrative & AI Integration

// Core branching engine
export { QNCEBranchingEngine, createBranchingEngine } from './engine-simple';

// Complete type system
export * from './models';

// Usage example for documentation
export const example = {
  // Example story structure showing branching capabilities
  storyStructure: {
    story: 'QNCEStory with chapters and branching config',
    chapters: 'Logical groupings of flows and branch points',
    flows: 'Sequences of narrative nodes with entry/exit points',
    branches: 'Dynamic decision points with conditions and options'
  },
  
  // Example API usage
  usage: `
    import { createBranchingEngine, QNCEStory } from 'qnce-engine/branching';
    
    // Create branching engine
    const engine = createBranchingEngine(story, initialState);
    
    // Evaluate available branches
    const options = await engine.evaluateAvailableBranches();
    
    // Execute player choice
    await engine.executeBranch(selectedOptionId);
    
    // Dynamic content insertion
    await engine.insertDynamicBranch(branchOperation);
    
    // AI-driven content generation
    engine.setAIContext(aiContext);
    const aiBranches = await engine.generateAIBranches();
  `
};
