// QNCE Engine Types - Sprint 3.3: State Persistence & Checkpoints
// Comprehensive type definitions for serialization and checkpoint features

import { QNCEState, FlowEvent } from './core';

/**
 * Metadata about the serialization process and compatibility
 */
export interface SerializationMetadata {
  /** Engine version that created this serialized state */
  engineVersion: string;
  /** Timestamp when the state was serialized (ISO string) */
  timestamp: string;
  /** Story identifier/hash for compatibility checking */
  storyId?: string;
  /** Custom metadata for application-specific use */
  customMetadata?: Record<string, unknown>;
  /** Compression level used (if any) */
  compression?: 'none' | 'gzip' | 'lz4';
  /** Checksum for integrity verification */
  checksum?: string;
}

/**
 * Complete serialized state that can be saved/restored
 * Includes all necessary data to fully reconstruct engine state
 */
export interface SerializedState {
  /** Core narrative state (current node, flags, history) */
  state: QNCEState;
  
  /** Active flow events for performance tracking */
  flowEvents: FlowEvent[];
  
  /** Performance and pool statistics snapshot */
  poolStats?: Record<string, unknown>;
  
  /** Branching context and branch state */
  branchingContext?: {
    activeBranches: string[];
    branchStates: Record<string, unknown>;
    convergencePoints: string[];
  };
  
  /** Validation state and rule overrides */
  validationState?: {
    disabledRules: string[];
    customRules: Record<string, unknown>;
    validationErrors: string[];
  };
  
  /** Thread pool and background operation state */
  performanceState?: {
    performanceMode: boolean;
    enableProfiling: boolean;
    backgroundTasks: string[];
    telemetryData: Record<string, unknown>[];
  };
  
  /** Serialization metadata */
  metadata: SerializationMetadata;
}

/**
 * Lightweight checkpoint for quick save/restore operations
 * Contains minimal data for fast state snapshots
 */
export interface Checkpoint {
  /** Unique checkpoint identifier */
  id: string;
  
  /** Human-readable checkpoint name/label */
  name?: string;
  
  /** Core state snapshot (deep copied) */
  state: QNCEState;
  
  /** Checkpoint creation timestamp */
  timestamp: string;
  
  /** Optional description or context */
  description?: string;
  
  /** Tags for checkpoint organization */
  tags?: string[];
  
  /** Lightweight metadata */
  metadata?: {
    nodeTitle?: string;
    choiceCount?: number;
    flagCount?: number;
    historyLength?: number;
    [key: string]: unknown;
  };
}

/**
 * Options for state serialization
 */
export interface SerializationOptions {
  /** Include performance data in serialization */
  includePerformanceData?: boolean;
  
  /** Include flow events in serialization */
  includeFlowEvents?: boolean;
  
  /** Include branching context */
  includeBranchingContext?: boolean;
  
  /** Include validation state */
  includeValidationState?: boolean;
  
  /** Compression to apply */
  compression?: 'none' | 'gzip' | 'lz4';
  
  /** Generate integrity checksum */
  generateChecksum?: boolean;
  
  /** Custom metadata to include */
  customMetadata?: Record<string, unknown>;
  
  /** Pretty print JSON (increases size but improves readability) */
  prettyPrint?: boolean;
}

/**
 * Options for state loading/deserialization
 */
export interface LoadOptions {
  /** Verify checksum integrity before loading */
  verifyChecksum?: boolean;
  
  /** Skip compatibility checks (dangerous) */
  skipCompatibilityCheck?: boolean;
  
  /** Restore performance state */
  restorePerformanceState?: boolean;
  
  /** Restore flow events */
  restoreFlowEvents?: boolean;
  
  /** Restore branching context */
  restoreBranchingContext?: boolean;
  
  /** Restore validation state */
  restoreValidationState?: boolean;
  
  /** Migration function for version compatibility */
  migrationFunction?: (serializedState: SerializedState) => SerializedState;
}

/**
 * Checkpoint management options
 */
export interface CheckpointOptions {
  /** Maximum number of checkpoints to keep */
  maxCheckpoints?: number;
  
  /** Auto-cleanup strategy */
  cleanupStrategy?: 'lru' | 'fifo' | 'timestamp' | 'manual';
  
  /** Include metadata in checkpoint */
  includeMetadata?: boolean;
  
  /** Tags to automatically apply */
  autoTags?: string[];
}

/**
 * State persistence result with success/error information
 */
export interface PersistenceResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Operation-specific data */
  data?: {
    /** Serialized state size in bytes */
    size?: number;
    
    /** Compression ratio achieved */
    compressionRatio?: number;
    
    /** Checksum of saved data */
    checksum?: string;
    
    /** Time taken for operation (ms) */
    duration?: number;
  };
  
  /** Warnings or informational messages */
  warnings?: string[];
}

/**
 * Event emitted during state persistence operations
 */
export interface PersistenceEvent {
  /** Event type */
  type: 'save-start' | 'save-complete' | 'load-start' | 'load-complete' | 
        'checkpoint-created' | 'checkpoint-restored' | 'cleanup' | 'error';
  
  /** Timestamp of event */
  timestamp: string;
  
  /** Associated checkpoint ID (if applicable) */
  checkpointId?: string;
  
  /** Event data */
  data?: Record<string, unknown>;
  
  /** Error information (for error events) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * State validation result for loaded states
 */
export interface StateValidationResult {
  /** Whether the state is valid */
  isValid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Suggested fixes or migrations */
  suggestions?: string[];
  
  /** Whether the state can be safely loaded */
  canLoad: boolean;
}

/**
 * Checkpoint manager interface for persistence operations
 */
export interface CheckpointManager {
  /** Create a new checkpoint */
  createCheckpoint(name?: string, options?: CheckpointOptions): Promise<Checkpoint>;
  
  /** List all available checkpoints */
  listCheckpoints(): Promise<Checkpoint[]>;
  
  /** Get a specific checkpoint by ID */
  getCheckpoint(id: string): Promise<Checkpoint | null>;
  
  /** Delete a checkpoint */
  deleteCheckpoint(id: string): Promise<boolean>;
  
  /** Restore from a checkpoint */
  restoreFromCheckpoint(id: string): Promise<PersistenceResult>;
  
  /** Clean up old checkpoints */
  cleanup(options?: CheckpointOptions): Promise<number>;
  
  /** Export checkpoint to external format */
  exportCheckpoint(id: string, format?: 'json' | 'binary'): Promise<string | Buffer>;
  
  /** Import checkpoint from external format */
  importCheckpoint(data: string | Buffer, format?: 'json' | 'binary'): Promise<Checkpoint>;
}

/**
 * Storage adapter interface for different persistence backends
 */
export interface StorageAdapter {
  /** Save serialized state */
  save(key: string, data: SerializedState, options?: SerializationOptions): Promise<PersistenceResult>;
  
  /** Load serialized state */
  load(key: string, options?: LoadOptions): Promise<SerializedState | null>;
  
  /** Delete stored state */
  delete(key: string): Promise<boolean>;
  
  /** List all stored keys */
  list(): Promise<string[]>;
  
  /** Check if key exists */
  exists(key: string): Promise<boolean>;
  
  /** Get storage statistics */
  getStats(): Promise<{ totalSize: number; keyCount: number; [key: string]: unknown }>;
  
  /** Clear all stored data */
  clear(): Promise<boolean>;
}

/**
 * Built-in storage adapter types
 */
export type StorageAdapterType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory' | 'file';

/**
 * Configuration for different storage adapters
 */
export interface StorageConfig {
  /** Storage adapter type */
  type: StorageAdapterType;
  
  /** Adapter-specific options */
  options?: {
    /** For file storage: directory path */
    directory?: string;
    
    /** For IndexedDB: database name */
    databaseName?: string;
    
    /** For memory storage: size limit */
    sizeLimit?: number;
    
    /** Auto-compression for storage */
    autoCompress?: boolean;
    
    /** Encryption options */
    encryption?: {
      algorithm: string;
      key: string;
    };
  };
}

/**
 * Type guard functions for runtime type checking
 */
export interface TypeGuards {
  isSerializedState: (obj: unknown) => obj is SerializedState;
  isCheckpoint: (obj: unknown) => obj is Checkpoint;
  isValidationResult: (obj: unknown) => obj is StateValidationResult;
  isPersistenceResult: (obj: unknown) => obj is PersistenceResult;
}

// Export utility types for consumer convenience
export type CheckpointId = string;
export type StorageKey = string;
export type Timestamp = string; // ISO 8601 format

// Sprint 3.5: Autosave and Undo/Redo Types

/**
 * History entry for undo/redo functionality
 */
export interface HistoryEntry {
  /** Unique identifier for this history entry */
  id: string;
  
  /** State snapshot at this point */
  state: QNCEState;
  
  /** Timestamp when this entry was created */
  timestamp: string;
  
  /** Optional description of the action that created this entry */
  action?: string;
  
  /** Optional metadata about the change */
  metadata?: {
    nodeId?: string;
    choiceText?: string;
    flagsChanged?: string[];
    [key: string]: unknown;
  };
}

/**
 * Configuration for autosave functionality
 */
export interface AutosaveConfig {
  /** Whether autosave is enabled */
  enabled: boolean;
  
  /** Triggers that should cause an autosave */
  triggers: ('choice' | 'flag-change' | 'state-load' | 'branch-exit' | 'custom')[];
  
  /** Maximum number of autosave entries to keep */
  maxEntries: number;
  
  /** Minimum time between autosaves (ms) to prevent spam */
  throttleMs: number;
  
  /** Whether to include metadata in autosave entries */
  includeMetadata: boolean;
  
  /** Custom autosave naming pattern */
  namePattern?: string; // e.g., "autosave-{timestamp}-{nodeId}"
}

/**
 * Configuration for undo/redo history
 */
export interface UndoRedoConfig {
  /** Whether undo/redo is enabled */
  enabled: boolean;
  
  /** Maximum number of undo entries to keep */
  maxUndoEntries: number;
  
  /** Maximum number of redo entries to keep */
  maxRedoEntries: number;
  
  /** Whether to track flag changes for undo metadata */
  trackFlagChanges: boolean;
  
  /** Whether to track choice text for undo metadata */
  trackChoiceText: boolean;
  
  /** Actions that should create undo entries */
  trackActions: ('choice' | 'flag-change' | 'state-load' | 'reset' | 'custom')[];
}

/**
 * Result of undo/redo operations
 */
export interface UndoRedoResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Error message if operation failed */
  error?: string;
  
  /** The state that was restored */
  restoredState?: QNCEState;
  
  /** Information about the restored entry */
  entry?: {
    id: string;
    timestamp: string;
    action?: string;
    nodeId?: string;
  };
  
  /** Current undo/redo stack sizes after operation */
  stackSizes?: {
    undoCount: number;
    redoCount: number;
  };
}

/**
 * Autosave operation result
 */
export interface AutosaveResult {
  /** Whether the autosave succeeded */
  success: boolean;
  
  /** Error message if autosave failed */
  error?: string;
  
  /** The checkpoint ID created by autosave */
  checkpointId?: string;
  
  /** Trigger that caused this autosave */
  trigger?: string;
  
  /** Time taken for autosave operation (ms) */
  duration?: number;
  
  /** Size of the autosaved data */
  size?: number;
}

/**
 * History manager interface for undo/redo operations
 */
export interface HistoryManager {
  /** Push a new state to the undo stack */
  pushState(state: QNCEState, action?: string, metadata?: Record<string, unknown>): void;
  
  /** Undo the last operation */
  undo(): UndoRedoResult;
  
  /** Redo the last undone operation */
  redo(): UndoRedoResult;
  
  /** Clear all history */
  clear(): void;
  
  /** Get the current undo stack size */
  getUndoCount(): number;
  
  /** Get the current redo stack size */
  getRedoCount(): number;
  
  /** Check if undo is available */
  canUndo(): boolean;
  
  /** Check if redo is available */
  canRedo(): boolean;
  
  /** Get history summary for debugging */
  getHistorySummary(): {
    undoEntries: { id: string; timestamp: string; action?: string }[];
    redoEntries: { id: string; timestamp: string; action?: string }[];
  };
}

/**
 * Event emitted during autosave operations
 */
export interface AutosaveEvent {
  /** Event type */
  type: 'autosave-triggered' | 'autosave-complete' | 'autosave-failed' | 'autosave-throttled';
  
  /** Timestamp of event */
  timestamp: string;
  
  /** Trigger that caused the autosave */
  trigger?: string;
  
  /** Event data */
  data?: {
    checkpointId?: string;
    duration?: number;
    size?: number;
    throttleRemainingMs?: number;
  };
  
  /** Error information (for failed events) */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Event emitted during undo/redo operations
 */
export interface UndoRedoEvent {
  /** Event type */
  type: 'undo' | 'redo' | 'history-push' | 'history-clear' | 'undo-failed' | 'redo-failed';
  
  /** Timestamp of event */
  timestamp: string;
  
  /** Event data */
  data?: {
    entryId?: string;
    action?: string;
    nodeId?: string;
    undoCount?: number;
    redoCount?: number;
  };
  
  /** Error information (for failed events) */
  error?: {
    message: string;
    code?: string;
  };
}

// Version constants
export const PERSISTENCE_VERSION = '1.0.0';
export const SUPPORTED_VERSIONS = ['1.0.0'];
