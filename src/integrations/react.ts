/**
 * QNCE Engine React Integration
 * 
 * React hooks and utilities for integrating QNCE Engine with React applications.
 * Provides convenient hooks for managing narrative state, undo/redo operations,
 * and autosave functionality.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QNCEEngine, type QNCEState, type Choice, type NarrativeNode } from '../engine/core.js';
import { type AutosaveConfig, type UndoRedoConfig, type SerializedState } from '../engine/types.js';

/**
 * Result type for undo/redo operations
 */
export interface UndoRedoResult {
  success: boolean;
  description?: string;
  error?: string;
}

/**
 * History summary for undo/redo state
 */
export interface HistorySummary {
  undoCount: number;
  redoCount: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Configuration for the useQNCE hook
 */
export interface UseQNCEConfig {
  /** Enable automatic re-renders when state changes */
  autoUpdate?: boolean;
  /** Enable undo/redo functionality */
  enableUndoRedo?: boolean;
  /** Maximum number of undo operations to track */
  maxUndoEntries?: number;
  /** Maximum number of redo operations to track */
  maxRedoEntries?: number;
  /** Enable autosave functionality */
  enableAutosave?: boolean;
  /** Autosave throttle time in milliseconds */
  autosaveThrottleMs?: number;
}

/**
 * Return type for the useQNCE hook
 */
export interface UseQNCEReturn {
  // Core narrative state
  engine: QNCEEngine;
  currentNode: NarrativeNode | null;
  availableChoices: Choice[];
  flags: Record<string, any>;
  
  // Actions
  selectChoice: (choice: Choice | string) => Promise<void>;
  setFlag: (key: string, value: any) => void;
  resetNarrative: () => void;
  
  // Undo/Redo functionality
  undo: () => UndoRedoResult;
  redo: () => UndoRedoResult;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  clearHistory: () => void;
  
  // Autosave functionality
  autosave: () => Promise<void>;
  configureAutosave: (config: Partial<AutosaveConfig>) => void;
  
  // State management
  saveState: () => Promise<SerializedState>;
  loadState: (serializedState: SerializedState) => Promise<void>;
  
  // Utility
  refresh: () => void;
}

/**
 * React hook for QNCE Engine integration
 * 
 * Provides a complete interface for managing QNCE Engine state in React applications,
 * including undo/redo functionality, autosave, and automatic re-renders.
 * 
 * @param engine - The QNCE Engine instance
 * @param config - Configuration options for the hook
 * @returns Hook return object with state and actions
 * 
 * @example
 * ```tsx
 * function NarrativeComponent() {
 *   const engine = useMemo(() => createQNCEEngine(DEMO_STORY), []);
 *   const {
 *     currentNode,
 *     availableChoices,
 *     selectChoice,
 *     undo,
 *     redo,
 *     canUndo,
 *     canRedo
 *   } = useQNCE(engine, {
 *     enableUndoRedo: true,
 *     enableAutosave: true,
 *     maxUndoEntries: 50
 *   });
 * 
 *   return (
 *     <div>
 *       <p>{currentNode?.text}</p>
 *       
 *       <div>
 *         {availableChoices.map(choice => (
 *           <button key={choice.text} onClick={() => selectChoice(choice)}>
 *             {choice.text}
 *           </button>
 *         ))}
 *       </div>
 *       
 *       <div>
 *         <button onClick={undo} disabled={!canUndo}>
 *           Undo
 *         </button>
 *         <button onClick={redo} disabled={!canRedo}>
 *           Redo
 *         </button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useQNCE(engine: QNCEEngine, config: UseQNCEConfig = {}): UseQNCEReturn {
  const {
    autoUpdate = true,
    enableUndoRedo = true,
    maxUndoEntries = 50,
    maxRedoEntries = 25,
    enableAutosave = true,
    autosaveThrottleMs = 100
  } = config;

  // Force re-render counter
  const [, setUpdateCounter] = useState(0);
  
  // Initialize engine configuration
  useEffect(() => {
    if (enableUndoRedo) {
      engine.configureUndoRedo({
        enabled: true,
        maxUndoEntries,
        maxRedoEntries
      });
    }
    
    if (enableAutosave) {
      engine.configureAutosave({
        enabled: true,
        throttleMs: autosaveThrottleMs,
        triggers: ['choice', 'flag-change', 'state-load']
      });
    }
  }, [engine, enableUndoRedo, maxUndoEntries, maxRedoEntries, enableAutosave, autosaveThrottleMs]);

  // Force re-render when autoUpdate is enabled
  const refresh = useCallback(() => {
    if (autoUpdate) {
      setUpdateCounter(prev => prev + 1);
    }
  }, [autoUpdate]);

  // Memoized state getters
  const currentNode = useMemo(() => {
    try {
      return engine.getCurrentNode();
    } catch {
      return null;
    }
  }, [engine, autoUpdate]);

  const availableChoices = useMemo(() => {
    try {
      return engine.getAvailableChoices();
    } catch {
      return [];
    }
  }, [engine, autoUpdate]);

  const flags = useMemo(() => {
    return engine.getState().flags;
  }, [engine, autoUpdate]);

  // Undo/Redo state
  const canUndo = useMemo(() => engine.canUndo(), [engine, autoUpdate]);
  const canRedo = useMemo(() => engine.canRedo(), [engine, autoUpdate]);
  const undoCount = useMemo(() => engine.getUndoCount(), [engine, autoUpdate]);
  const redoCount = useMemo(() => engine.getRedoCount(), [engine, autoUpdate]);

  // Actions with automatic refresh
  const selectChoice = useCallback(async (choice: Choice | string) => {
    let choiceToSelect: Choice;
    
    if (typeof choice === 'string') {
      // Find choice by text
      const foundChoice = availableChoices.find(c => c.text === choice);
      if (!foundChoice) {
        throw new Error(`Choice not found: ${choice}`);
      }
      choiceToSelect = foundChoice;
    } else {
      choiceToSelect = choice;
    }
    
    engine.selectChoice(choiceToSelect);
    refresh();
  }, [engine, refresh, availableChoices]);

  const setFlag = useCallback((key: string, value: any) => {
    engine.setFlag(key, value);
    refresh();
  }, [engine, refresh]);

  const resetNarrative = useCallback(() => {
    engine.resetNarrative();
    refresh();
  }, [engine, refresh]);

  const undo = useCallback((): UndoRedoResult => {
    const result = engine.undo();
    refresh();
    return result;
  }, [engine, refresh]);

  const redo = useCallback((): UndoRedoResult => {
    const result = engine.redo();
    refresh();
    return result;
  }, [engine, refresh]);

  const clearHistory = useCallback(() => {
    engine.clearHistory();
    refresh();
  }, [engine, refresh]);

  const autosave = useCallback(async () => {
    await engine.manualAutosave();
  }, [engine]);

  const configureAutosave = useCallback((config: Partial<AutosaveConfig>) => {
    engine.configureAutosave(config);
  }, [engine]);

  const saveState = useCallback(async (): Promise<SerializedState> => {
    return await engine.saveState();
  }, [engine]);

  const loadState = useCallback(async (serializedState: SerializedState) => {
    await engine.loadState(serializedState);
    refresh();
  }, [engine, refresh]);

  return {
    // Core state
    engine,
    currentNode,
    availableChoices,
    flags,
    
    // Actions
    selectChoice,
    setFlag,
    resetNarrative,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    clearHistory,
    
    // Autosave
    autosave,
    configureAutosave,
    
    // State management
    saveState,
    loadState,
    
    // Utility
    refresh
  };
}

/**
 * Hook for managing just undo/redo functionality
 * 
 * A lightweight hook focused specifically on undo/redo operations.
 * Useful when you want to add undo/redo to an existing QNCE integration.
 * 
 * @param engine - The QNCE Engine instance
 * @param config - Undo/redo configuration
 * @returns Undo/redo state and actions
 * 
 * @example
 * ```tsx
 * function UndoRedoControls({ engine }: { engine: QNCEEngine }) {
 *   const { undo, redo, canUndo, canRedo, undoCount, redoCount } = useUndoRedo(engine);
 * 
 *   return (
 *     <div className="undo-redo-controls">
 *       <button onClick={undo} disabled={!canUndo}>
 *         ← Undo ({undoCount})
 *       </button>
 *       <button onClick={redo} disabled={!canRedo}>
 *         Redo ({redoCount}) →
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUndoRedo(
  engine: QNCEEngine, 
  config: { maxUndoEntries?: number; maxRedoEntries?: number } = {}
): {
  undo: () => UndoRedoResult;
  redo: () => UndoRedoResult;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  clearHistory: () => void;
  historySummary: HistorySummary;
} {
  const { maxUndoEntries = 50, maxRedoEntries = 25 } = config;
  const [, setUpdateCounter] = useState(0);

  // Configure undo/redo on mount
  useEffect(() => {
    engine.configureUndoRedo({
      enabled: true,
      maxUndoEntries,
      maxRedoEntries
    });
  }, [engine, maxUndoEntries, maxRedoEntries]);

  const refresh = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  const undo = useCallback((): UndoRedoResult => {
    const result = engine.undo();
    refresh();
    return result;
  }, [engine, refresh]);

  const redo = useCallback((): UndoRedoResult => {
    const result = engine.redo();
    refresh();
    return result;
  }, [engine, refresh]);

  const clearHistory = useCallback(() => {
    engine.clearHistory();
    refresh();
  }, [engine, refresh]);

  const canUndo = useMemo(() => engine.canUndo(), [engine]);
  const canRedo = useMemo(() => engine.canRedo(), [engine]);
  const undoCount = useMemo(() => engine.getUndoCount(), [engine]);
  const redoCount = useMemo(() => engine.getRedoCount(), [engine]);

  const historySummary = useMemo((): HistorySummary => ({
    undoCount,
    redoCount,
    canUndo,
    canRedo
  }), [undoCount, redoCount, canUndo, canRedo]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    clearHistory,
    historySummary
  };
}

/**
 * Hook for managing autosave functionality
 * 
 * Provides control over the autosave system for fine-grained management.
 * 
 * @param engine - The QNCE Engine instance
 * @param config - Autosave configuration
 * @returns Autosave state and actions
 * 
 * @example
 * ```tsx
 * function AutosaveIndicator({ engine }: { engine: QNCEEngine }) {
 *   const { autosave, configure, isEnabled } = useAutosave(engine, {
 *     throttleMs: 200,
 *     triggers: ['choice', 'flag-change']
 *   });
 * 
 *   return (
 *     <div>
 *       <span>Autosave: {isEnabled ? 'ON' : 'OFF'}</span>
 *       <button onClick={autosave}>Save Now</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutosave(
  engine: QNCEEngine,
  config: { throttleMs?: number; triggers?: string[]; enabled?: boolean } = {}
): {
  autosave: () => Promise<void>;
  configure: (config: Partial<AutosaveConfig>) => void;
  isEnabled: boolean;
  lastAutosave: Date | null;
  isSaving: boolean;
} {
  const { throttleMs = 100, triggers = ['choice', 'flag-change', 'state-load'], enabled = true } = config;
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    engine.configureAutosave({
      enabled,
      throttleMs,
      triggers: triggers as any
    });
  }, [engine, enabled, throttleMs, triggers]);

  // Monitor autosave events by wrapping engine methods
  useEffect(() => {
    if (!engine) return;

    const originalSelectChoice = engine.selectChoice.bind(engine);
    const originalSetFlag = engine.setFlag.bind(engine);

    // Track autosave calls
    const trackAutosave = async (originalMethod: Function, ...args: any[]) => {
      const result = originalMethod(...args);
      
      if (enabled) {
        setIsSaving(true);
        try {
          // Wait for potential autosave to complete
          await new Promise(resolve => setTimeout(resolve, throttleMs + 50));
          setLastAutosave(new Date());
        } finally {
          setIsSaving(false);
        }
      }
      
      return result;
    };

    // Override methods to track autosave
    engine.selectChoice = (...args) => trackAutosave(originalSelectChoice, ...args);
    engine.setFlag = (...args) => trackAutosave(originalSetFlag, ...args);

    return () => {
      // Restore original methods
      engine.selectChoice = originalSelectChoice;
      engine.setFlag = originalSetFlag;
    };
  }, [engine, enabled, throttleMs]);

  const autosave = useCallback(async () => {
    setIsSaving(true);
    try {
      await engine.manualAutosave();
      setLastAutosave(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [engine]);

  const configure = useCallback((config: Partial<AutosaveConfig>) => {
    engine.configureAutosave(config);
  }, [engine]);

  return {
    autosave,
    configure,
    isEnabled: enabled,
    lastAutosave,
    isSaving
  };
}
