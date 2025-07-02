# QNCE Branching System - Platform Data Model (PDM) Specification

**Sprint #3 - Advanced Narrative & AI Integration**  
**Version:** 1.0.0  
**Date:** July 2, 2025  
**Owner:** Body (VS Code Agent)  
**Reviewers:** Brain (Copilot), ByteSower (Bull)

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Entity Definitions](#entity-definitions)
4. [Data Relationships](#data-relationships)
5. [Performance Considerations](#performance-considerations)
6. [AI Integration Points](#ai-integration-points)
7. [Usage Examples](#usage-examples)
8. [Migration Guide](#migration-guide)

## Overview

The QNCE Branching System PDM defines the data structures and relationships needed to support dynamic narrative branching, AI-driven content generation, and real-time story modification. Built on Sprint #2's performance infrastructure, this PDM enables complex, interconnected narratives with enterprise-grade performance.

### Key Capabilities

- **Dynamic Branching**: Runtime insertion, removal, and modification of narrative paths
- **AI Integration**: Rich context for procedural dialogue and content generation
- **Performance Optimization**: Built on object pooling and profiling infrastructure
- **Analytics Support**: Comprehensive tracking of player behavior and story flow
- **Modular Design**: Clean separation of concerns for maintainable code

## Design Principles

### 1. Performance-First Architecture
- All entities support object pooling from Sprint #2
- Minimal memory allocations during runtime
- Efficient data structures for frequent operations
- Background processing for analytics and caching

### 2. AI Integration Ready
- Rich context interfaces for AI systems
- Extensible generation hints and constraints
- Player profiling for personalized experiences
- Content quality tracking and feedback loops

### 3. Developer Experience
- Clear entity hierarchies and relationships
- Type-safe interfaces with comprehensive documentation
- Debugging-friendly data structures
- Migration paths from existing story formats

### 4. Scalability & Modularity
- Support for large, complex narratives
- Chapter-based organization for memory efficiency
- Dynamic loading and unloading of story content
- Plugin architecture for custom branching logic

## Entity Definitions

### Core Story Structure

#### QNCEStory
Top-level container for all narrative content with branching metadata.

```typescript
interface QNCEStory {
  id: string;                    // Unique story identifier
  title: string;                 // Human-readable story title
  version: string;               // Semantic version (e.g., "1.2.3")
  metadata: StoryMetadata;       // Author, description, creation info
  chapters: Chapter[];           // Ordered list of story chapters
  branchingConfig: BranchingConfig; // Performance and behavior settings
}
```

**Key Features:**
- Versioning support for iterative development
- Configurable branching behavior per story
- Metadata for discovery and organization

#### Chapter
Logical grouping of narrative flows with branching points.

```typescript
interface Chapter {
  id: string;                    // Unique chapter identifier
  title: string;                 // Chapter title for navigation
  description?: string;          // Optional chapter summary
  flows: NarrativeFlow[];        // Available narrative flows
  branches: BranchPoint[];       // Dynamic branching logic
  prerequisites?: ChapterPrerequisites; // Access requirements
  metadata: ChapterMetadata;     // Difficulty, themes, duration
}
```

**Key Features:**
- Prerequisites for gated content progression
- Metadata for AI-driven content selection
- Flexible flow organization

#### NarrativeFlow
Sequence of connected nodes with defined entry/exit points.

```typescript
interface NarrativeFlow {
  id: string;                    // Unique flow identifier
  name: string;                  // Flow name for debugging
  description?: string;          // Optional flow summary
  nodes: NarrativeNode[];        // Ordered narrative nodes
  entryPoints: FlowEntryPoint[]; // Ways to enter this flow
  exitPoints: FlowExitPoint[];   // Ways to exit this flow
  flowType: FlowType;            // 'linear' | 'branching' | 'conditional' | 'procedural'
  metadata: FlowMetadata;        // Complexity, timing, AI flags
}
```

**Key Features:**
- Multiple entry/exit points for complex branching
- Type classification for AI optimization
- Performance metadata for analytics

### Branching Logic

#### BranchPoint
Dynamic branching logic between flows with runtime modification support.

```typescript
interface BranchPoint {
  id: string;                    // Unique branch identifier
  name: string;                  // Branch name for debugging
  sourceFlowId: string;          // Origin flow
  sourceNodeId: string;          // Specific trigger node
  branchOptions: BranchOption[]; // Available branch paths
  branchType: BranchType;        // How branching is determined
  conditions?: BranchCondition[]; // Global branch conditions
  metadata: BranchMetadata;      // Usage analytics and preferences
}
```

**Key Features:**
- Multiple branching strategies (choice, flag, time, procedural)
- Runtime condition evaluation
- Analytics for optimization

#### BranchOption
Individual branching path with conditions and effects.

```typescript
interface BranchOption {
  id: string;                    // Unique option identifier
  targetFlowId: string;          // Destination flow
  targetNodeId?: string;         // Specific entry point (optional)
  displayText: string;           // Player-facing text
  conditions?: BranchCondition[]; // Availability conditions
  flagEffects?: Record<string, unknown>; // State changes
  weight: number;                // For procedural selection
}
```

### Runtime Context

#### BranchContext
Complete runtime state for branch evaluation and tracking.

```typescript
interface BranchContext {
  currentStory: QNCEStory;       // Active story
  currentChapter: Chapter;       // Current chapter
  currentFlow: NarrativeFlow;    // Active flow
  activeState: QNCEState;        // Engine state
  branchHistory: BranchHistoryEntry[]; // Decision history
  pendingBranches: PendingBranch[]; // Deferred branches
  analytics: BranchAnalytics;    // Performance metrics
}
```

**Key Features:**
- Complete context for AI decision making
- History tracking for complex narrative dependencies
- Real-time analytics collection

## Data Relationships

### Hierarchical Structure
```
QNCEStory
├── Chapter (1..*)
│   ├── NarrativeFlow (1..*)
│   │   ├── NarrativeNode (1..*)
│   │   ├── FlowEntryPoint (0..*)
│   │   └── FlowExitPoint (0..*)
│   └── BranchPoint (0..*)
│       └── BranchOption (1..*)
└── BranchingConfig
```

### Cross-References
- **BranchPoint.sourceFlowId** → **NarrativeFlow.id**
- **BranchOption.targetFlowId** → **NarrativeFlow.id**
- **FlowEntryPoint.nodeId** → **NarrativeNode.id**
- **FlowExitPoint.nodeId** → **NarrativeNode.id**

### Runtime Associations
- **BranchContext** maintains references to active entities
- **BranchHistory** links to **BranchPoint** and **BranchOption**
- **PendingBranch** references **BranchPoint** for deferred execution

## Performance Considerations

### Object Pooling Integration

All frequently-created entities support object pooling:

```typescript
interface PooledBranchContext extends BranchContext {
  poolId: string;                // Pool identifier
  acquisitionTime: number;       // Performance tracking
  maxLifetime: number;           // Auto-cleanup threshold
}
```

### Memory Management

- **Chapter-based loading**: Only active chapters kept in memory
- **Flow caching**: LRU cache for recently accessed flows
- **Branch pruning**: Remove unused branches after timeout
- **Analytics batching**: Batch analytics writes to reduce overhead

### Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Branch evaluation | <5ms | 95th percentile |
| Flow transition | <10ms | Average |
| Dynamic insertion | <20ms | 95th percentile |
| Analytics update | <1ms | Average |

## AI Integration Points

### Content Generation Context

The PDM provides rich context for AI systems:

```typescript
interface AIBranchingContext {
  playerProfile: PlayerProfile;     // Behavioral patterns
  narrativeContext: NarrativeContext; // Story state
  generationHints: AIGenerationHints; // Constraints
}
```

### Player Profiling

```typescript
interface PlayerProfile {
  playStyle: 'explorer' | 'achiever' | 'socializer' | 'killer';
  preferences: Record<string, number>; // Weighted preferences
  historicalChoices: string[];         // Past decisions
  averageDecisionTime: number;         // Behavioral metric
}
```

### Dynamic Content Integration

- **Procedural flows**: AI-generated narrative sequences
- **Dynamic options**: Context-aware branch generation
- **Adaptive difficulty**: AI-driven complexity adjustment
- **Content quality**: Feedback loops for improvement

## Usage Examples

### 1. Basic Story Structure

```typescript
const story: QNCEStory = {
  id: "cyberpunk-heist",
  title: "Neon Shadows",
  version: "1.0.0",
  metadata: {
    author: "ByteSower",
    description: "A cyberpunk heist story with AI companions",
    tags: ["cyberpunk", "heist", "ai"],
    createDate: new Date("2025-07-01"),
    lastModified: new Date("2025-07-02"),
    estimatedPlaytime: 45
  },
  chapters: [
    {
      id: "chapter-1-planning",
      title: "The Planning Phase",
      flows: [
        {
          id: "flow-intro",
          name: "Introduction",
          nodes: [/* ... */],
          entryPoints: [{ id: "start", nodeId: "intro-1", priority: 1 }],
          exitPoints: [{ id: "to-team", nodeId: "intro-final" }],
          flowType: "linear",
          metadata: { complexity: 2, avgCompletionTime: 300000 }
        }
      ],
      branches: [
        {
          id: "team-selection",
          name: "Choose Your Team",
          sourceFlowId: "flow-intro",
          sourceNodeId: "intro-final",
          branchType: "choice-driven",
          branchOptions: [
            {
              id: "tech-specialist",
              targetFlowId: "flow-tech-path",
              displayText: "Recruit the tech specialist",
              weight: 1.0
            },
            {
              id: "social-engineer",
              targetFlowId: "flow-social-path", 
              displayText: "Recruit the social engineer",
              weight: 1.0
            }
          ],
          metadata: { usageCount: 0, avgTraversalTime: 0 }
        }
      ],
      metadata: { difficulty: "medium", themes: ["planning"] }
    }
  ],
  branchingConfig: {
    maxActiveBranches: 10,
    branchCacheSize: 50,
    enableDynamicInsertion: true,
    enableAnalytics: true,
    performanceMode: true
  }
};
```

### 2. Dynamic Branch Insertion

```typescript
const dynamicBranch: DynamicBranchOperation = {
  type: "insert",
  branchId: "emergency-exit",
  targetLocation: {
    chapterId: "chapter-1-planning",
    flowId: "flow-tech-path",
    nodeId: "tech-decision-point",
    insertionPoint: "after"
  },
  payload: {
    id: "emergency-exit",
    name: "Emergency Exit Option",
    sourceFlowId: "flow-tech-path",
    sourceNodeId: "tech-decision-point",
    branchType: "conditional",
    branchOptions: [{
      id: "abort-mission",
      targetFlowId: "flow-abort-sequence",
      displayText: "Abort the mission",
      conditions: [
        { type: "flag", operator: "equals", key: "danger_level", value: "high" }
      ],
      weight: 0.5
    }]
  },
  conditions: [
    { type: "flag", operator: "greater", key: "tension", value: 0.8 }
  ]
};
```

### 3. AI-Driven Content Generation

```typescript
const aiContext: AIBranchingContext = {
  playerProfile: {
    playStyle: "explorer",
    preferences: { "dialogue": 0.8, "action": 0.3, "puzzle": 0.6 },
    historicalChoices: ["investigate", "ask-questions", "explore-optional"],
    averageDecisionTime: 12000
  },
  narrativeContext: {
    currentTone: "mysterious",
    thematicElements: ["betrayal", "discovery", "technology"],
    characterRelationships: { "ally-1": 0.7, "mentor": 0.9 },
    plotTension: 0.6
  },
  generationHints: {
    maxBranchDepth: 3,
    desiredComplexity: 7,
    contentThemes: ["investigation", "character-development"],
    avoidElements: ["violence", "time-pressure"]
  }
};
```

## Migration Guide

### From Sprint #2 Core to Sprint #3 Branching

1. **Story Data Format**:
   - Wrap existing `StoryData` in `QNCEStory` structure
   - Organize nodes into `NarrativeFlow` entities
   - Group flows into logical `Chapter` divisions

2. **Choice Enhancement**:
   - Convert simple choices to `BranchOption` entities
   - Add conditions for complex choice logic
   - Implement weight-based selection for AI

3. **State Integration**:
   - Extend `QNCEState` with branching context
   - Add analytics tracking to existing workflows
   - Integrate with object pooling for performance

### Backward Compatibility

The PDM maintains compatibility with existing QNCE engines:

- **Legacy node format**: Direct mapping to `NarrativeNode`
- **Simple choices**: Automatic conversion to `BranchOption`
- **Existing state**: Seamless integration with `BranchContext`

## Conclusion

This PDM provides a comprehensive foundation for Sprint #3's advanced narrative features while maintaining the performance optimizations from Sprint #2. The design supports:

- ✅ **Dynamic Branching**: Runtime story modification
- ✅ **AI Integration**: Rich context for content generation  
- ✅ **Performance**: Built on proven optimization infrastructure
- ✅ **Analytics**: Comprehensive player behavior tracking
- ✅ **Scalability**: Support for complex, large-scale narratives

The next step is to implement the **Branching API** that operates on this PDM, providing the runtime functionality needed for the complete Sprint #3 feature set.

---

**Next Actions:**
1. **Brain Review**: Architectural alignment and performance considerations
2. **ByteSower Validation**: Use case coverage and content creator workflow  
3. **Implementation**: Build the Branching API on this PDM foundation
4. **Testing**: Comprehensive test suite for all entity relationships
