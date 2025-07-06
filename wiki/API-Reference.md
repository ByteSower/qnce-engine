# API Reference

Complete API documentation for QNCE Engine classes, interfaces, and functions.

## 📖 Core API Overview

The QNCE Engine API is organized into several main modules:

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **Core Engine** | Main engine functionality | `createQNCEEngine`, `QNCEEngine` |
| **Story Models** | Data structures and types | `QNCEStory`, `Node`, `Choice` |
| **Branching System** | Advanced narrative features | `BranchingEngine`, `AIContext` |
| **Performance** | Optimization and monitoring | `PerformanceMonitor`, `ObjectPool` |
| **CLI Tools** | Command-line utilities | `AuditTool`, `PerfTool`, `InitTool` |

## 🚀 Core Engine API

### createQNCEEngine()

Creates a new QNCE Engine instance.

```typescript
function createQNCEEngine(
  story: QNCEStory,
  options?: QNCEEngineOptions
): QNCEEngine
```

#### Parameters

- **`story`** (`QNCEStory`): The story data to load
- **`options`** (`QNCEEngineOptions`, optional): Configuration options

#### Returns

`QNCEEngine` - A new engine instance

#### Example

```typescript
import { createQNCEEngine } from 'qnce-engine';

const engine = createQNCEEngine(storyData, {
  enablePerformanceMode: true,
  enableBranching: true
});
```

### QNCEEngine Class

Main engine class for story execution and state management.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentNodeId` | `string` | ID of the current story node |
| `flags` | `Record<string, any>` | Current story flags |
| `history` | `string[]` | Navigation history |
| `isComplete` | `boolean` | Whether story has reached an end |

#### Methods

##### getCurrentNode()

```typescript
getCurrentNode(): Node
```

Returns the current story node.

**Returns:** `Node` - Current node object

**Example:**
```typescript
const currentNode = engine.getCurrentNode();
console.log(currentNode.text);
```

##### getAvailableChoices()

```typescript
getAvailableChoices(): Choice[]
```

Returns available choices from the current node.

**Returns:** `Choice[]` - Array of available choices

**Example:**
```typescript
const choices = engine.getAvailableChoices();
choices.forEach((choice, index) => {
  console.log(`${index + 1}. ${choice.text}`);
});
```

##### goToNodeById()

```typescript
goToNodeById(nodeId: string): void
```

Navigates directly to a specific node by its ID. Throws `QNCENavigationError` if the node ID is invalid.

**Parameters:**

- **`nodeId`** (`string`): The ID of the node to navigate to.

**Example:**
```typescript
try {
  engine.goToNodeById('chapter_2_start');
} catch (error) {
  console.error(error.message);
}
```

##### makeChoice()

```typescript
makeChoice(choiceIndex: number): void
```

Makes a choice and advances the story.

**Parameters:**
- `choiceIndex` (`number`): Index of the choice to make

**Throws:** `Error` if choice index is invalid

**Example:**
```typescript
engine.makeChoice(0); // Make the first choice
```

##### getFlags()

```typescript
getFlags(): Record<string, any>
```

Returns current story flags.

**Returns:** `Record<string, any>` - Current flag values

**Example:**
```typescript
const flags = engine.getFlags();
console.log('Player courage:', flags.courage);
```

##### setFlag()

```typescript
setFlag(key: string, value: any): void
```

Sets a story flag value.

**Parameters:**
- `key` (`string`): Flag name
- `value` (`any`): Flag value

**Example:**
```typescript
engine.setFlag('player_level', 5);
engine.setFlag('has_sword', true);
```

##### setConditionEvaluator()

```typescript
setConditionEvaluator(evaluator: CustomConditionEvaluator): void
```

Sets a custom condition evaluator for complex choice logic.

**Parameters:**
- `evaluator` (`CustomConditionEvaluator`): Function that evaluates custom conditions

**Example:**
```typescript
engine.setConditionEvaluator((expression, context) => {
  if (expression === 'hasSpecialItem') {
    return context.flags.inventory?.includes('magic_sword');
  }
  return null; // Fall back to default evaluator
});
```

##### clearConditionEvaluator()

```typescript
clearConditionEvaluator(): void
```

Removes the custom condition evaluator, reverting to default expression evaluation.

**Example:**
```typescript
engine.clearConditionEvaluator();
```

##### validateCondition()

```typescript
validateCondition(expression: string): boolean
```

Validates whether a condition expression is syntactically correct and safe.

**Parameters:**
- `expression` (`string`): The condition expression to validate

**Returns:** `boolean` - True if the expression is valid

**Throws:** `ConditionEvaluationError` if the expression is invalid

**Example:**
```typescript
try {
  engine.validateCondition('flags.level >= 5 && !flags.gameOver');
  console.log('Expression is valid');
} catch (error) {
  console.error('Invalid expression:', error.message);
}
```

##### getConditionFlags()

```typescript
getConditionFlags(expression: string): string[]
```

Extracts flag references from a condition expression for debugging or analysis.

**Parameters:**
- `expression` (`string`): The condition expression to analyze

**Returns:** `string[]` - Array of flag names referenced in the expression

**Example:**
```typescript
const flags = engine.getConditionFlags('flags.strength >= 3 && flags.hasKey');
console.log(flags); // ['strength', 'hasKey']
```

##### reset()

```typescript
reset(): void
```

Resets the engine to the initial state.

**Example:**
```typescript
engine.reset(); // Start story over
```

##### saveState()

```typescript
async saveState(options?: SerializationOptions): Promise<string>
```

Serializes the complete engine state to a JSON string. This is ideal for saving game progress.

**Parameters:**
- `options` (`SerializationOptions`, optional): Configuration for serialization, like enabling checksums or pretty printing.

**Returns:** `Promise<string>` - A JSON string representing the complete engine state.

**Example:**
```typescript
const savedState = await engine.saveState({ prettyPrint: true });
// Store `savedState` in localStorage, a file, or a database.
```

##### loadState()

```typescript
async loadState(serializedState: string | SerializedState, options?: LoadOptions): Promise<void>
```

Restores the engine state from a serialized state object or a JSON string.

**Parameters:**
- `serializedState` (`string | SerializedState`): The state to load.
- `options` (`LoadOptions`, optional): Configuration for deserialization, like verifying checksums.

**Throws:** `Error` if the state is invalid, corrupted, or incompatible.

**Example:**
```typescript
await engine.loadState(savedState);
console.log('State loaded!');
```

##### createCheckpoint()

```typescript
async createCheckpoint(name?: string): Promise<Checkpoint>
```

Creates a lightweight, in-memory checkpoint of the current narrative state. Useful for implementing undo/redo functionality.

**Parameters:**
- `name` (`string`, optional): A descriptive name for the checkpoint (e.g., "Before risky choice").

**Returns:** `Promise<Checkpoint>` - The created checkpoint object, containing its ID and a snapshot of the state.

**Example:**
```typescript
const checkpoint = await engine.createCheckpoint('Before risky choice');
```

##### restoreFromCheckpoint()

```typescript
async restoreFromCheckpoint(checkpointId: string): Promise<void>
```

Restores the engine state from a previously created in-memory checkpoint.

**Parameters:**
- `checkpointId` (`string`): The ID of the checkpoint to restore.

**Throws:** `Error` if the checkpoint ID is not found.

**Example:**
```typescript
await engine.restoreFromCheckpoint(checkpoint.id);
console.log('Restored to previous state.');
```

## 📊 Data Models

### QNCEStory Interface

Main story data structure.

```typescript
interface QNCEStory {
  id: string;
  title: string;
  version: string;
  metadata: StoryMetadata;
  branchingConfig?: BranchingConfig;
  chapters?: Chapter[];
  nodes: Node[];          // For basic stories
  initialNodeId?: string;
  aiContext?: AIContext;
}
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique story identifier |
| `title` | `string` | ✅ | Story title |
| `version` | `string` | ✅ | Story version (semver) |
| `metadata` | `StoryMetadata` | ✅ | Story metadata |
| `branchingConfig` | `BranchingConfig` | ❌ | Advanced branching configuration |
| `chapters` | `Chapter[]` | ❌ | Organized story chapters |
| `nodes` | `Node[]` | ✅* | Story nodes (basic format) |
| `initialNodeId` | `string` | ❌ | Starting node ID |
| `aiContext` | `AIContext` | ❌ | AI integration context |

*Required for basic stories, optional for advanced branching stories

### Node Interface

Individual story moment or scene.

```typescript
interface Node {
  id: string;
  text: string;
  choices: Choice[];
  flags?: Record<string, any>;
  metadata?: NodeMetadata;
  conditions?: Condition[];
}
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique node identifier |
| `text` | `string` | ✅ | Node narrative text |
| `choices` | `Choice[]` | ✅ | Available player choices |
| `flags` | `Record<string, any>` | ❌ | Flags set when entering node |
| `metadata` | `NodeMetadata` | ❌ | Additional node information |
| `conditions` | `Condition[]` | ❌ | Conditions for node availability |

### Choice Interface

Player choice option.

```typescript
interface Choice {
  text: string;
  nextNodeId: string;
  flagEffects?: Record<string, any>;
  condition?: string;
  conditions?: Condition[];
  metadata?: ChoiceMetadata;
}
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | `string` | ✅ | Choice display text |
| `nextNodeId` | `string` | ✅ | Target node ID |
| `flagEffects` | `Record<string, any>` | ❌ | Flags changed by this choice |
| `condition` | `string` | ❌ | Expression for choice availability (e.g., `"flags.level >= 3"`) |
| `conditions` | `Condition[]` | ❌ | Legacy: Conditions for choice availability |
| `metadata` | `ChoiceMetadata` | ❌ | Additional choice information |

#### Condition Expressions

The `condition` property accepts JavaScript-like expressions for determining choice availability:

```typescript
// Simple flag checks
"flags.hasKey"
"!flags.doorLocked"

// Numeric comparisons  
"flags.level >= 5"
"flags.health > 0"

// Complex logical expressions
"flags.strength >= 3 && flags.hasWeapon"
"flags.magic > 2 || flags.charm >= 5"
"(flags.stealth >= 4 || flags.lockpick) && !flags.alarmTriggered"

// Context access
"context.timeElapsed < 300"
"context.visitCount <= 2"
```

### ConditionEvaluator Types

Types for custom condition evaluation logic.

```typescript
type CustomConditionEvaluator = (
  expression: string,
  context: ConditionContext
) => boolean | null;

interface ConditionContext {
  flags: Record<string, any>;
  context: {
    timeElapsed?: number;
    visitCount?: number;
    [key: string]: any;
  };
}

class ConditionEvaluationError extends Error {
  expression: string;
  originalError?: Error;
  
  constructor(message: string, expression: string, originalError?: Error);
}
```

#### CustomConditionEvaluator

A function that evaluates custom condition logic. Return `null` to fall back to default expression evaluation.

**Parameters:**
- `expression` (`string`): The condition expression to evaluate
- `context` (`ConditionContext`): Current game state and context

**Returns:** `boolean | null` - `true` if condition is met, `false` if not, `null` to use default evaluator

#### ConditionContext

Context object passed to condition evaluators containing current game state.

**Properties:**
- `flags` (`Record<string, any>`): Current story flags
- `context` (`object`): Additional context like time elapsed, visit counts, etc.

#### ConditionEvaluationError

Error thrown when condition expressions are invalid or unsafe.

**Properties:**
- `expression` (`string`): The expression that caused the error
- `originalError` (`Error`, optional): The underlying error if available
#### ValidationError

---

## 🎨 React UI Components

QNCE Engine provides ready-to-use React components and hooks for building narrative interfaces.

### useQNCE Hook

React hook for integrating QNCE Engine with React components. Provides reactive state management and action handlers.

```typescript
function useQNCE(engine: QNCEEngine, config?: UseQNCEConfig): UseQNCEReturn
```

#### Parameters

- **`engine`** (`QNCEEngine`): The QNCE Engine instance
- **`config`** (`UseQNCEConfig`, optional): Configuration options

#### Configuration Options (UseQNCEConfig)

```typescript
interface UseQNCEConfig {
  autoUpdate?: boolean;          // Auto re-render on state changes (default: true)
  enableUndoRedo?: boolean;      // Enable undo/redo functionality (default: true)
  maxUndoEntries?: number;       // Maximum undo entries (default: 50)
  maxRedoEntries?: number;       // Maximum redo entries (default: 25)
  enableAutosave?: boolean;      // Enable autosave (default: true)
  autosaveThrottleMs?: number;   // Autosave throttle in ms (default: 100)
}
```

#### Returns (UseQNCEReturn)

```typescript
interface UseQNCEReturn {
  currentNode: Node | null;
  availableChoices: Choice[];
  selectChoice: (choice: Choice) => void;
  flags: Record<string, any>;
  isComplete: boolean;
  history: string[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}
```

#### Example

```typescript
import React from 'react';
import { useQNCE } from 'qnce-engine/integrations/react';

function StoryComponent({ engine }) {
  const {
    currentNode,
    availableChoices,
    selectChoice,
    undo,
    redo,
    canUndo,
    canRedo
  } = useQNCE(engine, {
    enableUndoRedo: true,
    enableAutosave: true,
    maxUndoEntries: 50
  });

  return (
    <div>
      <p>{currentNode?.text}</p>
      
      <div>
        {availableChoices.map(choice => (
          <button key={choice.text} onClick={() => selectChoice(choice)}>
            {choice.text}
          </button>
        ))}
      </div>
      
      <div>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </div>
  );
}
```

### UndoRedoControls Component

Pre-built accessible undo/redo controls with theming support.

```typescript
interface UndoRedoControlsProps {
  engine: QNCEEngine;
  theme?: Partial<QNCETheme>;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  showLabels?: boolean;
  labels?: { undo: string; redo: string };
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  onUndo?: () => void;
  onRedo?: () => void;
}
```

#### Example

```typescript
import React from 'react';
import { UndoRedoControls } from 'qnce-engine/ui';

function GameInterface({ engine }) {
  return (
    <div>
      {/* Your game content */}
      
      <UndoRedoControls
        engine={engine}
        size="lg"
        showLabels={true}
        theme={{
          colors: {
            primary: '#007bff',
            secondary: '#6c757d'
          }
        }}
        onUndo={() => console.log('Undo clicked')}
        onRedo={() => console.log('Redo clicked')}
      />
    </div>
  );
}
```

### AutosaveIndicator Component

Visual indicator showing autosave status with real-time updates.

```typescript
interface AutosaveIndicatorProps {
  engine: QNCEEngine;
  theme?: Partial<QNCETheme>;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'minimal' | 'detailed';
  position?: 'inline' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  messages?: {
    idle: string;
    saving: string;
    saved: string;
    error: string;
    disabled: string;
  };
  showTimestamp?: boolean;
  autoHideDelay?: number;
}
```

#### Example

```typescript
import React from 'react';
import { AutosaveIndicator } from 'qnce-engine/ui';

function GameInterface({ engine }) {
  return (
    <div>
      <AutosaveIndicator
        engine={engine}
        variant="detailed"
        position="top-right"
        showTimestamp={true}
        autoHideDelay={5000}
        messages={{
          saving: 'Saving your progress...',
          saved: 'Progress saved!',
          error: 'Save failed - check connection'
        }}
      />
      
      {/* Your game content */}
    </div>
  );
}
```

### useKeyboardShortcuts Hook

React hook for adding keyboard shortcuts to QNCE Engine interactions.

```typescript
function useKeyboardShortcuts(config: KeyboardShortcutsConfig): void

interface KeyboardShortcutsConfig {
  engine: QNCEEngine;
  shortcuts?: {
    undo?: string;      // Default: 'ctrl+z' or 'cmd+z'
    redo?: string;      // Default: 'ctrl+y' or 'cmd+shift+z'
    save?: string;      // Default: 'ctrl+s' or 'cmd+s'
    [key: string]: string | undefined;
  };
  disabled?: boolean;
  preventDefault?: boolean;
}
```

#### Example

```typescript
import React from 'react';
import { useKeyboardShortcuts } from 'qnce-engine/ui';

function GameComponent({ engine }) {
  useKeyboardShortcuts({
    engine,
    shortcuts: {
      undo: 'ctrl+z',
      redo: 'ctrl+shift+z',
      save: 'ctrl+s'
    },
    preventDefault: true
  });

  // Component content...
}
```

---

*This documentation is maintained for QNCE Engine v1.2.1 with complete Sprint 3 integration including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
