# QNCE Engine

**Quantum Narrative Convergence Engine** - A framework-agnostic TypeScript library for creating interactive narrative experiences with quantum-inspired mechanics.

> **🚀 NEW in v1.2.0:** Advanced Branching API with AI integration, dynamic content management, and comprehensive analytics. Plus enterprise-grade performance optimization.

## Core Concepts

- **Superposition:** Multiple narrative outcomes exist simultaneously until a choice is made
- **Collapse:** Player choices "collapse" the narrative to a specific path, updating state and flags
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories

## ✨ Advanced Features (v1.2.0)

### 🌿 Advanced Branching System
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion
- **Real-time branch insertion/removal** for live content updates
- **Comprehensive analytics** for narrative optimization

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

## Integration Examples

### React Hook

```typescript
import { createQNCEEngine } from 'qnce-engine';
import { useState, useEffect } from 'react';

function useQNCE(storyData) {
  const [engine] = useState(() => createQNCEEngine(storyData));
  const [currentNode, setCurrentNode] = useState(engine.getCurrentNode());
  const [flags, setFlags] = useState(engine.getFlags());

  const selectChoice = (choice) => {
    engine.selectChoice(choice);
    setCurrentNode(engine.getCurrentNode());
    setFlags(engine.getFlags());
  };

  return { currentNode, flags, selectChoice };
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

### 🧪 Validation Scripts
- **Real-world testing:** `scripts/validation-real-world.ts`
- **Comprehensive testing:** `scripts/validation-comprehensive.ts`

```bash
# Run the quickstart example
npm run build
node dist/examples/branching-quickstart.js

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
