# QNCE Branching System - Entity Relationship Diagram

## Story Structure Hierarchy

```mermaid
erDiagram
    QNCEStory ||--o{ Chapter : "contains"
    QNCEStory {
        string id PK
        string title
        string version
        StoryMetadata metadata
        BranchingConfig branchingConfig
    }
    
    Chapter ||--o{ NarrativeFlow : "contains"
    Chapter ||--o{ BranchPoint : "defines"
    Chapter {
        string id PK
        string title
        string description
        ChapterPrerequisites prerequisites
        ChapterMetadata metadata
    }
    
    NarrativeFlow ||--o{ NarrativeNode : "contains"
    NarrativeFlow ||--o{ FlowEntryPoint : "has"
    NarrativeFlow ||--o{ FlowExitPoint : "has"
    NarrativeFlow {
        string id PK
        string name
        string description
        FlowType flowType
        FlowMetadata metadata
    }
    
    BranchPoint ||--o{ BranchOption : "offers"
    BranchPoint ||--o{ BranchCondition : "evaluates"
    BranchPoint {
        string id PK
        string name
        string sourceFlowId FK
        string sourceNodeId FK
        BranchType branchType
        BranchMetadata metadata
    }
    
    BranchOption ||--o{ BranchCondition : "requires"
    BranchOption {
        string id PK
        string targetFlowId FK
        string targetNodeId FK
        string displayText
        number weight
        Record flagEffects
    }
```

## Runtime Context & State Management

```mermaid
erDiagram
    BranchContext ||--|| QNCEStory : "references"
    BranchContext ||--|| Chapter : "current"
    BranchContext ||--|| NarrativeFlow : "active"
    BranchContext ||--|| QNCEState : "maintains"
    BranchContext ||--o{ BranchHistoryEntry : "tracks"
    BranchContext ||--o{ PendingBranch : "manages"
    BranchContext ||--|| BranchAnalytics : "collects"
    
    BranchContext {
        QNCEStory currentStory
        Chapter currentChapter
        NarrativeFlow currentFlow
        QNCEState activeState
        BranchAnalytics analytics
    }
    
    BranchHistoryEntry {
        string id PK
        string branchPointId FK
        string chosenOptionId FK
        Date timestamp
        number executionTime
        Partial-QNCEState context
    }
    
    PendingBranch {
        string id PK
        string branchPointId FK
        BranchCondition[] triggerConditions
        number timeoutMs
        Date createdAt
    }
    
    BranchAnalytics {
        number totalBranchesTraversed
        number avgBranchDecisionTime
        string[] mostPopularBranches
        string[] abandonmentPoints
        number completionRate
        Date sessionStartTime
    }
```

## Dynamic Branching Operations

```mermaid
erDiagram
    DynamicBranchOperation ||--|| BranchLocation : "targets"
    DynamicBranchOperation ||--o{ BranchCondition : "requires"
    DynamicBranchOperation {
        string type
        string branchId FK
        BranchLocation targetLocation
        Partial-BranchPoint payload
    }
    
    BranchLocation {
        string chapterId FK
        string flowId FK
        string nodeId FK
        string insertionPoint
    }
    
    DynamicFlowOperation ||--o{ BranchCondition : "has"
    DynamicFlowOperation {
        string type
        string flowId FK
        string targetChapterId FK
        NarrativeFlow flow
    }
```

## Performance & Object Pooling Integration

```mermaid
erDiagram
    PooledBranchContext ||--|{ BranchContext : "extends"
    PooledBranchContext {
        string poolId
        number acquisitionTime
        number maxLifetime
    }
    
    PooledBranchPoint ||--|{ BranchPoint : "extends"
    PooledBranchPoint {
        string poolId
        number activeReferences
        number lastAccessed
    }
```

## AI Integration Interfaces

```mermaid
erDiagram
    AIBranchingContext ||--|| PlayerProfile : "considers"
    AIBranchingContext ||--|| NarrativeContext : "analyzes"
    AIBranchingContext ||--|| AIGenerationHints : "uses"
    
    PlayerProfile {
        string playStyle
        Record preferences
        string[] historicalChoices
        number averageDecisionTime
    }
    
    NarrativeContext {
        string currentTone
        string[] thematicElements
        Record characterRelationships
        number plotTension
    }
    
    AIGenerationHints {
        number maxBranchDepth
        number desiredComplexity
        string[] contentThemes
        string[] avoidElements
    }
```

## Data Flow & Relationships Summary

### Core Entity Flow
1. **QNCEStory** contains multiple **Chapters**
2. **Chapter** defines **NarrativeFlows** and **BranchPoints**
3. **NarrativeFlow** contains **NarrativeNodes** with entry/exit points
4. **BranchPoint** offers **BranchOptions** with conditions
5. **BranchContext** maintains runtime state and analytics

### Dynamic Operations
- **DynamicBranchOperation**: Insert/remove/modify branches at runtime
- **DynamicFlowOperation**: Insert/remove/modify entire flows
- Both operations use **BranchConditions** for evaluation

### Performance Integration
- **PooledBranchContext** and **PooledBranchPoint** extend core entities
- Integrated with Sprint #2 object pooling for memory efficiency
- Analytics tracking for performance monitoring

### AI Integration Points
- **AIBranchingContext** provides rich context for AI systems
- **PlayerProfile** enables personalized branching decisions
- **NarrativeContext** allows AI to understand story state
- **AIGenerationHints** guide procedural content generation

This PDM supports all Sprint #3 objectives:
- ✅ Dynamic branching mechanics
- ✅ AI integration readiness  
- ✅ Performance optimization compatibility
- ✅ Analytics and debugging support
- ✅ Procedural content generation framework
