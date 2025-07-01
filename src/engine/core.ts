// QNCE Core Engine - Framework Agnostic
// Quantum Narrative Convergence Engine

// QNCE Data Models
export interface Choice {
  text: string;
  nextNodeId: string;
  flagEffects?: Record<string, any>;
}

export interface NarrativeNode {
  id: string;
  text: string;
  choices: Choice[];
}

export interface QNCEState {
  currentNodeId: string;
  flags: Record<string, any>;
  history: string[];
}

export interface StoryData {
  nodes: NarrativeNode[];
  initialNodeId: string;
}

// Demo narrative data moved to demo-story.ts

function findNode(nodes: NarrativeNode[], id: string): NarrativeNode {
  const node = nodes.find(n => n.id === id);
  if (!node) throw new Error(`Node not found: ${id}`);
  return node;
}

/**
 * QNCE Engine - Core narrative state management
 * Framework agnostic implementation
 */
export class QNCEEngine {
  private state: QNCEState;
  private storyData: StoryData;

  constructor(storyData: StoryData, initialState?: Partial<QNCEState>) {
    this.storyData = storyData;
    this.state = {
      currentNodeId: initialState?.currentNodeId || storyData.initialNodeId,
      flags: initialState?.flags || {},
      history: initialState?.history || [storyData.initialNodeId],
    };
  }

  getCurrentNode(): NarrativeNode {
    return findNode(this.storyData.nodes, this.state.currentNodeId);
  }

  getState(): QNCEState {
    return { ...this.state };
  }

  getFlags(): Record<string, any> {
    return { ...this.state.flags };
  }

  getHistory(): string[] {
    return [...this.state.history];
  }

  selectChoice(choice: Choice): void {
    this.state.currentNodeId = choice.nextNodeId;
    this.state.history.push(choice.nextNodeId);
    
    if (choice.flagEffects) {
      this.state.flags = { ...this.state.flags, ...choice.flagEffects };
    }
  }

  resetNarrative(): void {
    this.state.currentNodeId = this.storyData.initialNodeId;
    this.state.flags = {};
    this.state.history = [this.storyData.initialNodeId];
  }

  loadState(state: QNCEState): void {
    this.state = { ...state };
  }

  // Utility method for checking flag conditions
  checkFlag(flagName: string, expectedValue?: any): boolean {
    if (expectedValue === undefined) {
      return this.state.flags[flagName] !== undefined;
    }
    return this.state.flags[flagName] === expectedValue;
  }

  // Get available choices (with potential flag-based filtering)
  getAvailableChoices(): Choice[] {
    const currentNode = this.getCurrentNode();
    return currentNode.choices.filter(choice => {
      // Future: Add flag-based choice filtering logic here
      return true;
    });
  }
}

/**
 * Factory function to create a QNCE engine instance
 */
export function createQNCEEngine(storyData: StoryData, initialState?: Partial<QNCEState>): QNCEEngine {
  return new QNCEEngine(storyData, initialState);
}

/**
 * Load story data from JSON
 */
export function loadStoryData(jsonData: any): StoryData {
  // Add validation here in the future
  return jsonData as StoryData;
}
