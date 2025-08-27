// QNCE Core Engine - Framework Agnostic
// Quantum Narrative Convergence Engine

import { poolManager, PooledFlow } from '../performance/ObjectPool';
import { getThreadPool, ThreadPoolConfig } from '../performance/ThreadPool';
import { perf, getPerfReporter } from '../performance/PerfReporter';

// Branching system imports
import { QNCEBranchingEngine, createBranchingEngine } from '../narrative/branching';
import { QNCEStory } from '../narrative/branching/models';

// Choice validation system - Sprint 3.2
import { 
  ChoiceValidator, 
  createChoiceValidator, 
  createValidationContext,
  ValidationResult
} from './validation';
import { 
  QNCENavigationError, 
  ChoiceValidationError
} from './errors';

// Re-export error classes for backward compatibility
export { QNCENavigationError, ChoiceValidationError } from './errors';

// State persistence imports - Sprint 3.3
import { 
  SerializedState, 
  Checkpoint, 
  CheckpointManager,
  SerializationOptions, 
  LoadOptions, 
  PersistenceResult,
  CheckpointOptions,
  SerializationMetadata,
  PERSISTENCE_VERSION
} from './types';
import { StorageAdapter } from './types';

// Conditional choice evaluator - Sprint 3.4
import { 
  conditionEvaluator, 
  ConditionEvaluator, 
  ConditionEvaluationError, 
  ConditionContext, 
  CustomEvaluatorFunction 
} from './condition';

// Sprint 3.5: Autosave and Undo/Redo imports
import {
  HistoryEntry,
  AutosaveConfig,
  UndoRedoConfig,
  UndoRedoResult,
  AutosaveResult,
  HistoryManager,
  AutosaveEvent,
  UndoRedoEvent
} from './types';

export interface Choice {
  text: string;
  nextNodeId: string;
  flagEffects?: Record<string, unknown>;
  
  // Sprint 3.2: Validation properties
  flagRequirements?: Record<string, unknown>;
  timeRequirements?: {
    minTime?: number;
    maxTime?: number;
    availableAfter?: Date;
    availableBefore?: Date;
  };
  inventoryRequirements?: Record<string, number>;
  enabled?: boolean;
  
  // Sprint 3.4: Conditional choice display
  condition?: string; // Expression string for choice visibility (e.g., "flags.curiosity >= 3 && !flags.seenEnding")
}

export interface NarrativeNode {
  id: string;
  text: string;
  choices: Choice[];
  // Optional metadata bag for adapters/importers
  meta?: {
    tags?: string[];
  };
}

export { QNCEStory };

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
  public storyData: StoryData; // Made public for hot-reload compatibility
  private activeFlowEvents: FlowEvent[] = [];
  private performanceMode: boolean = false;
  private enableProfiling: boolean = false;
  private branchingEngine?: QNCEBranchingEngine;
  private choiceValidator: ChoiceValidator; // Sprint 3.2: Choice validation
  
  // Sprint 3.3: State persistence and checkpoints
  private checkpoints: Map<string, Checkpoint> = new Map();
  private maxCheckpoints: number = 50;
  private autoCheckpointEnabled: boolean = false;

  // Sprint 3.3: State persistence properties
  private checkpointManager?: CheckpointManager;

  // Sprint 3.5: Autosave and Undo/Redo properties
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private autosaveConfig: AutosaveConfig = {
    enabled: false,
    triggers: ['choice', 'flag-change'],
    maxEntries: 10,
    throttleMs: 1000,
    includeMetadata: true
  };
  private undoRedoConfig: UndoRedoConfig = {
    enabled: true,
    maxUndoEntries: 50,
    maxRedoEntries: 20,
    trackFlagChanges: true,
    trackChoiceText: true,
    trackActions: ['choice', 'flag-change', 'state-load']
  };
  private lastAutosaveTime: number = 0;
  private isUndoRedoOperation: boolean = false;
  private storageAdapter?: StorageAdapter;

  // Sprint 4.1: Telemetry support
  private telemetry?: import('../telemetry/types').Telemetry;
  private defaultTelemetryCtx?: import('../telemetry/types').QEvent['ctx'];

  public get flags(): Record<string, unknown> {
    return this.state.flags;
  }

  public get history(): string[] {
    return this.state.history;
  }

  public get isComplete(): boolean {
    try {
      return this.getCurrentNode().choices.length === 0;
    } catch {
      return true; // If current node not found, consider it complete
    }
  }

  constructor(
    storyData: StoryData, 
    initialState?: Partial<QNCEState>, 
    performanceMode: boolean = false,
    threadPoolConfig?: Partial<ThreadPoolConfig>,
    options?: { telemetry?: import('../telemetry/types').Telemetry; env?: 'dev' | 'test' | 'prod'; appVersion?: string; sessionId?: string; }
  ) {
    this.storyData = storyData;
    this.performanceMode = performanceMode;
    this.enableProfiling = performanceMode; // Enable profiling with performance mode
    
    // Initialize choice validator (Sprint 3.2)
    this.choiceValidator = createChoiceValidator();
    
    // Initialize ThreadPool if in performance mode
    if (this.performanceMode && threadPoolConfig) {
      getThreadPool(threadPoolConfig);
    }
    
    this.state = {
      currentNodeId: initialState?.currentNodeId || storyData.initialNodeId,
      flags: initialState?.flags || {},
      history: initialState?.history || [storyData.initialNodeId],
    };

    // Telemetry wiring
    this.telemetry = options?.telemetry;
    if (this.telemetry) {
      const sessionId = options?.sessionId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
      this.defaultTelemetryCtx = {
        sessionId,
        storyId: undefined,
        appVersion: options?.appVersion,
        engineVersion: PERSISTENCE_VERSION,
        env: options?.env
      };
      try {
        this.telemetry.emit({ type: 'session.start', payload: { initialNodeId: this.state.currentNodeId }, ts: Date.now(), ctx: this.defaultTelemetryCtx });
      } catch {}
    }
  }

  // Lane B: StorageAdapter integration
  /** Attach a storage adapter for persistence */
  attachStorageAdapter(adapter: StorageAdapter): void {
    this.storageAdapter = adapter;
  }

  /** Save current state through the attached storage adapter */
  async saveToStorage(key: string, options: SerializationOptions = {}): Promise<PersistenceResult> {
    if (!this.storageAdapter) return { success: false, error: 'No storage adapter attached' };
  const t0 = Date.now();
  const serialized = await this.saveState(options);
  const res = await this.storageAdapter.save(key, serialized, options);
  try { this.telemetry?.emit({ type: 'storage.op', payload: { op: 'save', key, ms: Date.now() - t0, ok: !!res?.success }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return res;
  }

  /** Load state from the attached storage adapter */
  async loadFromStorage(key: string, options: LoadOptions = {}): Promise<PersistenceResult> {
    if (!this.storageAdapter) return { success: false, error: 'No storage adapter attached' };
  const t0 = Date.now();
  const serialized = await this.storageAdapter.load(key, options);
    if (!serialized) return { success: false, error: `No data for key: ${key}` };
  const res = await this.loadState(serialized, options);
  try { this.telemetry?.emit({ type: 'storage.op', payload: { op: 'load', key, ms: Date.now() - t0, ok: !!res?.success }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return res;
  }

  /** Delete a stored state via the adapter */
  async deleteFromStorage(key: string): Promise<boolean> {
    if (!this.storageAdapter) return false;
  const t0 = Date.now();
  const ok = await this.storageAdapter.delete(key);
  try { this.telemetry?.emit({ type: 'storage.op', payload: { op: 'delete', key, ms: Date.now() - t0, ok }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return ok;
  }

  /** List keys from the adapter */
  async listStorageKeys(): Promise<string[]> {
    if (!this.storageAdapter) return [];
  const t0 = Date.now();
  const keys = await this.storageAdapter.list();
  try { this.telemetry?.emit({ type: 'storage.op', payload: { op: 'list', count: keys.length, ms: Date.now() - t0, ok: true }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return keys;
  }

  /** Check if a key exists via the adapter */
  async storageExists(key: string): Promise<boolean> {
    if (!this.storageAdapter) return false;
    return this.storageAdapter.exists(key);
  }

  /** Clear all stored data via the adapter */
  async clearStorage(): Promise<boolean> {
    if (!this.storageAdapter) return false;
  const t0 = Date.now();
  const ok = await this.storageAdapter.clear();
  try { this.telemetry?.emit({ type: 'storage.op', payload: { op: 'clear', ms: Date.now() - t0, ok }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return ok;
  }

  /** Get storage statistics from the adapter */
  async getStorageStats(): Promise<{ totalSize: number; keyCount: number; [key: string]: unknown } | null> {
    if (!this.storageAdapter) return null;
    return this.storageAdapter.getStats();
  }

  // Sprint 3.1 - API Consistency Methods
  
  /**
   * Navigate directly to a specific node by ID
   * @param nodeId - The ID of the node to navigate to
   * @throws {QNCENavigationError} When nodeId is invalid or not found
   */
  goToNodeById(nodeId: string): void {
    // Validate node exists
    const targetNode = this.storyData.nodes.find(n => n.id === nodeId);
    if (!targetNode) {
      throw new QNCENavigationError(`Node not found: ${nodeId}`);
    }

    // Performance profiling for direct navigation
    const navigationSpanId = this.enableProfiling 
      ? getPerfReporter().startSpan('custom', {
          fromNodeId: this.state.currentNodeId,
          toNodeId: nodeId,
          navigationType: 'direct'
        })
      : null;

    const fromNodeId = this.state.currentNodeId;
    
    // Update state
    this.state.currentNodeId = nodeId;
    this.state.history.push(nodeId);
    
    // Record navigation event for analytics
    if (this.performanceMode) {
      const flowEvent = this.createFlowEvent(fromNodeId, nodeId, { navigationType: 'direct' });
      this.recordFlowEvent(flowEvent);
      poolManager.returnFlow(flowEvent);
    }
    
    // End profiling span
    if (navigationSpanId && this.enableProfiling) {
      getPerfReporter().endSpan(navigationSpanId, {
        success: true,
        targetNodeId: nodeId
      });
    }
  }

  /**
   * Get the current narrative node
   * @returns The current node object
   */
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
    
  const node = findNode(this.storyData.nodes, this.state.currentNodeId);
  try { this.telemetry?.emit({ type: 'node.enter', payload: { nodeId: node.id }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
  return node;
  }

  /**
   * Get available choices from the current node with validation and conditional filtering
   * @returns Array of available choices
   */
  getAvailableChoices(): Choice[] {
    const currentNode = this.getCurrentNode();
    const context: ConditionContext = {
      state: this.state,
      timestamp: Date.now(),
      customData: {}
    };

    // First apply conditional filtering (Sprint 3.4)
    const conditionallyAvailable = currentNode.choices.filter((choice) => {
      // If no condition is specified, choice is always available
      if (!choice.condition) {
        return true;
      }

      try {
        // Evaluate the condition using the condition evaluator
        const t0 = Date.now();
        const res = conditionEvaluator.evaluate(choice.condition, context);
        try { this.telemetry?.emit({ type: 'expression.evaluate', payload: { ok: true, ms: Date.now() - t0 }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
        return res;
      } catch (error) {
        // Log condition evaluation errors but don't block other choices
        if (error instanceof ConditionEvaluationError) {
          console.warn(`[QNCE] Choice condition evaluation failed: ${error.message}`, {
            choiceText: choice.text,
            condition: choice.condition,
            nodeId: this.state.currentNodeId
          });
          try { this.telemetry?.emit({ type: 'expression.evaluate', payload: { ok: false, error: 'ConditionEvaluationError' }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
        } else {
          console.warn(`[QNCE] Unexpected error evaluating choice condition:`, error);
          try { this.telemetry?.emit({ type: 'engine.error', payload: { where: 'getAvailableChoices', error: (error as any)?.message || String(error) }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
        }
        
        // Return false for invalid conditions (choice won't be shown)
        return false;
      }
    });

    // Then apply choice validation (Sprint 3.2)
    const validationContext = createValidationContext(
      currentNode,
      this.state,
      conditionallyAvailable  // Pass the conditionally filtered choices
    );
    
    return this.choiceValidator.getAvailableChoices(validationContext);
  }

  makeChoice(choiceIndex: number): void {
    const choices = this.getAvailableChoices();
    if (choiceIndex < 0 || choiceIndex >= choices.length) {
      throw new QNCENavigationError(`Invalid choice index: ${choiceIndex}. Please select a number between 1 and ${choices.length}.`);
    }
    
    const selectedChoice = choices[choiceIndex];
    
    // Sprint 3.2: Validate choice before execution
    const currentNode = this.getCurrentNode();
    const context = createValidationContext(
      currentNode,
      this.state,
      choices
    );
    
    const validationResult = this.choiceValidator.validate(selectedChoice, context);
    if (!validationResult.isValid) {
      throw new ChoiceValidationError(selectedChoice, validationResult, choices);
    }
    
    // Execute the validated choice
    this.selectChoice(selectedChoice);
  }

  getState(): QNCEState {
    return { ...this.state };
  }

  getFlags(): Record<string, unknown> {
    return { ...this.state.flags };
  }

  setFlag(key: string, value: unknown): void {
    // Sprint 3.5: Save state for undo before making changes
    const preChangeState = this.deepCopy(this.state);
    
    this.state.flags[key] = value;
    
    // Sprint 3.5: Track state change for undo/redo
    if (this.undoRedoConfig.enabled && !this.isUndoRedoOperation && 
        this.undoRedoConfig.trackActions.includes('flag-change')) {
      this.pushToUndoStack(preChangeState, 'flag-change', {
        flagsChanged: [key],
        flagValue: value
      });
    }
    
    // Sprint 3.5: Trigger autosave if enabled
    if (this.autosaveConfig.enabled && this.autosaveConfig.triggers.includes('flag-change')) {
      this.triggerAutosave('flag-change', {
        flagKey: key,
        flagValue: value
      }).catch((error: Error) => {
        console.warn('[QNCE] Autosave failed:', error.message);
      });
    }
  }

  getHistory(): string[] {
    return [...this.state.history];
  }

  selectChoice(choice: Choice): void {
    // Sprint 3.5: Save state for undo before making changes
    const preChangeState = this.deepCopy(this.state);
    
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

  // Telemetry: choice.select
  try { this.telemetry?.emit({ type: 'choice.select', payload: { fromNodeId, toNodeId, choiceText: choice.text }, ts: Date.now(), ctx: this.defaultTelemetryCtx! }); } catch {}
    
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
    
    // Sprint 3.5: Track state change for undo/redo
    if (this.undoRedoConfig.enabled && !this.isUndoRedoOperation && 
        this.undoRedoConfig.trackActions.includes('choice')) {
      this.pushToUndoStack(preChangeState, 'choice', {
        nodeId: fromNodeId,
        choiceText: this.undoRedoConfig.trackChoiceText ? choice.text : undefined,
        flagsChanged: choice.flagEffects ? Object.keys(choice.flagEffects) : undefined
      });
    }
    
    // Sprint 3.5: Trigger autosave if enabled
    if (this.autosaveConfig.enabled && this.autosaveConfig.triggers.includes('choice')) {
      this.triggerAutosave('choice', {
        fromNodeId,
        toNodeId,
        choiceText: choice.text
      }).catch(error => {
        console.warn('[QNCE] Autosave failed:', error.message);
      });
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

  /** Flush telemetry (useful before process exit) */
  async flushTelemetry(): Promise<void> { try { await this.telemetry?.flush(); } catch {} }

  resetNarrative(): void {
    // Sprint 3.5: Save state for undo before reset
    const preChangeState = this.deepCopy(this.state);
    
    // Clean up pooled objects before reset
    if (this.performanceMode) {
      this.cleanupPools();
    }
    
    this.state.currentNodeId = this.storyData.initialNodeId;
    this.state.flags = {};
    this.state.history = [this.storyData.initialNodeId];
    
    // Sprint 3.5: Track state change for undo/redo
    if (this.undoRedoConfig.enabled && !this.isUndoRedoOperation && 
        this.undoRedoConfig.trackActions.includes('reset')) {
      this.pushToUndoStack(preChangeState, 'reset', {
        nodeId: this.storyData.initialNodeId
      });
    }
  }

  /**
   * Load simple state (legacy method for backward compatibility)
   * @param state - QNCEState to load
   */
  loadSimpleState(state: QNCEState): void {
    // Sprint 3.5: Save state for undo before loading
    const preChangeState = this.deepCopy(this.state);
    
    this.state = { ...state };
    
    // Sprint 3.5: Track state change for undo/redo
    if (this.undoRedoConfig.enabled && !this.isUndoRedoOperation && 
        this.undoRedoConfig.trackActions.includes('state-load')) {
      this.pushToUndoStack(preChangeState, 'state-load', {
        nodeId: state.currentNodeId
      });
    }
    
    // Sprint 3.5: Trigger autosave if enabled
    if (this.autosaveConfig.enabled && this.autosaveConfig.triggers.includes('state-load')) {
      this.triggerAutosave('state-load', {
        nodeId: state.currentNodeId
      }).catch((error: Error) => {
        console.warn('[QNCE] Autosave failed:', error.message);
      });
    }
  }

  // Sprint 3.3: State Persistence & Checkpoints Implementation

  /**
   * Save current engine state to a serialized format
   * @param options - Serialization options
   * @returns Promise resolving to serialized state
   */
  async saveState(options: SerializationOptions = {}): Promise<SerializedState> {
    const startTime = performance.now();

    if (!this.state.currentNodeId) {
      throw new Error('Invalid state: currentNodeId is missing.');
    }
    
    try {
      // Create serialization metadata
      const metadata: SerializationMetadata = {
        engineVersion: PERSISTENCE_VERSION,
        timestamp: new Date().toISOString(),
        storyId: this.generateStoryHash(),
        customMetadata: options.customMetadata || {},
        compression: options.compression || 'none'
      };

      // Build serialized state
      const serializedState: SerializedState = {
        state: this.deepCopy(this.state),
        flowEvents: options.includeFlowEvents !== false ? 
          this.deepCopy(this.activeFlowEvents) : [],
        metadata
      };

      // Add optional data based on options
      if (options.includePerformanceData && this.performanceMode) {
        serializedState.performanceState = {
          performanceMode: this.performanceMode,
          enableProfiling: this.enableProfiling,
          backgroundTasks: [], // Would be populated with actual background task IDs
          telemetryData: [] // Would be populated with telemetry history
        };
        
        serializedState.poolStats = this.getPoolStats() || {};
      }

      if (options.includeBranchingContext && this.branchingEngine) {
        serializedState.branchingContext = {
          activeBranches: [], // Would be populated from branching engine
          branchStates: {},
          convergencePoints: []
        };
      }

      if (options.includeValidationState) {
        serializedState.validationState = {
          disabledRules: [],
          customRules: {},
          validationErrors: []
        };
      }

      // Generate checksum if requested
      if (options.generateChecksum) {
        const stateToHash = { ...serializedState };
        delete (stateToHash.metadata as any).checksum; // Exclude checksum from hash
        const stateString = JSON.stringify(stateToHash);
        metadata.checksum = await this.generateChecksum(stateString);
        serializedState.metadata = metadata;
      }

      // Performance tracking
      if (this.enableProfiling) {
        const duration = performance.now() - startTime;
        perf.record('custom', {
          eventType: 'state-serialized',
          duration,
          stateSize: JSON.stringify(serializedState).length,
          includePerformance: !!options.includePerformanceData,
          includeFlowEvents: options.includeFlowEvents !== false
        });
      }

      return serializedState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown serialization error';
      
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'state-serialization-failed',
          error: errorMessage,
          duration: performance.now() - startTime
        });
      }
      
      throw new Error(`Failed to save state: ${errorMessage}`);
    }
  }

  /**
   * Load engine state from serialized format
   * @param serializedState - The serialized state to load
   * @param options - Load options
   * @returns Promise resolving to persistence result
   */
  async loadState(serializedState: SerializedState, options: LoadOptions = {}): Promise<PersistenceResult> {
    const startTime = performance.now();
    
    try {
      // Validate serialized state structure
      const validationResult = this.validateSerializedState(serializedState);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid serialized state: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Check compatibility
      if (!options.skipCompatibilityCheck) {
        const compatibilityCheck = this.checkCompatibility(serializedState.metadata);
        if (!compatibilityCheck.compatible) {
          return {
            success: false,
            error: `Incompatible state version: ${compatibilityCheck.reason}`,
            warnings: compatibilityCheck.suggestions
          };
        }
      }

      // Verify checksum if available and requested
      if (options.verifyChecksum && serializedState.metadata.checksum) {
        const isValid = await this.verifyChecksum(serializedState);
        if (!isValid) {
          return {
            success: false,
            error: 'Checksum verification failed - state may be corrupted'
          };
        }
      }

      // Story hash validation
      if (this.generateStoryHash() !== serializedState.metadata.storyId) {
        return {
          success: false,
          error: 'Story hash mismatch. The state belongs to a different narrative.'
        };
      }

      // Apply migration if needed
      let stateToLoad = serializedState;
      if (options.migrationFunction) {
        stateToLoad = options.migrationFunction(serializedState);
      }

      // Load core state
      this.state = this.deepCopy(stateToLoad.state);

      // Restore optional data based on options
      if (options.restoreFlowEvents && stateToLoad.flowEvents) {
        this.activeFlowEvents = this.deepCopy(stateToLoad.flowEvents);
      }

      if (options.restorePerformanceState && stateToLoad.performanceState) {
        this.performanceMode = stateToLoad.performanceState.performanceMode;
        this.enableProfiling = stateToLoad.performanceState.enableProfiling;
        // Background tasks would be restored here
      }

      if (options.restoreBranchingContext && stateToLoad.branchingContext && this.branchingEngine) {
        // Restore branching context - would be implemented with actual branching engine
      }

      // Performance tracking
      const duration = performance.now() - startTime;
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'state-loaded',
          duration,
          stateSize: JSON.stringify(stateToLoad).length,
          restoredFlowEvents: !!options.restoreFlowEvents,
          restoredPerformance: !!options.restorePerformanceState
        });
      }

      return {
        success: true,
        data: {
          size: JSON.stringify(stateToLoad).length,
          duration,
          checksum: stateToLoad.metadata.checksum
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown loading error';
      const duration = performance.now() - startTime;
      
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'state-loading-failed',
          error: errorMessage,
          duration
        });
      }
      
      return {
        success: false,
        error: `Failed to load state: ${errorMessage}`,
        data: { duration }
      };
    }
  }

  /**
   * Create a lightweight checkpoint of current state
   * @param name - Optional checkpoint name
   * @param options - Checkpoint options
   * @returns Promise resolving to created checkpoint
   */
  async createCheckpoint(name?: string, options: CheckpointOptions = {}): Promise<Checkpoint> {
    const checkpointId = this.generateCheckpointId();
    const timestamp = new Date().toISOString();
    
    const checkpoint: Checkpoint = {
      id: checkpointId,
      name: name || `Checkpoint ${checkpointId.slice(-8)}`,
      state: this.deepCopy(this.state),
      timestamp,
      description: options.includeMetadata ? `Auto-checkpoint at node ${this.state.currentNodeId}` : undefined,
      tags: options.autoTags || [],
      metadata: options.includeMetadata ? {
        nodeTitle: this.getCurrentNode().text.slice(0, 50),
        choiceCount: this.getCurrentNode().choices.length,
        flagCount: Object.keys(this.state.flags).length,
        historyLength: this.state.history.length
      } : undefined
    };

    // Store checkpoint
    this.checkpoints.set(checkpointId, checkpoint);

    // Cleanup old checkpoints if needed
    const maxCheckpoints = options.maxCheckpoints || this.maxCheckpoints;
    if (this.checkpoints.size > maxCheckpoints) {
      await this.cleanupCheckpoints(options.cleanupStrategy || 'lru', maxCheckpoints);
    }

    // Performance tracking
    if (this.enableProfiling) {
      perf.record('custom', {
        eventType: 'checkpoint-created',
        checkpointId,
        checkpointCount: this.checkpoints.size,
        stateSize: JSON.stringify(checkpoint.state).length
      });
    }

    return checkpoint;
  }

  /**
   * Restore engine state from a checkpoint
   * @param checkpointId - ID of checkpoint to restore
   * @returns Promise resolving to persistence result
   */
  async restoreFromCheckpoint(checkpointId: string): Promise<PersistenceResult> {
    const startTime = performance.now();
    
    try {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (!checkpoint) {
        return {
          success: false,
          error: `Checkpoint not found: ${checkpointId}`
        };
      }

      // Restore state
      this.state = this.deepCopy(checkpoint.state);

      const duration = performance.now() - startTime;

      // Performance tracking
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'checkpoint-restored',
          checkpointId,
          duration,
          stateSize: JSON.stringify(checkpoint.state).length
        });
      }

      return {
        success: true,
        data: {
          size: JSON.stringify(checkpoint.state).length,
          duration,
          checksum: checkpointId
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown restore error';
      const duration = performance.now() - startTime;
      
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'checkpoint-restore-failed',
          checkpointId,
          error: errorMessage,
          duration
        });
      }
      
      return {
        success: false,
        error: `Failed to restore checkpoint: ${errorMessage}`,
        data: { duration }
      };
    }
  }

  // Utility method for checking flag conditions
  checkFlag(flagName: string, expectedValue?: unknown): boolean {
    if (expectedValue === undefined) {
      return this.state.flags[flagName] !== undefined;
    }
    return this.state.flags[flagName] === expectedValue;
  }


  // Sprint 3.2: Choice Validation Methods
  
  /**
   * Get the choice validator instance
   * @returns The current choice validator
   */
  getChoiceValidator(): ChoiceValidator {
    return this.choiceValidator;
  }

  /**
   * Validate a specific choice without executing it
   * @param choice - The choice to validate
   * @returns Validation result with details
   */
  validateChoice(choice: Choice): ValidationResult {
    const currentNode = this.getCurrentNode();
    const availableChoices = this.getAvailableChoices();
    const context = createValidationContext(
      currentNode,
      this.state,
      availableChoices
    );
    
    return this.choiceValidator.validate(choice, context);
  }

  /**
   * Check if a specific choice is valid without executing it
   * @param choice - The choice to check
   * @returns True if the choice is valid, false otherwise
   */
  isChoiceValid(choice: Choice): boolean {
    const result = this.validateChoice(choice);
    return result.isValid;

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

  // Sprint 3.3: State persistence utility methods

  /**
   * Deep copy utility for state objects
   * @param obj - Object to deep copy
   * @returns Deep copied object
   */
  private deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepCopy(item)) as T;
    }
    
    if (typeof obj === 'object') {
      const copy = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = this.deepCopy(obj[key]);
        }
      }
      return copy;
    }
    
    return obj;
  }

  /**
   * Generate a hash for the current story data
   * @returns Story hash string
   */
  private generateStoryHash(): string {
    const storyString = JSON.stringify({
      initialNodeId: this.storyData.initialNodeId,
      nodeCount: this.storyData.nodes.length,
      nodeIds: this.storyData.nodes.map(n => n.id).sort()
    });
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < storyString.length; i++) {
      const char = storyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Generate a unique checkpoint ID
   * @returns Unique checkpoint ID
   */
  private generateCheckpointId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `checkpoint_${timestamp}_${random}`;
  }

  /**
   * Generate checksum for data integrity
   * @param data - Data to generate checksum for
   * @returns Promise resolving to checksum string
   */
  private async generateChecksum(data: string): Promise<string> {
    // Simple checksum implementation (in production, use crypto.subtle.digest)
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum = ((checksum << 5) - checksum) + data.charCodeAt(i);
      checksum = checksum & checksum;
    }
    return checksum.toString(16);
  }

  /**
   * Verify checksum integrity
   * @param serializedState - State with checksum to verify
   * @returns Promise resolving to verification result
   */
  private async verifyChecksum(serializedState: SerializedState): Promise<boolean> {
    const receivedChecksum = serializedState.metadata.checksum;
    if (!receivedChecksum) return false;

    const stateToHash = { ...serializedState };
    delete (stateToHash.metadata as any).checksum;

    const stateString = JSON.stringify(stateToHash);
    const expectedChecksum = await this.generateChecksum(stateString);

    return receivedChecksum === expectedChecksum;
  }

  /**
   * Validate the structure of the serialized state object
   * @param serializedState - State to validate
   * @returns Validation result
   */
  private validateSerializedState(serializedState: SerializedState): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!serializedState.state) {
      errors.push('Missing state field');
    } else {
      if (!serializedState.state.currentNodeId) {
        errors.push('Missing currentNodeId in state');
      }
      if (!serializedState.state.flags) {
        warnings.push('Missing flags in state');
      }
      if (!serializedState.state.history) {
        warnings.push('Missing history in state');
      }
    }

    if (!serializedState.metadata) {
      errors.push('Missing metadata field');
    } else {
      if (!serializedState.metadata.engineVersion) {
        warnings.push('Missing engine version in metadata');
      }
      if (!serializedState.metadata.timestamp) {
        warnings.push('Missing timestamp in metadata');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check version compatibility
   * @param metadata - Serialization metadata
   * @returns Compatibility check result
   */
  private checkCompatibility(metadata: SerializationMetadata): {
    compatible: boolean;
    reason?: string;
    suggestions?: string[];
  } {
    const currentVersion = PERSISTENCE_VERSION;
    const stateVersion = metadata.engineVersion;

    if (!stateVersion) {
      return {
        compatible: false,
        reason: 'Unknown state version',
        suggestions: ['State may be from an older engine version']
      };
    }

    if (stateVersion === currentVersion) {
      return { compatible: true };
    }

    // Simple version comparison (in production, use semver)
    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
    const [stateMajor, stateMinor] = stateVersion.split('.').map(Number);

    if (stateMajor > currentMajor || 
        (stateMajor === currentMajor && stateMinor > currentMinor)) {
      return {
        compatible: false,
        reason: `State from newer engine version (${stateVersion} > ${currentVersion})`,
        suggestions: ['Update the engine to a newer version']
      };
    }

    if (stateMajor < currentMajor) {
      return {
        compatible: false,
        reason: `State from incompatible major version (${stateVersion} vs ${currentVersion})`,
        suggestions: ['Use migration function to upgrade state format']
      };
    }

    // Minor version differences are usually compatible
    return { 
      compatible: true,
      suggestions: [`State from older minor version (${stateVersion})`]
    };
  }

  /**
   * Cleanup old checkpoints based on strategy
   * @param strategy - Cleanup strategy
   * @param maxCheckpoints - Maximum number of checkpoints to keep
   * @returns Promise resolving to number of cleaned checkpoints
   */
  private async cleanupCheckpoints(
    strategy: 'lru' | 'fifo' | 'timestamp' | 'manual',
    maxCheckpoints: number
  ): Promise<number> {
    const checkpoints = Array.from(this.checkpoints.entries());
    
    if (checkpoints.length <= maxCheckpoints) {
      return 0;
    }

    const toRemove = checkpoints.length - maxCheckpoints;
    let checkpointsToDelete: string[] = [];

    switch (strategy) {
      case 'fifo':
        // Remove oldest by creation order (assuming IDs contain timestamp)
        checkpointsToDelete = checkpoints
          .sort(([, a], [, b]) => a.timestamp.localeCompare(b.timestamp))
          .slice(0, toRemove)
          .map(([id]) => id);
        break;

      case 'timestamp':
        // Remove oldest by timestamp
        checkpointsToDelete = checkpoints
          .sort(([, a], [, b]) => a.timestamp.localeCompare(b.timestamp))
          .slice(0, toRemove)
          .map(([id]) => id);
        break;

      case 'lru':
      default:
        // For now, same as FIFO (would need access tracking in production)
        checkpointsToDelete = checkpoints
          .sort(([, a], [, b]) => a.timestamp.localeCompare(b.timestamp))
          .slice(0, toRemove)
          .map(([id]) => id);
        break;
    }

    // Remove checkpoints
    for (const id of checkpointsToDelete) {
      this.checkpoints.delete(id);
    }

    if (this.enableProfiling) {
      perf.record('custom', {
        eventType: 'checkpoints-cleaned',
        strategy,
        removedCount: checkpointsToDelete.length,
        remainingCount: this.checkpoints.size
      });
    }

    return checkpointsToDelete.length;
  }

  /**
   * Get all checkpoints
   * @returns Array of all checkpoints
   */
  getCheckpoints(): Checkpoint[] {
    return Array.from(this.checkpoints.values());
  }

  /**
   * Get specific checkpoint by ID
   * @param id - Checkpoint ID
   * @returns Checkpoint or undefined
   */
  getCheckpoint(id: string): Checkpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * Delete a checkpoint
   * @param id - Checkpoint ID to delete
   * @returns Whether checkpoint was deleted
   */
  deleteCheckpoint(id: string): boolean {
    return this.checkpoints.delete(id);
  }

  /**
   * Enable/disable automatic checkpointing
   * @param enabled - Whether to enable auto-checkpointing
   */
  setAutoCheckpoint(enabled: boolean): void {
    this.autoCheckpointEnabled = enabled;
  }

  // Sprint 3.5: Autosave and Undo/Redo Implementation

  /**
   * Configure autosave settings
   * @param config - Autosave configuration
   */
  configureAutosave(config: Partial<AutosaveConfig>): void {
    this.autosaveConfig = { ...this.autosaveConfig, ...config };
  }

  /**
   * Configure undo/redo settings
   * @param config - Undo/redo configuration
   */
  configureUndoRedo(config: Partial<UndoRedoConfig>): void {
    this.undoRedoConfig = { ...this.undoRedoConfig, ...config };
  }

  /**
   * Push a state to the undo stack
   * @param state - State to save
   * @param action - Action that caused this state change
   * @param metadata - Optional metadata about the change
   */
  private pushToUndoStack(state: QNCEState, action?: string, metadata?: Record<string, unknown>): void {
    const startTime = performance.now();
    
    const entry: HistoryEntry = {
      id: this.generateHistoryId(),
      state: this.deepCopy(state),
      timestamp: new Date().toISOString(),
      action,
      metadata
    };

    this.undoStack.push(entry);
    
    // Clear redo stack when new change is made
    this.redoStack = [];
    
    // Enforce max undo entries
    if (this.undoStack.length > this.undoRedoConfig.maxUndoEntries) {
      this.undoStack.shift(); // Remove oldest entry
    }
    
    // Performance tracking
    if (this.enableProfiling) {
      const duration = performance.now() - startTime;
      perf.record('custom', {
        eventType: 'undo-stack-push',
        duration,
        undoCount: this.undoStack.length,
        action
      });
    }
  }

  /**
   * Undo the last operation
   * @returns Result of undo operation
   */
  undo(): UndoRedoResult {
    const startTime = performance.now();
    
    if (this.undoStack.length === 0) {
      return {
        success: false,
        error: 'No operations to undo',
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };
    }

    try {
      // Save current state to redo stack
      const currentEntry: HistoryEntry = {
        id: this.generateHistoryId(),
        state: this.deepCopy(this.state),
        timestamp: new Date().toISOString(),
        action: 'redo-point'
      };
      
      this.redoStack.push(currentEntry);
      
      // Enforce max redo entries
      if (this.redoStack.length > this.undoRedoConfig.maxRedoEntries) {
        this.redoStack.shift(); // Remove oldest entry
      }

      // Restore previous state
      const entryToRestore = this.undoStack.pop()!;
      
      // Set flag to prevent triggering undo/redo tracking during restore
      this.isUndoRedoOperation = true;
      this.state = this.deepCopy(entryToRestore.state);
      this.isUndoRedoOperation = false;

      const duration = performance.now() - startTime;
      
      // Performance tracking
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'undo-operation',
          duration,
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        });
      }

      return {
        success: true,
        restoredState: this.deepCopy(this.state),
        entry: {
          id: entryToRestore.id,
          timestamp: entryToRestore.timestamp,
          action: entryToRestore.action,
          nodeId: entryToRestore.metadata?.nodeId as string
        },
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };

    } catch (error) {
      this.isUndoRedoOperation = false; // Ensure flag is reset on error
      const errorMessage = error instanceof Error ? error.message : 'Unknown undo error';
      
      return {
        success: false,
        error: `Undo failed: ${errorMessage}`,
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };
    }
  }

  /**
   * Redo the last undone operation
   * @returns Result of redo operation
   */
  redo(): UndoRedoResult {
    const startTime = performance.now();
    
    if (this.redoStack.length === 0) {
      return {
        success: false,
        error: 'No operations to redo',
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };
    }

    try {
      // Save current state to undo stack
      const currentEntry: HistoryEntry = {
        id: this.generateHistoryId(),
        state: this.deepCopy(this.state),
        timestamp: new Date().toISOString(),
        action: 'undo-point'
      };
      
      this.undoStack.push(currentEntry);
      
      // Enforce max undo entries
      if (this.undoStack.length > this.undoRedoConfig.maxUndoEntries) {
        this.undoStack.shift(); // Remove oldest entry
      }

      // Restore redo state
      const entryToRestore = this.redoStack.pop()!;
      
      // Set flag to prevent triggering undo/redo tracking during restore
      this.isUndoRedoOperation = true;
      this.state = this.deepCopy(entryToRestore.state);
      this.isUndoRedoOperation = false;

      const duration = performance.now() - startTime;
      
      // Performance tracking
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'redo-operation',
          duration,
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        });
      }

      return {
        success: true,
        restoredState: this.deepCopy(this.state),
        entry: {
          id: entryToRestore.id,
          timestamp: entryToRestore.timestamp,
          action: entryToRestore.action,
          nodeId: entryToRestore.metadata?.nodeId as string
        },
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };

    } catch (error) {
      this.isUndoRedoOperation = false; // Ensure flag is reset on error
      const errorMessage = error instanceof Error ? error.message : 'Unknown redo error';
      
      return {
        success: false,
        error: `Redo failed: ${errorMessage}`,
        stackSizes: {
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length
        }
      };
    }
  }

  /**
   * Check if undo is available
   * @returns True if undo is possible
   */
  canUndo(): boolean {
    return this.undoRedoConfig.enabled && this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns True if redo is possible
   */
  canRedo(): boolean {
    return this.undoRedoConfig.enabled && this.redoStack.length > 0;
  }

  /**
   * Get the number of available undo operations
   * @returns Number of undo entries
   */
  getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * Get the number of available redo operations
   * @returns Number of redo entries
   */
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Clear all undo/redo history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    
    if (this.enableProfiling) {
      perf.record('custom', {
        eventType: 'history-cleared'
      });
    }
  }

  /**
   * Get history summary for debugging
   * @returns Summary of undo/redo history
   */
  getHistorySummary(): {
    undoEntries: { id: string; timestamp: string; action?: string }[];
    redoEntries: { id: string; timestamp: string; action?: string }[];
  } {
    return {
      undoEntries: this.undoStack.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action
      })),
      redoEntries: this.redoStack.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action
      }))
    };
  }

  /**
   * Trigger an autosave operation
   * @param trigger - What triggered the autosave
   * @param metadata - Optional metadata about the trigger
   * @returns Promise resolving to autosave result
   */
  private async triggerAutosave(trigger: string, metadata?: Record<string, unknown>): Promise<AutosaveResult> {
    const startTime = performance.now();
    
    // Check if autosave is enabled
    if (!this.autosaveConfig.enabled) {
      return { success: false, error: 'Autosave is disabled' };
    }
    
    // Check throttling
    const now = performance.now();
    if (now - this.lastAutosaveTime < this.autosaveConfig.throttleMs) {
      return { 
        success: false, 
        error: 'Autosave throttled',
        trigger 
      };
    }
    
    try {
      // Create autosave checkpoint
      const checkpointName = `autosave-${trigger}-${Date.now()}`;
      const checkpoint = await this.createCheckpoint(checkpointName, {
        includeMetadata: this.autosaveConfig.includeMetadata,
        autoTags: ['autosave', trigger],
        maxCheckpoints: this.autosaveConfig.maxEntries
      });
      
      this.lastAutosaveTime = now;
      const duration = performance.now() - startTime;
      
      // Performance tracking
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'autosave-completed',
          duration,
          trigger,
          checkpointId: checkpoint.id
        });
      }
      
      return {
        success: true,
        checkpointId: checkpoint.id,
        trigger,
        duration,
        size: JSON.stringify(checkpoint.state).length
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown autosave error';
      const duration = performance.now() - startTime;
      
      if (this.enableProfiling) {
        perf.record('custom', {
          eventType: 'autosave-failed',
          duration,
          trigger,
          error: errorMessage
        });
      }
      
      return {
        success: false,
        error: `Autosave failed: ${errorMessage}`,
        trigger,
        duration
      };
    }
  }

  /**
   * Manually trigger an autosave
   * @param metadata - Optional metadata
   * @returns Promise resolving to autosave result
   */
  async manualAutosave(metadata?: Record<string, unknown>): Promise<AutosaveResult> {
    return this.triggerAutosave('manual', metadata);
  }

  /**
   * Generate a unique history entry ID
   * @returns Unique ID string
   */
  private generateHistoryId(): string {
    return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sprint 3.4: Conditional Choice Display API

  /**
   * Set a custom condition evaluator function for complex choice logic
   * @param evaluator - Custom evaluator function
   */
  setConditionEvaluator(evaluator: CustomEvaluatorFunction): void {
    conditionEvaluator.setCustomEvaluator(evaluator);
  }

  /**
   * Clear the custom condition evaluator
   */
  clearConditionEvaluator(): void {
    conditionEvaluator.clearCustomEvaluator();
  }

  /**
   * Validate a condition expression without evaluating it
   * @param expression - Condition expression to validate
   * @returns Validation result
   */
  validateCondition(expression: string): { valid: boolean; error?: string } {
    return conditionEvaluator.validateExpression(expression);
  }

  /**
   * Get flags referenced in a condition expression
   * @param expression - Condition expression to analyze
   * @returns Array of flag names referenced
   */
  getConditionFlags(expression: string): string[] {
    return conditionEvaluator.getReferencedFlags(expression);
  }
}

/**
 * Factory function to create a QNCE engine instance
 */
export function createQNCEEngine(
  storyData: StoryData, 
  initialState?: Partial<QNCEState>, 
  performanceMode: boolean = false,
  threadPoolConfig?: Partial<ThreadPoolConfig>,
  options?: { telemetry?: import('../telemetry/types').Telemetry; env?: 'dev' | 'test' | 'prod'; appVersion?: string; sessionId?: string; }
): QNCEEngine {
  return new QNCEEngine(storyData, initialState, performanceMode, threadPoolConfig, options);
}

/**
 * Load story data from JSON
 */
export function loadStoryData(jsonData: unknown): StoryData {
  // Add validation here in the future
  return jsonData as StoryData;
}
