# Advanced Branching Guide

Welcome to the QNCE Engine Advanced Branching System! This guide covers the powerful branching capabilities that enable dynamic, AI-driven interactive narratives.

## 🌿 Overview

The QNCE Branching System allows you to create sophisticated narrative experiences with:

- **Dynamic Branch Management**: Insert, remove, and modify story paths at runtime
- **AI-Driven Content**: Generate dialogue and narrative content based on player context
- **Advanced Analytics**: Track player behavior and optimize story flow
- **Performance Optimization**: Enterprise-grade performance for large stories
- **Conditional Logic**: Complex branching based on flags, player history, and external data

## 🎯 Core Concepts

### Platform Data Model (PDM)

The PDM defines the structure for advanced branching:

```typescript
interface QNCEStory {
  id: string;
  title: string;
  version: string;
  metadata: StoryMetadata;
  branchingConfig: BranchingConfig;
  chapters: Chapter[];
  aiContext?: AIContext;
}

interface BranchingConfig {
  maxActiveBranches: number;
  branchCacheSize: number;
  enableDynamicInsertion: boolean;
  enableAnalytics: boolean;
  performanceMode: boolean;
}
```

### Branching Architecture

```
Story
├── Chapters (Organized narrative sections)
│   ├── Flows (Independent narrative streams)
│   │   ├── Nodes (Story moments)
│   │   └── Branches (Dynamic paths)
│   └── Analytics (Player behavior tracking)
└── AI Context (Dynamic content generation)
```

## 🚀 Quick Start with Branching

### Basic Branching Setup

```typescript
import { createQNCEEngine, QNCEStory } from 'qnce-engine';

const branchingStory: QNCEStory = {
  id: 'adventure-quest',
  title: 'The Adventure Quest',
  version: '1.0.0',
  metadata: {
    author: 'Your Name',
    description: 'An adventure with dynamic branching',
    tags: ['adventure', 'dynamic'],
    createDate: new Date(),
    lastModified: new Date(),
    estimatedPlaytime: 30
  },
  branchingConfig: {
    maxActiveBranches: 5,
    branchCacheSize: 20,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: true
  },
  chapters: [
    {
      id: 'forest-entrance',
      title: 'The Dark Forest',
      description: 'Entry into a mysterious forest',
      flows: [
        {
          id: 'main-path',
          name: 'Forest Path',
          description: 'The main forest journey',
          nodes: [
            {
              id: 'forest-edge',
              text: 'You stand at the edge of a dark forest. Shadows dance between the trees.',
              choices: [
                {
                  text: 'Enter the forest boldly',
                  nextNodeId: 'bold-entry',
                  flagEffects: { courage: 1, bold_approach: true },
                  conditions: []
                },
                {
                  text: 'Proceed cautiously',
                  nextNodeId: 'cautious-entry',
                  flagEffects: { caution: 1, careful_approach: true },
                  conditions: []
                }
              ]
            },
            {
              id: 'bold-entry',
              text: 'You stride confidently into the forest. Your boldness attracts attention...',
              choices: [
                {
                  text: 'Face whatever comes',
                  nextNodeId: 'encounter',
                  flagEffects: { bravery: 2 },
                  conditions: []
                }
              ]
            },
            {
              id: 'cautious-entry',
              text: 'You carefully step into the forest, watching for danger. Your caution serves you well.',
              choices: [
                {
                  text: 'Continue carefully',
                  nextNodeId: 'safe-path',
                  flagEffects: { wisdom: 2 },
                  conditions: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Create engine with branching enabled
const engine = createQNCEEngine(branchingStory, {
  enableBranching: true,
  performanceMode: true
});
```

## 🤖 AI Integration

### Setting Up AI Context

AI Context provides rich information for dynamic content generation:

```typescript
interface AIContext {
  playerProfile: PlayerProfile;
  storyThemes: string[];
  currentMood: string;
  recentChoices: string[];
  preferredStyle: string;
  difficultyLevel: string;
  customData?: Record<string, any>;
}

// Configure AI context
const aiContext: AIContext = {
  playerProfile: {
    name: 'Alex',
    preferences: ['adventure', 'mystery', 'character-development'],
    playStyle: 'explorer', // explorer, achiever, socializer, killer
    experience: 'intermediate'
  },
  storyThemes: ['heroic-journey', 'moral-choices', 'friendship'],
  currentMood: 'curious',
  recentChoices: ['bold-entry', 'face-whatever-comes'],
  preferredStyle: 'immersive',
  difficultyLevel: 'medium'
};

// Apply AI context to engine
engine.setAIContext(aiContext);
```

### Dynamic Content Generation

```typescript
// Generate AI-driven branches
const dynamicBranches = await engine.generateAIBranches({
  sourceNodeId: 'encounter',
  maxBranches: 3,
  themes: ['conflict-resolution', 'character-growth'],
  constraints: {
    minLength: 50,
    maxLength: 200,
    tone: 'adventurous',
    complexity: 'medium'
  }
});

// Insert generated branches
for (const branch of dynamicBranches) {
  engine.insertBranch(branch);
}
```

### AI-Generated Dialogue

```typescript
// Generate contextual dialogue
const dialogue = await engine.generateDialogue({
  speaker: 'mysterious-stranger',
  context: 'forest-encounter',
  playerFlags: engine.getFlags(),
  mood: 'mysterious',
  intent: 'provide-guidance'
});

// Insert dialogue as new node
engine.insertNode({
  id: 'ai-dialogue',
  text: dialogue.text,
  choices: dialogue.suggestedChoices,
  aiGenerated: true,
  generationMetadata: dialogue.metadata
});
```

## 📊 Advanced Branching Features

### Dynamic Branch Management

```typescript
// Insert new branch at runtime
engine.insertBranch({
  id: 'emergency-escape',
  sourceNodeId: 'dangerous-situation',
  targetNodeId: 'safety',
  condition: 'flags.danger_level > 5',
  text: 'Look for an emergency escape route',
  flagEffects: { quick_thinking: 1 },
  isTemporary: true, // Auto-remove after use
  priority: 'high'
});

// Remove branch dynamically
engine.removeBranch('old-branch-id');

// Modify existing branch
engine.modifyBranch('existing-branch', {
  text: 'Updated choice text',
  flagEffects: { updated_choice: true }
});
```

### Conditional Branching

```typescript
// Complex conditions for branch availability
const advancedChoice = {
  text: 'Use your magical knowledge',
  nextNodeId: 'magic-solution',
  conditions: [
    {
      type: 'flag',
      operator: 'greater_than',
      key: 'magic_skill',
      value: 3
    },
    {
      type: 'and',
      conditions: [
        { type: 'flag', operator: 'equals', key: 'has_spellbook', value: true },
        { type: 'flag', operator: 'not_equals', key: 'magic_exhausted', value: true }
      ]
    }
  ],
  flagEffects: { magic_used: true, mana: -2 }
};
```

### Time-Based Branching

```typescript
// Branches that appear/disappear based on time
const timeConstrainedChoice = {
  text: 'Quick! Jump across the chasm!',
  nextNodeId: 'successful-jump',
  conditions: [
    {
      type: 'time_limit',
      seconds: 10,
      startEvent: 'chasm-discovered'
    }
  ],
  onTimeout: {
    nextNodeId: 'missed-opportunity',
    flagEffects: { missed_jump: true }
  }
};
```

## 📈 Analytics and Tracking

### Player Behavior Analytics

```typescript
// Enable analytics tracking
engine.enableAnalytics({
  trackChoicePatterns: true,
  trackPlaytime: true,
  trackBranchUsage: true,
  trackPlayerProgress: true
});

// Get analytics data
const analytics = engine.getAnalytics();
console.log('Choice patterns:', analytics.choicePatterns);
console.log('Popular branches:', analytics.popularBranches);
console.log('Average playtime:', analytics.averagePlaytime);
console.log('Completion rate:', analytics.completionRate);
```

### Real-time Performance Monitoring

```typescript
// Monitor branching performance
engine.on('branchingPerformance', (data) => {
  console.log('Branch generation time:', data.generationTime);
  console.log('Cache hit rate:', data.cacheHitRate);
  console.log('Active branches:', data.activeBranches);
});

// Performance optimization
if (analytics.activeBranches > branchingConfig.maxActiveBranches) {
  engine.optimizeBranches(); // Automatically clean up unused branches
}
```

## 🔧 Advanced Configuration

### Performance Tuning for Large Stories

```typescript
const performanceConfig = {
  enableBranching: true,
  performanceMode: true,
  branchingOptions: {
    maxActiveBranches: 10,        // Limit concurrent branches
    branchCacheSize: 50,          // Cache frequently accessed branches
    backgroundProcessing: true,    // Process analytics in background
    preloadStrategy: 'adaptive',   // Smart preloading based on player patterns
    garbageCollection: 'aggressive' // Clean up unused branches quickly
  }
};

const engine = createQNCEEngine(story, performanceConfig);
```

### Multi-Threading for Large Narratives

```typescript
// Enable background processing for complex operations
engine.enableBackgroundProcessing({
  aiGeneration: true,        // Generate AI content in background
  analyticsProcessing: true, // Process analytics data in background
  cachePreloading: true,     // Preload likely branches
  performanceMonitoring: true // Monitor performance metrics
});
```

## 🎮 Real-World Examples

### Interactive RPG Dialogue System

```typescript
const rpgDialogueSystem = {
  // Character relationship tracking
  characterRelations: {
    'guild-master': { trust: 5, respect: 3, friendship: 2 },
    'mysterious-trader': { suspicion: 7, curiosity: 4 }
  },
  
  // Dynamic dialogue generation
  generateDialogue: async (character: string, context: string) => {
    const relation = characterRelations[character];
    const aiContext = {
      character,
      context,
      playerReputation: engine.getFlags().reputation || 0,
      relationship: relation,
      recentEvents: engine.getRecentEvents()
    };
    
    return await engine.generateDialogue(aiContext);
  }
};
```

### Adaptive Learning Content

```typescript
const educationalStory = {
  // Adapt difficulty based on player performance
  adaptDifficulty: () => {
    const performance = engine.getAnalytics().correctAnswers / engine.getAnalytics().totalQuestions;
    
    if (performance > 0.8) {
      engine.setDifficultyLevel('hard');
      engine.insertAdvancedChallenges();
    } else if (performance < 0.4) {
      engine.setDifficultyLevel('easy');
      engine.insertHelpfulHints();
    }
  },
  
  // Personalized learning paths
  generateLearningPath: async (studentProfile) => {
    const branches = await engine.generateAIBranches({
      context: 'educational',
      studentLevel: studentProfile.level,
      learningStyle: studentProfile.preferredStyle,
      weakAreas: studentProfile.strugglingTopics
    });
    
    return branches;
  }
};
```

### Multiplayer Narrative Synchronization

```typescript
const multiplayerBranching = {
  // Synchronize story state across players
  syncPlayers: async (playerStates: PlayerState[]) => {
    const consensusChoices = await engine.analyzeGroupChoices(playerStates);
    
    // Generate collaborative branches
    const collaborativeBranches = await engine.generateCollaborativeBranches({
      playerChoices: consensusChoices,
      groupDynamics: analyzeGroupDynamics(playerStates),
      sharedObjectives: findSharedObjectives(playerStates)
    });
    
    // Apply to all player engines
    for (const branch of collaborativeBranches) {
      for (const playerEngine of playerEngines) {
        playerEngine.insertBranch(branch);
      }
    }
  }
};
```

## 🛠️ Debugging and Testing

### Branch Validation

```typescript
// Validate story structure
const validation = engine.validateBranchingStructure();
if (!validation.isValid) {
  console.error('Branching issues found:', validation.issues);
  
  // Auto-fix common issues
  engine.autoFixBranchingIssues(validation.issues);
}
```

### Testing Branching Logic

```typescript
// Test all possible paths
const pathTester = engine.createPathTester();

// Test specific scenarios
pathTester.testScenario('player-aggressive', {
  flags: { aggression: 10, diplomacy: 2 },
  choices: ['attack', 'intimidate', 'demand']
});

pathTester.testScenario('player-diplomatic', {
  flags: { aggression: 2, diplomacy: 10 },
  choices: ['negotiate', 'compromise', 'befriend']
});

// Generate coverage report
const coverage = pathTester.generateCoverageReport();
console.log(`Branch coverage: ${coverage.percentage}%`);
```

## 📚 Migration from Basic Stories

### Converting Simple Stories to Branching Format

```typescript
// Helper function to convert basic story to branching format
function migrateToBranching(basicStory: BasicQNCEStory): QNCEStory {
  return {
    id: basicStory.id || 'migrated-story',
    title: basicStory.title || 'Migrated Story',
    version: '1.0.0',
    metadata: {
      author: 'Migrated',
      description: 'Converted from basic format',
      tags: ['migrated'],
      createDate: new Date(),
      lastModified: new Date(),
      estimatedPlaytime: 15
    },
    branchingConfig: {
      maxActiveBranches: 5,
      branchCacheSize: 15,
      enableDynamicInsertion: false, // Start simple
      enableAnalytics: true,
      performanceMode: true
    },
    chapters: convertNodesToChapters(basicStory.nodes)
  };
}
```

## 🔗 Best Practices

### Performance Optimization

1. **Limit Active Branches**: Keep `maxActiveBranches` reasonable (5-10 for most cases)
2. **Use Caching**: Enable branch caching for frequently accessed content
3. **Background Processing**: Enable for AI generation and analytics
4. **Garbage Collection**: Regularly clean up unused branches

### Content Quality

1. **Consistent Tone**: Maintain narrative voice across AI-generated content
2. **Player Agency**: Ensure meaningful choices that impact the story
3. **Balanced Complexity**: Don't overwhelm players with too many branches
4. **Testing**: Thoroughly test all branching scenarios

### AI Integration

1. **Rich Context**: Provide detailed context for better AI generation
2. **Quality Control**: Review and filter AI-generated content
3. **Fallback Content**: Always have manual fallback content ready
4. **Player Feedback**: Use analytics to improve AI generation quality

---

<div align="center">

**Ready for advanced narrative branching?**

[Performance Tuning →](Performance-Tuning) | [API Reference →](API-Reference) | [Examples →](https://github.com/ByteSower/qnce-engine/tree/main/examples)

*Built with ❤️ by the QNCE development team*

</div>

---

## 📍 Wiki Navigation

**← Previous:** [Getting Started](Getting-Started) | **You are here:** Branching Guide | **Next:** [Performance Tuning →](Performance-Tuning)

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • **Branching Guide** • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • [Contributing](Contributing) • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.2.3 with advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
