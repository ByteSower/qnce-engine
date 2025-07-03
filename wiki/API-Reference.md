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

##### reset()

```typescript
reset(): void
```

Resets the engine to the initial state.

**Example:**
```typescript
engine.reset(); // Start story over
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
| `conditions` | `Condition[]` | ❌ | Conditions for choice availability |
| `metadata` | `ChoiceMetadata` | ❌ | Additional choice information |

### Condition Interface

Conditional logic for choices and nodes.

```typescript
interface Condition {
  type: 'flag' | 'and' | 'or' | 'not' | 'time_limit' | 'custom';
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'exists';
  key?: string;
  value?: any;
  conditions?: Condition[];
  customEvaluator?: (flags: Record<string, any>) => boolean;
}
```

## 🌿 Branching System API

### BranchingEngine Class

Advanced branching functionality.

#### Methods

##### insertBranch()

```typescript
insertBranch(branch: Branch): void
```

Dynamically inserts a new story branch.

**Parameters:**
- `branch` (`Branch`): Branch definition to insert

**Example:**
```typescript
engine.insertBranch({
  id: 'emergency-exit',
  sourceNodeId: 'dangerous-room',
  targetNodeId: 'safety',
  text: 'Look for emergency exit',
  conditions: [{ type: 'flag', key: 'danger_level', operator: 'greater_than', value: 5 }]
});
```

##### removeBranch()

```typescript
removeBranch(branchId: string): void
```

Removes a dynamic branch.

**Parameters:**
- `branchId` (`string`): ID of branch to remove

##### generateAIBranches()

```typescript
async generateAIBranches(options: AIGenerationOptions): Promise<Branch[]>
```

Generates story branches using AI.

**Parameters:**
- `options` (`AIGenerationOptions`): AI generation configuration

**Returns:** `Promise<Branch[]>` - Generated branches

**Example:**
```typescript
const branches = await engine.generateAIBranches({
  sourceNodeId: 'conflict',
  maxBranches: 3,
  themes: ['diplomacy', 'combat', 'stealth'],
  playerContext: engine.getFlags()
});
```

### AIContext Interface

Context for AI-driven content generation.

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
```

## ⚡ Performance API

### PerformanceMonitor Class

Performance monitoring and profiling.

#### Methods

##### startProfiling()

```typescript
startProfiling(options?: ProfilingOptions): void
```

Starts performance profiling.

**Parameters:**
- `options` (`ProfilingOptions`, optional): Profiling configuration

##### getMetrics()

```typescript
getMetrics(): PerformanceMetrics
```

Returns current performance metrics.

**Returns:** `PerformanceMetrics` - Performance data

**Example:**
```typescript
const metrics = engine.getPerformanceMetrics();
console.log('Memory usage:', metrics.memoryUsage);
console.log('Avg transition time:', metrics.avgTransitionTime);
```

##### enableObjectPooling()

```typescript
enableObjectPooling(config: PoolingConfig): void
```

Enables object pooling for performance optimization.

**Parameters:**
- `config` (`PoolingConfig`): Pooling configuration

### PerformanceMetrics Interface

Performance measurement data.

```typescript
interface PerformanceMetrics {
  memoryUsage: number;           // Current memory usage (MB)
  avgTransitionTime: number;     // Average state transition time (ms)
  maxTransitionTime: number;     // Maximum transition time (ms)
  cacheHitRate: number;          // Cache hit rate (0-1)
  totalTransitions: number;      // Total transitions performed
  uptime: number;                // Engine uptime (ms)
  gcPressure: number;            // Garbage collection pressure
}
```

## 🛠️ Configuration Interfaces

### QNCEEngineOptions

Engine configuration options.

```typescript
interface QNCEEngineOptions {
  enablePerformanceMode?: boolean;
  enableBranching?: boolean;
  performanceOptions?: PerformanceOptions;
  branchingOptions?: BranchingOptions;
  validationMode?: 'strict' | 'normal' | 'none';
  debugMode?: boolean;
}
```

### PerformanceOptions

Performance-related configuration.

```typescript
interface PerformanceOptions {
  objectPooling?: PoolingConfig;
  backgroundProcessing?: BackgroundConfig;
  caching?: CacheConfig;
  profiling?: ProfilingConfig;
}
```

### BranchingOptions

Advanced branching configuration.

```typescript
interface BranchingOptions {
  maxActiveBranches?: number;
  branchCacheSize?: number;
  enableDynamicInsertion?: boolean;
  enableAnalytics?: boolean;
  aiIntegration?: AIIntegrationConfig;
}
```

## 🎮 Event System API

### Event Handling

QNCE Engine supports event-driven architecture for reactive programming.

#### addEventListener()

```typescript
addEventListener(event: string, handler: EventHandler): void
```

Adds an event listener.

**Parameters:**
- `event` (`string`): Event name
- `handler` (`EventHandler`): Event handler function

**Events:**
- `'nodeChanged'` - Fired when current node changes
- `'choiceMade'` - Fired when player makes a choice
- `'flagChanged'` - Fired when flag value changes
- `'storyComplete'` - Fired when story reaches an end
- `'performanceAlert'` - Fired when performance thresholds are exceeded

**Example:**
```typescript
engine.addEventListener('nodeChanged', (node) => {
  console.log('Navigated to:', node.id);
});

engine.addEventListener('flagChanged', (flag, oldValue, newValue) => {
  console.log(`Flag ${flag} changed from ${oldValue} to ${newValue}`);
});
```

#### removeEventListener()

```typescript
removeEventListener(event: string, handler: EventHandler): void
```

Removes an event listener.

## 🔧 Utility Functions

### loadStoryData()

```typescript
function loadStoryData(data: any): QNCEStory
```

Loads and validates story data from various formats.

**Parameters:**
- `data` (`any`): Raw story data (JSON, object, etc.)

**Returns:** `QNCEStory` - Validated story object

**Throws:** `Error` if data is invalid

### validateStory()

```typescript
function validateStory(story: QNCEStory): ValidationResult
```

Validates story structure and integrity.

**Parameters:**
- `story` (`QNCEStory`): Story to validate

**Returns:** `ValidationResult` - Validation results

### migrateStory()

```typescript
function migrateStory(oldStory: any, targetVersion: string): QNCEStory
```

Migrates story data between versions.

**Parameters:**
- `oldStory` (`any`): Legacy story data
- `targetVersion` (`string`): Target format version

**Returns:** `QNCEStory` - Migrated story

## 🧪 Testing Utilities

### createTestEngine()

```typescript
function createTestEngine(story?: QNCEStory): TestEngine
```

Creates an engine instance optimized for testing.

**Returns:** `TestEngine` - Test-optimized engine

### TestEngine Class

Extended engine with testing capabilities.

#### Methods

##### simulateChoices()

```typescript
simulateChoices(choices: number[]): void
```

Simulates a sequence of choices for testing.

##### getTestMetrics()

```typescript
getTestMetrics(): TestMetrics
```

Returns testing-specific metrics.

##### validatePath()

```typescript
validatePath(path: string[]): ValidationResult
```

Validates a specific story path.

## 📱 Framework Integration APIs

### React Hooks

#### useQNCE()

```typescript
function useQNCE(story: QNCEStory, options?: QNCEEngineOptions): QNCEHookResult
```

React hook for QNCE integration.

**Returns:**
```typescript
interface QNCEHookResult {
  currentNode: Node;
  choices: Choice[];
  flags: Record<string, any>;
  makeChoice: (index: number) => void;
  reset: () => void;
  isComplete: boolean;
}
```

### Vue Composables

#### useQNCE()

```typescript
function useQNCE(story: QNCEStory, options?: QNCEEngineOptions): QNCEComposableResult
```

Vue 3 composable for QNCE integration.

## 🚨 Error Handling

### Error Types

#### QNCEError

Base error class for QNCE-specific errors.

```typescript
class QNCEError extends Error {
  code: string;
  context?: any;
}
```

#### ValidationError

Error thrown during story validation.

```typescript
class ValidationError extends QNCEError {
  issues: ValidationIssue[];
}
```

#### PerformanceError

Error thrown when performance limits are exceeded.

```typescript
class PerformanceError extends QNCEError {
  metric: string;
  threshold: number;
  actual: number;
}
```

### Error Handling Best Practices

```typescript
try {
  const engine = createQNCEEngine(story);
  engine.makeChoice(0);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Story validation failed:', error.issues);
  } else if (error instanceof PerformanceError) {
    console.error('Performance threshold exceeded:', error.metric);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## 📚 TypeScript Definitions

### Complete Type Exports

```typescript
// Core types
export type {
  QNCEStory,
  Node,
  Choice,
  Condition,
  QNCEEngineOptions,
  PerformanceMetrics
};

// Branching types
export type {
  BranchingConfig,
  AIContext,
  Branch,
  PlayerProfile
};

// Performance types
export type {
  PerformanceOptions,
  PoolingConfig,
  ProfilingConfig
};

// Event types
export type {
  EventHandler,
  NodeChangedEvent,
  ChoiceMadeEvent,
  FlagChangedEvent
};
```

### Generic Types

```typescript
// Custom flag types
interface TypedFlags {
  [key: string]: string | number | boolean;
}

// Custom metadata types
interface CustomNodeMetadata {
  author?: string;
  difficulty?: number;
  tags?: string[];
}

// Usage with custom types
const engine = createQNCEEngine<TypedFlags, CustomNodeMetadata>(story);
```

---

## 📍 Wiki Navigation

**← Previous:** [CLI Usage](CLI-Usage) | **You are here:** API Reference | **Next:** [Contributing →](Contributing)

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • **API Reference** • [Contributing](Contributing) • [Release Notes](Release-Notes)

## 🛡️ Choice Validation API

### ChoiceValidator Interface

The `ChoiceValidator` interface defines validation logic for choice execution.

```typescript
interface ChoiceValidator {
  validate(choice: Choice, context: ValidationContext): ValidationResult;
  getAvailableChoices(context: ValidationContext): Choice[];
  addRule(rule: ValidationRule): void;
  removeRule(ruleName: string): void;
  getRules(): ValidationRule[];
}
```

### createChoiceValidator()

Creates a new choice validator with default rules.

```typescript
function createChoiceValidator(): ChoiceValidator
```

#### Returns

`ChoiceValidator` - A new validator instance with standard validation rules

#### Example

```typescript
import { createChoiceValidator } from 'qnce-engine';

const validator = createChoiceValidator();
// Has built-in rules: choice-exists, flag-conditions, choice-enabled, 
// time-conditions, inventory-conditions
```

### StandardValidationRules

Built-in validation rules for common scenarios.

```typescript
class StandardValidationRules {
  static readonly CHOICE_EXISTS: ValidationRule;
  static readonly FLAG_CONDITIONS: ValidationRule;
  static readonly CHOICE_ENABLED: ValidationRule;
  static readonly TIME_CONDITIONS: ValidationRule;
  static readonly INVENTORY_CONDITIONS: ValidationRule;
}
```

#### Available Rules

- **`CHOICE_EXISTS`** (priority: 1): Validates that choice exists in current node
- **`FLAG_CONDITIONS`** (priority: 2): Validates flag-based requirements
- **`CHOICE_ENABLED`** (priority: 3): Validates choice is not disabled
- **`TIME_CONDITIONS`** (priority: 4): Validates time-based availability
- **`INVENTORY_CONDITIONS`** (priority: 5): Validates inventory requirements

### ValidationRule Interface

Defines a custom validation rule.

```typescript
interface ValidationRule {
  name: string;
  priority: number; // Lower numbers = higher priority
  validate(choice: Choice, context: ValidationContext): ValidationResult;
}
```

### ValidationContext Interface

Context information passed to validation rules.

```typescript
interface ValidationContext {
  currentNode: NarrativeNode;
  state: QNCEState;
  availableChoices: Choice[];
  timestamp?: number;
  metadata?: Record<string, unknown>;
}
```

### ValidationResult Interface

Result returned by validation rules.

```typescript
interface ValidationResult {
  isValid: boolean;
  reason?: string;
  failedConditions?: string[];
  suggestedChoices?: Choice[];
  metadata?: Record<string, unknown>;
}
```

### ChoiceValidationError Class

Error thrown when choice validation fails.

```typescript
class ChoiceValidationError extends QNCEError {
  choice: Choice;
  validationResult: ValidationResult;
  availableChoices?: Choice[];
  
  getUserFriendlyMessage(): string;
  getDebugInfo(): Record<string, unknown>;
}
```

#### Methods

- **`getUserFriendlyMessage()`**: Returns a user-friendly error message with suggestions
- **`getDebugInfo()`**: Returns detailed debugging information for developers

### Enhanced Choice Interface

The `Choice` interface has been extended with validation properties.

```typescript
interface Choice {
  text: string;
  nextNodeId: string;
  flagEffects?: Record<string, unknown>;
  
  // Validation properties
  flagRequirements?: Record<string, unknown>;
  timeRequirements?: {
    minTime?: number;
    maxTime?: number;
    availableAfter?: Date;
    availableBefore?: Date;
  };
  inventoryRequirements?: Record<string, number>;
  enabled?: boolean;
}
```

#### New Properties

- **`flagRequirements`**: Required flag values for choice availability
- **`timeRequirements`**: Time-based availability constraints
- **`inventoryRequirements`**: Required inventory items and quantities
- **`enabled`**: Whether choice is enabled (true by default)

### Validation Utility Functions

```typescript
// Create validation context
function createValidationContext(
  currentNode: NarrativeNode,
  state: QNCEState,
  availableChoices: Choice[]
): ValidationContext;

// Check if error is a choice validation error
function isChoiceValidationError(error: unknown): error is ChoiceValidationError;
```

### Engine Integration

The QNCE Engine automatically integrates choice validation:

```typescript
class QNCEEngine {
  // Validation methods
  getChoiceValidator(): ChoiceValidator;
  setChoiceValidator(validator: ChoiceValidator): void;
  validateChoice(choice: Choice): ValidationResult;
  
  // Enhanced methods with validation
  getAvailableChoices(): Choice[]; // Now uses validator
  makeChoice(choiceIndex: number): void; // Now validates before execution
}
```

#### New Methods

- **`getChoiceValidator()`**: Get the current choice validator
- **`setChoiceValidator(validator)`**: Set a custom choice validator
- **`validateChoice(choice)`**: Manually validate a specific choice

### Usage Examples

#### Basic Validation

```typescript
const engine = createQNCEEngine(storyData);

// makeChoice automatically validates
try {
  engine.makeChoice(0);
} catch (error) {
  if (isChoiceValidationError(error)) {
    console.error('Validation failed:', error.message);
  }
}
```

#### Custom Validation Rules

```typescript
const validator = createChoiceValidator();

validator.addRule({
  name: 'weather-check',
  priority: 6,
  validate: (choice, context) => {
    if (choice.text.includes('outside') && context.state.flags.weather === 'storm') {
      return {
        isValid: false,
        reason: 'Cannot go outside during a storm!',
        failedConditions: ['bad-weather']
      };
    }
    return { isValid: true };
  }
});

engine.setChoiceValidator(validator);
```

#### Flag-Based Choices

```typescript
const restrictedChoice = {
  text: 'Open secret door',
  nextNodeId: 'secret_room',
  flagRequirements: {
    hasKey: true,
    discoveredSecret: true,
    playerLevel: 10
  }
};
```

#### Time-Based Choices

```typescript
const timedChoice = {
  text: 'Visit the night market',
  nextNodeId: 'market',
  timeRequirements: {
    availableAfter: new Date('2025-01-01T20:00:00'),
    availableBefore: new Date('2025-01-01T23:59:59')
  }
};
```

#### Inventory-Based Choices

```typescript
const expensiveChoice = {
  text: 'Buy magical armor',
  nextNodeId: 'shop_armor',
  inventoryRequirements: {
    gold: 500,
    gems: 3,
    enchantment_tokens: 1
  }
};
```
