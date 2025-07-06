# Getting Started with QNCE Engine

Welcome to QNCE Engine! This guide will help you get up and running with creating interactive narratives using quantum-inspired mechanics.

## 📦 Installation

### Basic Installation

```bash
# Install QNCE Engine
npm install qnce-engine
```

### Global CLI Installation (Recommended)

```bash
# Install globally for CLI tools
npm install -g qnce-engine

# Verify installation
qnce-init --version
```

### System Requirements

- **Node.js:** 16.0.0 or higher
- **TypeScript:** 4.5.0 or higher (for TypeScript projects)
- **Memory:** Minimum 50MB available RAM
- **Platform:** Windows, macOS, Linux

## 🏁 Quick Start (5 Minutes)

Let's create your first interactive story in just a few steps!

### Step 1: Create a New Project

```bash
# Create a new QNCE project
npx qnce-init my-first-story

# Navigate to the project
cd my-first-story

# Install dependencies
npm install
```

### Step 2: Your First Story

Create a simple story file:

```javascript
// story.js
import { createQNCEEngine } from 'qnce-engine';

// Define your story
const myStory = {
  nodes: [
    {
      id: 'start',
      text: 'You wake up in a mysterious forest. The morning mist swirls around ancient trees.',
      choices: [
        {
          text: 'Follow the winding path',
          nextNodeId: 'path',
          flagEffects: { courage: 1 }
        },
        {
          text: 'Investigate the strange glowing mushrooms',
          nextNodeId: 'mushrooms',
          flagEffects: { curiosity: 1 }
        }
      ]
    },
    {
      id: 'path',
      text: 'The path leads to a clearing with a bubbling brook. You feel more confident.',
      choices: [
        {
          text: 'Drink from the brook',
          nextNodeId: 'brook',
          flagEffects: { refreshed: true }
        }
      ]
    },
    {
      id: 'mushrooms',
      text: 'The mushrooms pulse with an otherworldly light. Your curiosity is rewarded!',
      choices: [
        {
          text: 'Touch one of the glowing mushrooms',
          nextNodeId: 'magic',
          flagEffects: { magic_discovered: true }
        }
      ]
    },
    {
      id: 'brook',
      text: 'The cool water refreshes you. You notice fish swimming in patterns that seem almost deliberate.',
      choices: []
    },
    {
      id: 'magic',
      text: 'The mushroom responds to your touch, revealing hidden pathways through reality itself!',
      choices: []
    }
  ]
};

// Create and run the engine
const engine = createQNCEEngine(myStory);

console.log('🌟 Welcome to Your Story!');
console.log('========================\\n');

function displayCurrentState() {
  const currentNode = engine.getCurrentNode();
  const flags = engine.getFlags();
  
  console.log(currentNode.text);
  console.log('\\nFlags:', flags);
  
  const choices = engine.getAvailableChoices();
  if (choices.length > 0) {
    console.log('\\nChoices:');
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.text}`);
    });
  } else {
    console.log('\\n🎭 Story Complete!');
  }
}

// Display initial state
displayCurrentState();

// Simulate making a choice (in a real app, this would be user input)
if (engine.getAvailableChoices().length > 0) {
  console.log('\\n✨ Making choice: "Follow the winding path"');
  engine.makeChoice(0);
  displayCurrentState();
}
```

### Step 3: Run Your Story

```bash
node story.js
```

Expected output:
```
🌟 Welcome to Your Story!
========================

You wake up in a mysterious forest. The morning mist swirls around ancient trees.

Flags: {}

Choices:
1. Follow the winding path
2. Investigate the strange glowing mushrooms

✨ Making choice: "Follow the winding path"
The path leads to a clearing with a bubbling brook. You feel more confident.

Flags: { courage: 1 }

Choices:
1. Drink from the brook
```

## 🎯 Core Concepts in Action

### Superposition
Before a choice is made, multiple story outcomes exist simultaneously:

```javascript
// Multiple potential futures exist
const choices = engine.getAvailableChoices();
console.log(`${choices.length} potential futures available`);
```

### Collapse
Making a choice "collapses" the narrative to a specific path:

```javascript
// Collapse to a specific reality
engine.makeChoice(0);
console.log('Reality collapsed to:', engine.getCurrentNode().id);
```

### Entanglement
Decisions create flags that affect future story paths:

```javascript
// Early decision creates entanglement
engine.makeChoice(0); // Sets { courage: 1 }

// Later story can check this flag
if (engine.getFlags().courage > 0) {
  console.log('Your earlier courage affects this moment!');
}
```

## 🚀 Framework Integration

### React Integration

QNCE Engine provides a built-in React hook and UI components for seamless integration.

```typescript
// StoryComponent.tsx
import React, { useState } from 'react';
import { createQNCEEngine } from 'qnce-engine';
import { useQNCE } from 'qnce-engine/integrations/react';
import { UndoRedoControls, AutosaveIndicator } from 'qnce-engine/ui';
import { myStory } from './story';

export function StoryComponent() {
  const [engine] = useState(() => createQNCEEngine(myStory));
  
  const {
    currentNode,
    availableChoices,
    selectChoice,
    flags,
    undo,
    redo,
    canUndo,
    canRedo,
    isComplete
  } = useQNCE(engine, {
    enableUndoRedo: true,
    enableAutosave: true,
    maxUndoEntries: 50
  });

  return (
    <div className="story-container">
      {/* Autosave indicator */}
      <AutosaveIndicator
        engine={engine}
        position="top-right"
        variant="detailed"
        showTimestamp={true}
      />
      
      <div className="story-text">
        <p>{currentNode?.text}</p>
      </div>
      
      <div className="choices">
        {availableChoices.map((choice, index) => (
          <button
            key={index}
            onClick={() => selectChoice(choice)}
            className="choice-button"
          >
            {choice.text}
          </button>
        ))}
      </div>
      
      {/* Undo/Redo controls */}
      <UndoRedoControls
        engine={engine}
        size="md"
        showLabels={true}
        layout="horizontal"
      />
      
      {isComplete && (
        <div className="story-complete">
          <h3>Story Complete!</h3>
        </div>
      )}
      
      <div className="flags">
        <h4>Story Flags:</h4>
        <pre>{JSON.stringify(flags, null, 2)}</pre>
      </div>
    </div>
  );
}
```

### Vue 3 Integration

```typescript
// useQNCE.ts (Vue Composition API)
import { ref, reactive } from 'vue';
import { createQNCEEngine, QNCEStory } from 'qnce-engine';

export function useQNCE(story: QNCEStory) {
  const engine = createQNCEEngine(story);
  const currentNode = ref(engine.getCurrentNode());
  const flags = reactive(engine.getFlags());

  const makeChoice = (choiceIndex: number) => {
    engine.makeChoice(choiceIndex);
    currentNode.value = engine.getCurrentNode();
    Object.assign(flags, engine.getFlags());
  };

  return {
    currentNode,
    choices: engine.getAvailableChoices(),
    flags,
    makeChoice
  };
}
```

```vue
<!-- StoryComponent.vue -->
<template>
  <div class="story-container">
    <div class="story-text">
      <p>{{ currentNode.text }}</p>
    </div>
    
    <div class="choices">
      <button
        v-for="(choice, index) in choices"
        :key="index"
        @click="makeChoice(index)"
        class="choice-button"
      >
        {{ choice.text }}
      </button>
    </div>
    
    <div class="flags">
      <h4>Story Flags:</h4>
      <pre>{{ JSON.stringify(flags, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQNCE } from './useQNCE';
import { myStory } from './story';

const { currentNode, choices, flags, makeChoice } = useQNCE(myStory);
</script>
```

### Node.js Server Integration

```typescript
// server.ts
import express from 'express';
import { createQNCEEngine, QNCEStory } from 'qnce-engine';
import { myStory } from './story';

const app = express();
app.use(express.json());

// Store engine instances per session
const sessions = new Map<string, any>();

app.post('/story/start', (req, res) => {
  const sessionId = req.body.sessionId || generateSessionId();
  const engine = createQNCEEngine(myStory);
  
  sessions.set(sessionId, engine);
  
  res.json({
    sessionId,
    node: engine.getCurrentNode(),
    choices: engine.getAvailableChoices(),
    flags: engine.getFlags()
  });
});

app.post('/story/choice', (req, res) => {
  const { sessionId, choiceIndex } = req.body;
  const engine = sessions.get(sessionId);
  
  if (!engine) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  engine.makeChoice(choiceIndex);
  
  res.json({
    node: engine.getCurrentNode(),
    choices: engine.getAvailableChoices(),
    flags: engine.getFlags()
  });
});

app.listen(3000, () => {
  console.log('QNCE Story Server running on port 3000');
});
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>QNCE Story</title>
  <style>
    .story-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .story-text { font-size: 18px; line-height: 1.6; margin-bottom: 20px; }
    .choice-button { 
      display: block; 
      width: 100%; 
      margin: 10px 0; 
      padding: 15px; 
      font-size: 16px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .choice-button:hover { background: #005a9e; }
    .flags { margin-top: 20px; padding: 10px; background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="story-container">
    <div id="story-text" class="story-text"></div>
    <div id="choices"></div>
    <div id="flags" class="flags"></div>
  </div>

  <script src="path/to/qnce-engine.js"></script>
  <script>
    // Initialize the story
    const story = {
      nodes: [
        // ... your story data
      ]
    };

    const engine = QNCE.createQNCEEngine(story);

    function updateDisplay() {
      const currentNode = engine.getCurrentNode();
      const choices = engine.getAvailableChoices();
      const flags = engine.getFlags();

      // Update story text
      document.getElementById('story-text').textContent = currentNode.text;

      // Update choices
      const choicesContainer = document.getElementById('choices');
      choicesContainer.innerHTML = '';
      
      choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = choice.text;
        button.onclick = () => {
          engine.makeChoice(index);
          updateDisplay();
        };
        choicesContainer.appendChild(button);
      });

      // Update flags
      document.getElementById('flags').innerHTML = 
        '<h4>Story Flags:</h4><pre>' + JSON.stringify(flags, null, 2) + '</pre>';
    }

    // Initial display
    updateDisplay();
  </script>
</body>
</html>
```

## 🛠️ Development Tools

### CLI Tools Overview

```bash
# Create new project with templates
qnce-init my-story --template interactive-fiction

# Audit story for issues
qnce-audit story.json

# Monitor performance in real-time
qnce-perf --watch --dashboard

# Export performance data
qnce-perf export --format json
```

### Story Validation

```javascript
import { createQNCEEngine } from 'qnce-engine';

// Load your story
const story = { /* your story data */ };

try {
  const engine = createQNCEEngine(story);
  console.log('✅ Story structure is valid');
} catch (error) {
  console.error('❌ Story validation failed:', error.message);
}
```

### Performance Monitoring

```javascript
import { createQNCEEngine } from 'qnce-engine';

const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  performanceOptions: {
    enableProfiling: true,
    maxCacheSize: 1000
  }
});

// Monitor performance
engine.on('performanceData', (data) => {
  console.log('Performance metrics:', data);
});
```

## 🐛 Troubleshooting

### Common Issues

#### Module Not Found
```bash
# Ensure you've installed the package
npm install qnce-engine

# For TypeScript projects, install types
npm install @types/node
```

#### Story Not Loading
```javascript
// Verify story structure
const isValidStory = story.nodes && Array.isArray(story.nodes);
if (!isValidStory) {
  console.error('Invalid story structure');
}
```

#### Performance Issues
```javascript
// Enable performance mode for large stories
const engine = createQNCEEngine(story, {
  enablePerformanceMode: true
});
```

### Getting Help

- **Documentation:** Check the [API Reference](API-Reference) for detailed information
- **Examples:** Browse [working examples](https://github.com/ByteSower/qnce-engine/tree/main/examples)
- **Community:** Ask questions in [GitHub Discussions](https://github.com/ByteSower/qnce-engine/discussions)
- **Issues:** Report bugs via [GitHub Issues](https://github.com/ByteSower/qnce-engine/issues)

## 🎯 Next Steps

Now that you have QNCE Engine set up, here's what to explore next:

1. **[Branching Guide](Branching-Guide)** - Learn advanced branching and AI integration
2. **[Performance Tuning](Performance-Tuning)** - Optimize your stories for production
3. **[CLI Usage](CLI-Usage)** - Master the command-line tools
4. **[API Reference](API-Reference)** - Dive deep into the complete API

---

## 📍 Wiki Navigation

**← Previous:** [Home](Home) | **You are here:** Getting Started | **Next:** [Branching Guide →](Branching-Guide)

**All Pages:** [Home](Home) • **Getting Started** • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • [Contributing](Contributing) • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.2.2 with advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
