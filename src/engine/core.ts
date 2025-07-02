// QNCE Core Engine - Framework Agnostic
// Quantum Narrative Convergence Engine

import { poolManager, PooledFlow, PooledNode } from '../performance/ObjectPool';
import { getThreadPool, ThreadPoolConfig } from '../performance/ThreadPool';
import { perf, getPerfReporter } from '../performance/PerfReporter';

// Branching system imports
import { QNCEBranchingEngine, createBranchingEngine } from '../narrative/branching';
import { QNCEStory } from '../narrative/branching/models';

// QNCE Data Models
export interface Choice {
  text: string;
  nextNodeId: string;
  flagEffects?: Record<string, unknown>;
}

export interface NarrativeNode {
  id: string;
  text: string;
  choices: Choice[];
}

export interface QNCEState {
  currentNodeId: string;
  flags: Record<string, unknown>;
  history: string[];
}

export interface FlowEvent {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
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
 * Framework agnostic implementation with object pooling integration
 */
export class QNCEEngine {
  private state: QNCEState;
  private storyData: StoryData;
  private activeFlowEvents: FlowEvent[] = [];
  private performanceMode: boolean = false;
  private enableProfiling: boolean = false;
  private branchingEngine?: QNCEBranchingEngine;

  constructor(
    storyData: StoryData, 
    initialState?: Partial<QNCEState>, 
    performanceMode: boolean = false,
    threadPoolConfig?: Partial<ThreadPoolConfig>
  ) {
    this.storyData = storyData;
    this.performanceMode = performanceMode;
    this.enableProfiling = performanceMode; // Enable profiling with performance mode
    
    // Initialize ThreadPool if in performance mode
    if (this.performanceMode && threadPoolConfig) {
      getThreadPool(threadPoolConfig);
    }
    
    this.state = {
      currentNodeId: initialState?.currentNodeId || storyData.initialNodeId,
      flags: initialState?.flags || {},
      history: initialState?.history || [storyData.initialNodeId],
    };
  }

  getCurrentNode(): NarrativeNode {
    const cacheKey = `node-${this.state.currentNodeId}`;
    
    // Profiling: Record cache operation
    if (this.enableProfiling) {
      const found = findNode(this.storyData.nodes, this.state.currentNodeId);
      perf.cacheHit(cacheKey, { nodeId: this.state.currentNodeId });
      return found;
    }
    
    if (this.performanceMode) {
      // Use pooled node for enhanced node data
      const pooledNode = poolManager.borrowNode();
      const coreNode = findNode(this.storyData.nodes, this.state.currentNodeId);
      pooledNode.initialize(coreNode.id, coreNode.text, coreNode.choices);
      
      // Return the pooled node (caller should return it when done)
      return {
        id: pooledNode.id,
        text: pooledNode.text,
        choices: pooledNode.choices as Choice[]
      };
    }
    
    return findNode(this.storyData.nodes, this.state.currentNodeId);
  }

  getState(): QNCEState {
    return { ...this.state };
  }

  getFlags(): Record<string, unknown> {
    return { ...this.state.flags };
  }

  getHistory(): string[] {
    return [...this.state.history];
  }

  selectChoice(choice: Choice): void {
    // S2-T4: Add state transition profiling
    const transitionSpanId = this.enableProfiling 
      ? getPerfReporter().startSpan('state-transition', { 
          fromNodeId: this.state.currentNodeId, 
          toNodeId: choice.nextNodeId,
          hasEffects: !!choice.flagEffects 
        })
      : null;

    const fromNodeId = this.state.currentNodeId;
    const toNodeId = choice.nextNodeId;
    
    // Create flow event for tracking narrative progression
    if (this.performanceMode) {
      const flowSpanId = this.enableProfiling 
        ? perf.flowStart(fromNodeId, { toNodeId })
        : null;
        
      const flowEvent = this.createFlowEvent(fromNodeId, toNodeId, choice.flagEffects);
      this.recordFlowEvent(flowEvent);
      
      // Return the flow immediately after recording (we don't need to keep it)
      // This ensures proper pool recycling
      poolManager.returnFlow(flowEvent);
      
      if (flowSpanId) {
        perf.flowComplete(flowSpanId, toNodeId, { transitionType: 'choice' });
      }
    }
    
    this.state.currentNodeId = choice.nextNodeId;
    this.state.history.push(choice.nextNodeId);
    
    if (choice.flagEffects) {
      this.state.flags = { ...this.state.flags, ...choice.flagEffects };
      
      // S2-T4: Track flag updates
      if (this.enableProfiling) {
        perf.record('custom', { 
          flagCount: Object.keys(choice.flagEffects).length,
          nodeId: toNodeId,
          eventType: 'flag-update'
        });
      }
    }
    
    // Complete state transition span
    if (transitionSpanId) {
      getPerfReporter().endSpan(transitionSpanId, { 
        historyLength: this.state.history.length,
        flagCount: Object.keys(this.state.flags).length
      });
    }
    
    // S2-T2: Background operations after state change
    if (this.performanceMode) {
      // Preload next possible nodes in background
      this.preloadNextNodes().catch(error => {
        console.warn('[QNCE] Background preload failed:', error.message);
      });
      
      // Write telemetry data in background  
      this.backgroundTelemetryWrite({
        action: 'choice-selected',
        fromNodeId,
        toNodeId,
        choiceText: choice.text.slice(0, 50) // First 50 chars for privacy
      }).catch(error => {
        console.warn('[QNCE] Background telemetry failed:', error.message);
      });
    }
  }

  resetNarrative(): void {
    // Clean up pooled objects before reset
    if (this.performanceMode) {
      this.cleanupPools();
    }
    
    this.state.currentNodeId = this.storyData.initialNodeId;
    this.state.flags = {};
    this.state.history = [this.storyData.initialNodeId];
  }

  loadState(state: QNCEState): void {
    this.state = { ...state };
  }

  // Utility method for checking flag conditions
  checkFlag(flagName: string, expectedValue?: unknown): boolean {
    if (expectedValue === undefined) {
      return this.state.flags[flagName] !== undefined;
    }
    return this.state.flags[flagName] === expectedValue;
  }

  // Get available choices (with potential flag-based filtering)
  getAvailableChoices(): Choice[] {
    const currentNode = this.getCurrentNode();
    return currentNode.choices.filter(() => {
      // Future: Add flag-based choice filtering logic here
      return true;
    });
  }

  // Performance and object pooling methods
  
  /**
   * Create a flow event using pooled objects for performance tracking
   */
  private createFlowEvent(fromNodeId: string, toNodeId: string, metadata?: Record<string, unknown>): PooledFlow {
    const flow = poolManager.borrowFlow();
    flow.initialize(fromNodeId, metadata);
    flow.addTransition(fromNodeId, toNodeId);
    return flow;
  }
  
  /**
   * Record and manage flow events
   */
  private recordFlowEvent(flow: PooledFlow): void {
    const flowEvent: FlowEvent = {
      id: `${flow.nodeId}-${Date.now()}`,
      fromNodeId: flow.nodeId,
      toNodeId: flow.transitions[flow.transitions.length - 1]?.split('->')[1] || '',
      timestamp: flow.timestamp,
      metadata: flow.metadata
    };
    
    this.activeFlowEvents.push(flowEvent);
    
    // Clean up old flow events (basic LRU-style cleanup)
    if (this.activeFlowEvents.length > 10) {
      this.activeFlowEvents.shift(); // Remove oldest
    }
  }
  
  /**
   * Get current flow events (for debugging/monitoring)
   */
  getActiveFlows(): FlowEvent[] {
    return [...this.activeFlowEvents];
  }
  
  /**
   * Get object pool statistics for performance monitoring
   */
  getPoolStats() {
    return this.performanceMode ? poolManager.getAllStats() : null;
  }
  
  /**
   * Return all pooled objects (cleanup method)
   */
  private cleanupPools(): void {
    // Clear flow events (no pooled objects to return since we return them immediately)
    this.activeFlowEvents.length = 0;
  }

  // S2-T2: Background ThreadPool Operations
  
  /**
   * Preload next possible nodes in background using ThreadPool
   */
  async preloadNextNodes(choice?: Choice): Promise<void> {
    if (!this.performanceMode) return;
    
    const threadPool = getThreadPool();
    const currentNode = this.getCurrentNode();
    const choicesToPreload = choice ? [choice] : currentNode.choices;
    
    // Submit background jobs for each node to preload
    for (const ch of choicesToPreload) {
      threadPool.submitJob('cache-load', { nodeId: ch.nextNodeId }, 'normal').catch(error => {
        if (this.enableProfiling) {
          perf.record('cache-miss', { 
            nodeId: ch.nextNodeId, 
            error: error.message,
            jobType: 'preload' 
          });
        }
      });
    }
  }
  
  /**
   * Write telemetry data in background using ThreadPool
   */
  async backgroundTelemetryWrite(eventData: Record<string, unknown>): Promise<void> {
    if (!this.performanceMode || !this.enableProfiling) return;
    
    const threadPool = getThreadPool();
    const telemetryData = {
      timestamp: performance.now(),
      sessionId: this.state.history[0], // Use first node as session ID
      eventData,
      stateSnapshot: {
        nodeId: this.state.currentNodeId,
        flagCount: Object.keys(this.state.flags).length,
        historyLength: this.state.history.length
      }
    };
    
    threadPool.submitJob('telemetry-write', telemetryData, 'low').catch(error => {
      console.warn('[QNCE] Telemetry write failed:', error.message);
    });
  }

  // ================================
  // Sprint #3: Advanced Branching System Integration
  // ================================

  /**
   * Enable advanced branching capabilities for this story
   * Integrates the QNCE Branching API with the core engine
   */
  enableBranching(story: QNCEStory): QNCEBranchingEngine {
    if (this.branchingEngine) {
      console.warn('[QNCE] Branching already enabled for this engine instance');
      return this.branchingEngine;
    }

    // Create branching engine with current state
    this.branchingEngine = createBranchingEngine(story, this.state);

    if (this.enableProfiling) {
      perf.record('custom', {
        eventType: 'branching-enabled',
        storyId: story.id,
        chapterCount: story.chapters.length,
        performanceMode: this.performanceMode
      });
    }

    return this.branchingEngine;
  }

  /**
   * Get the branching engine if enabled
   */
  getBranchingEngine(): QNCEBranchingEngine | undefined {
    return this.branchingEngine;
  }

  /**
   * Check if branching is enabled
   */
  isBranchingEnabled(): boolean {
    return !!this.branchingEngine;
  }

  /**
   * Sync core engine state with branching engine
   * Call this when core state changes to keep branching engine updated
   */
  syncBranchingState(): void {
    if (this.branchingEngine) {
      // The branching engine maintains its own state copy
      // This method could be extended to sync state changes
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'branching-state-synced',
          currentNodeId: this.state.currentNodeId
        });
      }
    }
  }

  /**
   * Disable branching and cleanup resources
   */
  disableBranching(): void {
    if (this.branchingEngine) {
      this.branchingEngine = undefined;
      
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'branching-disabled'
        });
      }
    }
  }
  
  /**
   * Background cache warming for story data
   */
  async warmCache(): Promise<void> {
    if (!this.performanceMode) return;
    
    const threadPool = getThreadPool();
    
    // Cache all nodes in background
    const cacheWarmData = { 
      nodeIds: this.storyData.nodes.map(n => n.id),
      storyId: this.storyData.initialNodeId 
    };
    
    if (this.enableProfiling) {
      perf.record('custom', { 
        eventType: 'cache-warm-start',
        nodeCount: this.storyData.nodes.length 
      });
    }
    
    threadPool.submitJob('cache-load', cacheWarmData, 'low').catch(error => {
      if (this.enableProfiling) {
        perf.record('custom', { 
          eventType: 'cache-warm-failed',
          error: error.message 
        });
      }
    });
  }
}

/**
 * Factory function to create a QNCE engine instance
 */
export function createQNCEEngine(
  storyData: StoryData, 
  initialState?: Partial<QNCEState>, 
  performanceMode: boolean = false
): QNCEEngine {
  return new QNCEEngine(storyData, initialState, performanceMode);
}

/**
 * Load story data from JSON
 */
export function loadStoryData(jsonData: unknown): StoryData {
  // Add validation here in the future
  return jsonData as StoryData;
}
