# QNCE Engine

**Quantum Narrative Convergence Engine** - A framework-agnostic TypeScript library for creating interactive narrative experiences with quantum-inspired mechanics.

> **🚀 NEW in v1.2.0:** Complete state persistence, advanced branching with AI integration, autosave & undo/redo system, conditional choice display, and comprehensive UI components with React integration.

[![npm version](https://badge.fury.io/js/qnce-engine.svg)](https://badge.fury.io/js/qnce-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Core Concepts

- **Superposition:** Multiple narrative outcomes exist simultaneously until a choice is made
- **Collapse:** Player choices "collapse" the narrative to a specific path, updating state and flags
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories

## ✨ What's New in v1.2.0

### 💾 State Persistence & Checkpoints
- **Complete save/load system** with data integrity validation
- **Lightweight checkpoints** for undo/redo functionality
- **Automatic state serialization** with metadata and versioning
- **Migration support** for upgrading saved states between versions

### 🌿 Advanced Branching System
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion
- **Real-time branch insertion/removal** for live content updates
- **Comprehensive analytics** for narrative optimization

### 🔄 Autosave & Undo/Redo System
- **Intelligent state tracking** with automatic snapshots on key events
- **Sub-millisecond undo/redo operations** with configurable history depth
- **Autosave throttling** prevents excessive saves during rapid changes
- **Memory efficient** with automatic cleanup and history limits

### 🎯 Conditional Choice Display
- **Flag-based choice filtering** with complex logical expressions
- **Custom validation rules** for advanced choice availability
- **Real-time choice updates** based on dynamic game state
- **Intuitive condition syntax** supporting multiple data types

### 🖥️ UI Integration & React Components
- **Ready-to-use React components** for common UI patterns
- **Keyboard shortcuts** with customizable bindings
- **Accessibility features** with ARIA support and screen reader compatibility
- **Theming system** with customizable appearance

### ⚡ Enterprise Performance
- **Object pooling** reduces memory allocations by 90%+
- **Background processing** for non-blocking operations
- **Hot-reload capabilities** with <3.5ms story updates
- **Comprehensive monitoring** with built-in CLI tools

#### Basic Flag-Based Conditions

```typescript
import { createQNCEEngine } from 'qnce-engine';

const storyData = {
  currentNodeId: 'town-square',
  nodes: {
    'town-square': {
      id: 'town-square',
      text: 'You stand in the bustling town square.',
      choices: [
        {
          id: 'enter-tavern',
          text: 'Enter the tavern',
          nextNodeId: 'tavern-inside'
        },
        {
          id: 'approach-guard',
          text: 'Approach the suspicious guard',
          nextNodeId: 'guard-encounter',
          condition: 'flags.curiosity >= 3'  // Only show if curious enough
        },
        {
          id: 'use-disguise',
          text: 'Use your disguise to blend in',
          nextNodeId: 'disguised-approach',
          condition: 'flags.hasDisguise && !flags.disguiseUsed'
        }
      ]
    }
  },
  flags: {}
};

const engine = createQNCEEngine(storyData);

// Set flags to test conditional choices
engine.setFlag('curiosity', 4);
engine.setFlag('hasDisguise', true);

// Get available choices - only those meeting conditions
const choices = engine.getAvailableChoices();
console.log(`Available choices: ${choices.length}`); // Shows 3 choices

// Change flags to see different options
engine.setFlag('curiosity', 1); // Below threshold
const reducedChoices = engine.getAvailableChoices();
console.log(`Available choices: ${reducedChoices.length}`); // Shows 2 choices
```

#### Complex Conditional Expressions

```typescript
const complexStory = {
  currentNodeId: 'critical-moment',
  nodes: {
    'critical-moment': {
      id: 'critical-moment',
      text: 'The fate of the kingdom hangs in the balance.',
      choices: [
        {
          id: 'diplomatic-solution',
          text: 'Attempt diplomatic negotiation',
          nextNodeId: 'peaceful-resolution',
          condition: 'flags.charisma >= 5 && flags.hasAlliance'
        },
        {
          id: 'magical-intervention',
          text: 'Cast the ancient spell',
          nextNodeId: 'magical-outcome',
          condition: 'flags.magicPower > 3 && flags.spellComponents >= 2 && !flags.cursed'
        },
        {
          id: 'time-limited-escape',
          text: 'Escape through the secret passage',
          nextNodeId: 'secret-escape',
          condition: 'context.timeElapsed < 300 && flags.knowsSecretPath'
        },
        {
          id: 'sacrifice-play',
          text: 'Make the ultimate sacrifice',
          nextNodeId: 'heroic-end',
          condition: '(flags.loyalty >= 8 || flags.desperate) && flags.hasArtifact'
        }
      ]
    }
  },
  flags: {}
};
```

#### Custom Condition Evaluators

For advanced scenarios, you can provide custom logic for condition evaluation:

```typescript
// Set up custom evaluator for complex game logic
engine.setConditionEvaluator((expression, context) => {
  // Custom logic for special conditions
  if (expression === 'canUseSpecialAbility') {
    return context.flags.level >= 10 && 
           context.flags.mana > 50 && 
           !context.flags.abilityOnCooldown;
  }
  
  if (expression.startsWith('inventory:')) {
    const itemName = expression.replace('inventory:', '');
    return context.flags[`has_${itemName}`] === true;
  }
  
  // Fall back to default expression evaluation
  return null;
});

// Use custom conditions in story
const storyWithCustom = {
  currentNodeId: 'boss-fight',
  nodes: {
    'boss-fight': {
      id: 'boss-fight',
      text: 'The dragon roars menacingly.',
      choices: [
        {
          id: 'special-attack',
          text: 'Use your special ability',
          nextNodeId: 'special-victory',
          condition: 'canUseSpecialAbility'
        },
        {
          id: 'use-potion',
          text: 'Drink healing potion',
          nextNodeId: 'healed-state',
          condition: 'inventory:healing_potion'
        }
      ]
    }
  }
};
```

#### Condition Validation & Debugging

```typescript
// Validate conditions during development
try {
  engine.validateCondition('flags.strength >= 5 && flags.weapon');
  console.log('Condition is valid');
} catch (error) {
  console.error('Invalid condition:', error.message);
}

// Get flags referenced in a condition for debugging
const referencedFlags = engine.getConditionFlags('flags.curiosity >= 3 && flags.hasKey');
console.log('Referenced flags:', referencedFlags); // ['curiosity', 'hasKey']

// Clear custom evaluator
engine.clearConditionEvaluator();
```

#### Performance Considerations

- **Expression Caching:** Conditions are compiled once and cached for subsequent evaluations
- **Safe Evaluation:** All expressions are sanitized to prevent code injection
- **Minimal Overhead:** Choice filtering adds <1ms to `getAvailableChoices()` calls
- **Error Isolation:** Invalid conditions don't affect other choices in the same node

### ⚡ Performance Infrastructure
- **🏊‍♂️ Object Pooling:** 90%+ allocation reduction, eliminating GC pressure
- **🧵 Background Processing:** Non-blocking cache preloading and telemetry writes  
- **🔥 Hot-Reload:** <3.5ms live story updates with delta patching
- **📊 Real-time Profiling:** Comprehensive event instrumentation and analysis
- **🖥️ Live Monitoring:** `qnce-perf` CLI dashboard with performance alerts

### Performance Dashboard
```bash
# Real-time performance monitoring
qnce-perf dashboard

# Live monitoring with updates
qnce-perf live 1000

# Export performance data
qnce-perf export > performance-report.json
```

**[📚 Complete Performance Guide →](docs/PERFORMANCE.md)**

## Installation

```bash
npm install qnce-engine

# Global CLI installation for performance monitoring
npm install -g qnce-engine
```

## Quick Start

### Basic Usage

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

// Create engine instance with demo story
const engine = createQNCEEngine(DEMO_STORY);

// Get current narrative state
const currentNode = engine.getCurrentNode();
console.log(currentNode.text);

// Get available choices
const choices = engine.getAvailableChoices();
console.log(choices);

// Make a choice
if (choices.length > 0) {
  engine.selectChoice(choices[0]);
}

// Check narrative flags
const flags = engine.getFlags();
console.log('Current flags:', flags);
```

### Performance Mode (Recommended for Production)

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

// Enable performance optimizations
const engine = createQNCEEngine(DEMO_STORY, {}, true, {
  maxWorkers: 4,
  enableProfiling: true
});

// Background cache preloading happens automatically
// Object pooling reduces memory allocations by 90%+
// Performance events are collected for monitoring

// Get performance statistics
const poolStats = engine.getPoolStats();
console.log(`Pool efficiency: ${poolStats.flow.hitRate}%`);
```

### 💾 State Persistence & Checkpoints

QNCE Engine provides robust state persistence and checkpointing, allowing you to save and load the complete narrative state. This is useful for implementing save games, undo/redo functionality, and scenario replay.

**Key Features:**
- **Full State Serialization:** Save and load the entire engine state, including narrative position, flags, history, and branching context.
- **Lightweight Checkpoints:** Create fast, in-memory snapshots for undo operations or temporary state saves.
- **Data Integrity:** Optional checksum verification ensures that saved data is not corrupted.
- **Cross-Version Compatibility:** A migration system helps upgrade older save states to the latest version.

**Example Usage:**

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

const engine = createQNCEEngine(DEMO_STORY);

// ...progress through the story...
const choices = engine.getAvailableChoices();
if (choices.length > 0) {
  engine.selectChoice(choices[0]);
}


// Save the current state to a JSON string
const savedState = await engine.saveState();
console.log('State saved!');

// ...later, or in a new session...

// Create a new engine instance
const newEngine = createQNCEEngine(DEMO_STORY);

// Load the state
await newEngine.loadState(JSON.parse(savedState));

console.log('State loaded successfully!');
console.log('Current Node:', newEngine.getCurrentNode().text);

// Create a lightweight checkpoint
const checkpoint = await engine.createCheckpoint('Before a risky choice');

// ...make a choice...

// Restore to the checkpoint
await engine.restoreFromCheckpoint(checkpoint.id);
console.log('Restored to checkpoint:', engine.getCurrentNode().text);
```

### 🔄 Autosave & Undo/Redo System

QNCE Engine v1.2.0 introduces an advanced autosave and undo/redo system that automatically tracks state changes and provides instant rollback capabilities with sub-millisecond performance.

**Key Features:**
- **Automatic State Tracking:** Intelligently captures state snapshots on key events (choice selection, flag changes, state loading)
- **High-Performance Undo/Redo:** Sub-millisecond undo/redo operations with configurable history depth
- **Autosave Throttling:** Configurable throttling prevents excessive saves during rapid state changes
- **Memory Efficient:** Capped history with automatic cleanup of older entries

**Basic Usage:**

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

const engine = createQNCEEngine(DEMO_STORY);

// Autosave is enabled by default and will track state changes automatically
console.log('Can undo:', engine.canUndo()); // false initially

// Make some choices (autosave will track each change)
const choices = engine.getAvailableChoices();
engine.selectChoice(choices[0]);

console.log('Can undo:', engine.canUndo()); // true after making a choice

// Undo the last action
const undoResult = engine.undo();
if (undoResult.success) {
  console.log('Undid:', undoResult.description);
  console.log('Can redo:', engine.canRedo()); // true
}

// Redo the undone action
const redoResult = engine.redo();
if (redoResult.success) {
  console.log('Redid:', redoResult.description);
}

// Get history summary
const history = engine.getHistorySummary();
console.log(`History: ${history.undoCount} undo, ${history.redoCount} redo entries`);
```

**Advanced Configuration:**

```typescript
// Configure undo/redo system
engine.configureUndoRedo({
  maxUndoEntries: 100,    // Maximum undo operations to remember
  maxRedoEntries: 50,     // Maximum redo operations to remember
  enabled: true           // Enable/disable undo/redo tracking
});

// Configure autosave behavior
engine.configureAutosave({
  enabled: true,          // Enable/disable autosave
  throttleMs: 100,        // Minimum time between saves (milliseconds)
  events: ['choice', 'flag', 'load'] // Which events trigger autosave
});

// Manual autosave trigger
await engine.autosave();

// Clear all undo/redo history
engine.clearHistory();
```

**Performance Guarantees:**
- Undo operations: <1ms for normal state
- Redo operations: <1ms for normal state
- Autosave overhead: <1ms per operation
- Memory efficient with configurable history limits

### Live Performance Monitoring

```bash
# Real-time performance dashboard
qnce-perf dashboard

# Live monitoring with updates every 2 seconds  
qnce-perf live

# Export performance data
qnce-perf export > performance-report.json
```

## 🌿 Advanced Branching & AI Integration

### Basic Branching

```typescript
import { createQNCEEngine, createBranchingEngine } from 'qnce-engine';

// Create core engine
const engine = createQNCEEngine(storyData);

// Enable advanced branching
const branchingEngine = engine.enableBranching(advancedStoryData);

// Evaluate available branches
const branches = await branchingEngine.evaluateAvailableBranches();
console.log(`Available paths: ${branches.length}`);

// Execute a narrative branch
await branchingEngine.executeBranch(branches[0].id);
```

### AI-Driven Content Generation

```typescript
// Set AI context for personalized content
branchingEngine.setAIContext({
  playerProfile: {
    playStyle: 'explorer',
    preferences: { adventure: 0.8, mystery: 0.6 },
    historicalChoices: ['brave-path', 'investigate-clue']
  },
  narrativeContext: {
    currentTone: 'mysterious',
    thematicElements: ['exploration', 'discovery'],
    plotTension: 0.7
  }
});

// Generate AI-enhanced branches
const aiBranches = await branchingEngine.generateAIBranches(3);
console.log('AI-generated options:', aiBranches.map(b => b.displayText));
```

### Dynamic Content Management

```typescript
// Insert new branch at runtime
const dynamicBranch = {
  type: 'insert',
  branchId: 'special-event',
  targetLocation: { chapterId: 'main', nodeId: 'crossroads' },
  payload: {
    name: 'Special Event',
    branchOptions: [{
      id: 'event-choice',
      displayText: 'Investigate the mysterious sound',
      flagEffects: { event_discovered: true }
    }]
  }
};

await branchingEngine.insertDynamicBranch(dynamicBranch);

// Remove branch when no longer needed
await branchingEngine.removeDynamicBranch('special-event');
```

### Analytics & Monitoring

```typescript
// Get branching analytics
const analytics = branchingEngine.getBranchingAnalytics();
console.log(`Branches traversed: ${analytics.totalBranchesTraversed}`);
console.log(`Popular choices: ${analytics.mostPopularBranches}`);

// Export comprehensive data
const exportData = branchingEngine.exportBranchingData();
// Contains: story structure, session data, player behavior, performance metrics
```

### Live Performance Monitoring

```bash
# Real-time performance dashboard
qnce-perf dashboard

# Live monitoring with updates every 2 seconds  
qnce-perf live

# Export performance data
qnce-perf export > performance-report.json
```

## 🚀 Performance Guide

QNCE v1.2.0-sprint2 includes advanced performance infrastructure for production applications.

### Performance Benchmarks

| Feature | Performance Gain | Impact |
|---------|-----------------|--------|
| Object Pooling | 90%+ allocation reduction | Eliminates GC hitches |
| Hot-Reload | 68% improvement (3.35ms) | Near-instant story updates |
| Background Processing | Non-blocking operations | Smooth user experience |
| Performance Monitoring | Real-time metrics | Production visibility |

### CLI Performance Dashboard

```bash
# Install CLI globally
npm install -g qnce-engine

# Real-time performance monitoring
qnce-perf live

# Performance dashboard output:
🚀 QNCE Performance Dashboard
=====================================
📊 Session Duration: 45.2s
🔢 Total Events: 1,247

💾 Cache Performance:
   ✅ Hit Rate: 92.3% (threshold: 80%)
   ✅ Avg Cache Time: 0.8ms (threshold: 50ms)

🔥 Hot-Reload Performance:
   ⚠️ Avg Time: 3.35ms (threshold: 2ms)
   📊 Max Time: 4.1ms
   🔄 Total Reloads: 12

🧵 ThreadPool Status:
   📊 Completed Jobs: 445
   ⏳ Queued Jobs: 3
   🏃 Active Workers: 2
```

### Performance Mode Usage

```typescript
// Enable all performance optimizations
const engine = createQNCEEngine(storyData, {}, true, {
  maxWorkers: 4,           // Background processing
  enableProfiling: true    // Performance monitoring
});

// Object pooling and background caching happen automatically
// Monitor performance in real-time with CLI dashboard
```

**📖 Complete Performance Guide:** [docs/PERFORMANCE_GUIDE.md](docs/PERFORMANCE_GUIDE.md)

## Core API

### QNCEEngine Class

The main engine class for managing narrative state.

#### Methods

- `getCurrentNode()`: Get the current narrative node
- `goToNodeById(nodeId)`: Navigate directly to a node by its ID
- `getState()`: Get the complete engine state
- `getFlags()`: Get current narrative flags
- `getHistory()`: Get choice history
- `selectChoice(choice)`: Make a narrative choice
- `resetNarrative()`: Reset to initial state
- `loadState(state)`: Load a saved state
- `checkFlag(name, value?)`: Check flag conditions
- `getAvailableChoices()`: Get filtered available choices

### Factory Functions

- `createQNCEEngine(storyData, initialState?)`: Create a new engine instance
- `loadStoryData(jsonData)`: Load and validate story data from JSON

## Story Format

Stories are defined using JSON with the following structure:

```json
{
  "initialNodeId": "start",
  "nodes": [
    {
      "id": "start",
      "text": "You stand at a crossroads...",
      "choices": [
        {
          "text": "Go left",
          "nextNodeId": "left_path",
          "flagEffects": { "direction": "left" }
        }
      ]
    }
  ]
}
```

## CLI Tools

### qnce-audit

Validate your story structure:

```bash
qnce-audit story.json
```

Features:
- Checks for missing node references
- Identifies unreachable nodes
- Finds dead ends
- Validates story structure

### qnce-init

Scaffold a new QNCE project:

```bash
qnce-init my-story
```

Creates:
- Basic story template
- package.json with QNCE dependencies
- README with usage instructions

### qnce-play

Interactive narrative sessions with full undo/redo support:

```bash
qnce-play story.json
```

Features:
- Real-time narrative playthrough
- Instant undo/redo with `u` and `r` commands
- State inspection and debugging
- Performance monitoring
- Session save/load functionality

### qnce-perf

**NEW in v1.2.0:** Real-time performance monitoring and analytics:

```bash
# Launch interactive performance dashboard
qnce-perf dashboard

# Live monitoring with custom update interval
qnce-perf live [interval-ms]

# Export performance data to JSON
qnce-perf export [--format json|csv] [--output filename]

# Single performance snapshot
qnce-perf snapshot story.json
```

**Dashboard Features:**
- Real-time memory usage and allocation tracking
- Object pool efficiency monitoring
- Performance hotspot identification  
- Live story update timing analysis
- Historical performance trend graphs

**Live Monitoring:**
```bash
# Monitor with 1-second updates
qnce-perf live 1000

# Default 500ms updates
qnce-perf live
```

**Export Options:**
```bash
# Export to JSON with full metrics
qnce-perf export --format json --output metrics.json

# Export to CSV for spreadsheet analysis
qnce-perf export --format csv --output performance.csv

# Stream to stdout
qnce-perf export
```

## Integration Examples

### React Hooks

QNCE provides comprehensive React hooks for seamless integration:

```typescript
import { useQNCE, useUndoRedo, useAutosave } from 'qnce-engine/react';
import { DEMO_STORY } from 'qnce-engine';

function NarrativeComponent() {
  // Core narrative hook
  const { engine, currentNode, choices, flags, selectChoice, resetNarrative } = useQNCE(DEMO_STORY);
  
  // Undo/redo functionality
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    undoCount, 
    redoCount,
    clearHistory 
  } = useUndoRedo(engine);
  
  // Autosave status
  const { isAutosaveEnabled, lastAutosave } = useAutosave(engine);

  return (
    <div>
      <h2>Current Scene</h2>
      <p>{currentNode.text}</p>
      
      <h3>Choices</h3>
      {choices.map((choice, index) => (
        <button key={index} onClick={() => selectChoice(choice)}>
          {choice.text}
        </button>
      ))}
      
      <div className="controls">
        <button onClick={undo} disabled={!canUndo}>
          Undo ({undoCount})
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo ({redoCount})
        </button>
        <button onClick={resetNarrative}>Reset</button>
        <button onClick={clearHistory}>Clear History</button>
      </div>
      
      <div className="status">
        <p>Autosave: {isAutosaveEnabled ? 'Enabled' : 'Disabled'}</p>
        {lastAutosave && <p>Last saved: {lastAutosave.toLocaleTimeString()}</p>}
      </div>
      
      <details>
        <summary>Debug Info</summary>
        <pre>{JSON.stringify(flags, null, 2)}</pre>
      </details>
    </div>
  );
}
```

### React UI Components

QNCE provides pre-built React components for common UI patterns:

#### UndoRedoControls Component

A complete undo/redo control panel with accessibility features:

```typescript
import { UndoRedoControls } from 'qnce-engine/ui';
import { createQNCEEngine } from 'qnce-engine';

function MyApp() {
  const engine = createQNCEEngine(DEMO_STORY);

  return (
    <div>
      {/* Narrative content */}
      
      {/* Undo/Redo Controls */}
      <UndoRedoControls 
        engine={engine}
        size="md"              // sm, md, lg
        layout="horizontal"    // horizontal, vertical  
        showLabels={true}      // Show text labels
        labels={{              // Custom labels
          undo: "Go Back",
          redo: "Go Forward"
        }}
        onUndo={(result) => console.log('Undo:', result)}
        onRedo={(result) => console.log('Redo:', result)}
        theme={{               // Custom theming
          colors: {
            primary: '#007bff',
            disabled: '#6c757d'
          },
          borderRadius: { md: '8px' }
        }}
      />
    </div>
  );
}
```

#### AutosaveIndicator Component

Visual indicator for autosave status with animations:

```typescript
import { AutosaveIndicator } from 'qnce-engine/ui';

function MyApp() {
  const engine = createQNCEEngine(DEMO_STORY);

  return (
    <div>
      {/* Narrative content */}
      
      {/* Autosave Status */}
      <AutosaveIndicator 
        engine={engine}
        variant="detailed"     // minimal, detailed, icon-only
        position="top-right"   // inline, top-right, bottom-left, etc.
        showTimestamp={true}   // Show last save time
        autoHideDelay={3000}   // Auto-hide after 3 seconds
        messages={{            // Custom messages
          idle: "Ready to save",
          saving: "Saving...",
          saved: "All changes saved",
          error: "Save failed"
        }}
        theme={{               // Custom theming
          colors: {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107'
          }
        }}
      />
    </div>
  );
}
```

#### Keyboard Shortcuts

Built-in keyboard support with the `useKeyboardShortcuts` hook:

```typescript
import { useKeyboardShortcuts } from 'qnce-engine/ui';

function MyApp() {
  const engine = createQNCEEngine(DEMO_STORY);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts(engine, {
    undo: ['ctrl+z', 'cmd+z'],      // Undo shortcuts
    redo: ['ctrl+y', 'cmd+shift+z'], // Redo shortcuts  
    save: ['ctrl+s', 'cmd+s'],       // Manual save
    disabled: false                  // Enable/disable all shortcuts
  });

  return (
    <div>
      {/* Your narrative UI */}
      <p>Press Ctrl+Z to undo, Ctrl+Y to redo, Ctrl+S to save</p>
    </div>
  );
}
```

### Basic React Hook (Legacy)

```typescript
import { createQNCEEngine } from 'qnce-engine';
import { useState, useCallback } from 'react';

function useQNCE(storyData) {
  const [engine] = useState(() => createQNCEEngine(storyData));
  const [currentNode, setCurrentNode] = useState(engine.getCurrentNode());
  const [flags, setFlags] = useState(engine.getFlags());

  const selectChoice = useCallback((choice) => {
    engine.selectChoice(choice);
    setCurrentNode(engine.getCurrentNode());
    setFlags(engine.getFlags());
  }, [engine]);

  const goToNodeById = useCallback((nodeId) => {
    engine.goToNodeById(nodeId);
    setCurrentNode(engine.getCurrentNode());
    setFlags(engine.getFlags());
  }, [engine]);

  return { currentNode, flags, selectChoice, goToNodeById };
}
```

### Vue Composition API

```typescript
import { createQNCEEngine } from 'qnce-engine';
import { ref, reactive } from 'vue';

export function useQNCE(storyData) {
  const engine = createQNCEEngine(storyData);
  const currentNode = ref(engine.getCurrentNode());
  const flags = reactive(engine.getFlags());

  const selectChoice = (choice) => {
    engine.selectChoice(choice);
    currentNode.value = engine.getCurrentNode();
    Object.assign(flags, engine.getFlags());
  };

  return { currentNode, flags, selectChoice };
}
```

### Node.js CLI

```typescript
import { createQNCEEngine, loadStoryData } from 'qnce-engine';
import { readFileSync } from 'fs';
import * as readline from 'readline';

const storyData = loadStoryData(JSON.parse(readFileSync('story.json', 'utf-8')));
const engine = createQNCEEngine(storyData);

async function playStory() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    const node = engine.getCurrentNode();
    console.log('\n' + node.text);
    
    if (node.choices.length === 0) break;
    
    node.choices.forEach((choice, i) => {
      console.log(`${i + 1}. ${choice.text}`);
    });
    
    // Get user input and make choice...
  }
}
```

## 📚 Examples & Demos

The repository includes comprehensive examples demonstrating all features:

### 🚀 Quickstart Example
- **File:** `examples/branching-quickstart.ts`
- **Features:** Basic branching, AI integration, dynamic operations
- **Run:** `npm run build && node dist/examples/branching-quickstart.js`

### 🎭 Advanced Demo
- **File:** `examples/branching-advanced-demo.ts` 
- **Features:** Complex narrative flows, conditional branching, analytics
- **Story:** "The Mysterious Library" - Interactive mystery with multiple paths

### 💾 Autosave & Undo Demo (NEW in v1.2.0)
- **File:** `examples/autosave-undo-demo.ts`
- **Features:** Autosave, undo/redo, performance monitoring, state management
- **Run:** `npm run demo:autosave`
- **Performance:** Demonstrates <1ms undo/redo with real-time metrics

### 🧪 Validation Scripts
- **Real-world testing:** `scripts/validation-real-world.ts`
- **Comprehensive testing:** `scripts/validation-comprehensive.ts`

```bash
# Run the quickstart example
npm run build
node dist/examples/branching-quickstart.js

# Run the new autosave demo
npm run demo:autosave

# Try the interactive CLI tool
npm run build
qnce-play examples/demo-story.json

# Run validation tests
npm run build
node dist/scripts/validation-real-world.js
```

## Development

```bash
# Clone and setup
git clone https://github.com/ByteSower/qnce-engine.git
cd qnce-engine
npm install

# Build
npm run build

# Watch mode
npm run build:watch

# Lint
npm run lint
```

## License

MIT - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**QNCE Engine** - Empowering interactive narratives with quantum-inspired mechanics.

## 🛡️ Choice Validation System

Ensure only valid choices can be executed with comprehensive validation rules.

### Basic Validation

```typescript
import { createQNCEEngine } from 'qnce-engine';

const engine = createQNCEEngine(storyData);

try {
  // makeChoice() automatically validates before executing
  engine.makeChoice(0);
} catch (error) {
  if (error instanceof ChoiceValidationError) {
    console.error('Invalid choice:', error.message);
    console.log('Available choices:', error.availableChoices);
  }
}
```

### Advanced Choice Requirements

Define complex validation rules on your choices:

```typescript
// Choice with flag requirements
const flagBasedChoice = {
  text: 'Use the magic key',
  nextNodeId: 'unlock_door',
  flagRequirements: {
    hasKey: true,
    playerLevel: 5
  }
};

// Choice with inventory requirements
const inventoryChoice = {
  text: 'Buy expensive sword',
  nextNodeId: 'shop_success',
  inventoryRequirements: {
    gold: 1000,
    gems: 2
  }
};

// Time-based availability
const timedChoice = {
  text: 'Enter the tavern',
  nextNodeId: 'tavern',
  timeRequirements: {
    availableAfter: new Date('2025-01-01T18:00:00'),
    availableBefore: new Date('2025-01-01T24:00:00')
  }
};

// Disabled choice
const disabledChoice = {
  text: 'Broken bridge',
  nextNodeId: 'fall',
  enabled: false
};
```

### Custom Validation Rules

Create your own validation logic:

```typescript
import { 
  StandardValidationRules, 
  createChoiceValidator 
} from 'qnce-engine';

const validator = createChoiceValidator();

// Add custom rule
validator.addRule({
  name: 'custom-rule',
  priority: 10,
  validate: (choice, context) => {
    // Your custom logic
    if (choice.text.includes('danger') && !context.state.flags.brave) {
      return {
        isValid: false,
        reason: 'You must be brave to take this path!',
        failedConditions: ['requires-bravery']
      };
    }
    return { isValid: true };
  }
});

// Apply to engine
engine.setChoiceValidator(validator);
```

### Validation Error Handling

```typescript
import { 
  ChoiceValidationError, 
  isChoiceValidationError 
} from 'qnce-engine';

try {
  engine.makeChoice(2);
} catch (error) {
  if (isChoiceValidationError(error)) {
    // Get user-friendly message
    const message = error.getUserFriendlyMessage();
    console.log(message);
    
    // Get debug information
    const debugInfo = error.getDebugInfo();
    console.log('Failed conditions:', debugInfo.validationResult.failedConditions);
    
    // Show alternatives
    console.log('Available choices:');
    error.availableChoices?.forEach((choice, i) => {
      console.log(`${i + 1}. ${choice.text}`);
    });
  }
}
```
