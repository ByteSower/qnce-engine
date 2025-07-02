# QNCE Engine Integration Example

This example shows how to integrate the QNCE engine into any JavaScript/TypeScript project.

## Installation

```bash
npm install qnce-engine
```

## Basic Usage

```typescript
import { createQNCEEngine, type StoryData, DEMO_STORY } from 'qnce-engine';

// Use the included demo story
const engine = createQNCEEngine(DEMO_STORY);

// Or create your own story
const myStory: StoryData = {
  initialNodeId: "start",
  nodes: [
    {
      id: "start",
      text: "Your adventure begins...",
      choices: [
        {
          text: "Go north",
          nextNodeId: "forest",
          flagEffects: { direction: "north" }
        },
        {
          text: "Go south", 
          nextNodeId: "village",
          flagEffects: { direction: "south" }
        }
      ]
    },
    // ... more nodes
  ]
};

const myEngine = createQNCEEngine(myStory);
```

## CLI Tools

### Initialize a new project

```bash
npx qnce-init my-quantum-story
cd my-quantum-story
npm install
```

This creates:
- `story.json` - Your narrative data
- `package.json` - Project configuration
- `README.md` - Documentation

### Audit your story

```bash
npx qnce-audit story.json
```

Validates:
- All node references are valid
- No orphaned nodes exist  
- Flag consistency
- Choice connectivity

## React Integration

```typescript
import { useQNCE } from './hooks/useQNCE';
import { createQNCEEngine } from 'qnce-engine';

function NarrativeGame({ storyData }) {
  const { engine, currentNode, choices, flags } = useQNCE(storyData);
  
  return (
    <div>
      <p>{currentNode.text}</p>
      <div>
        {choices.map((choice, index) => (
          <button 
            key={index}
            onClick={() => engine.selectChoice(choice)}
          >
            {choice.text}
          </button>
        ))}
      </div>
      <pre>{JSON.stringify(flags, null, 2)}</pre>
    </div>
  );
}
```

## Vue Integration

```vue
<template>
  <div>
    <p>{{ currentNode.text }}</p>
    <button 
      v-for="(choice, index) in choices" 
      :key="index"
      @click="selectChoice(choice)"
    >
      {{ choice.text }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { createQNCEEngine } from 'qnce-engine';

const props = defineProps(['storyData']);
const engine = createQNCEEngine(props.storyData);

const currentNode = computed(() => engine.getCurrentNode());
const choices = computed(() => engine.getAvailableChoices());

function selectChoice(choice) {
  engine.selectChoice(choice);
}
</script>
```

## Links

- [QNCE Engine Repository](https://github.com/ByteSower/qnce-engine)
- [Full Documentation](https://bytesower.github.io/Quantum-Chronicles/docs/)
- [NPM Package](https://www.npmjs.com/package/qnce-engine)
