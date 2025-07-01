# QNCE Engine

**Quantum Narrative Convergence Engine** - A framework-agnostic TypeScript library for creating interactive narrative experiences with quantum-inspired mechanics.

## Core Concepts

- **Superposition:** Multiple narrative outcomes exist simultaneously until a choice is made
- **Collapse:** Player choices "collapse" the narrative to a specific path, updating state and flags
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories

## Installation

```bash
npm install qnce-engine
```

## Quick Start

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
