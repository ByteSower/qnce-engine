<!-- Sanitized: Detailed internal API inventory removed. Refer to official API report instead. -->

# (Sanitized) API Inventory Placeholder

Authoritative sources:
- API Extractor report (`etc/qnce-engine.api.md`)
- Generated TypeDoc (local dev only)

Do not add pre-release or internal symbol enumerations here.
- [ ] interface StoryMetadata
- [ ] interface BranchingConfig
- [ ] interface Chapter
- [ ] interface ChapterPrerequisites
- [ ] interface ChapterMetadata
- [ ] interface NarrativeFlow
- [ ] type      FlowType
- [ ] interface FlowEntryPoint
- [ ] interface FlowExitPoint
- [ ] interface FlowMetadata
- [ ] interface BranchPoint
- [ ] type      BranchType
- [ ] interface BranchOption
- [ ] interface BranchCondition
- [ ] interface BranchMetadata
- [ ] interface BranchContext
- [ ] interface BranchHistoryEntry
- [ ] interface PendingBranch
- [ ] interface BranchAnalytics
- [ ] interface DynamicBranchOperation
- [ ] interface BranchLocation
- [ ] interface DynamicFlowOperation
- [ ] interface PooledBranchContext
- [ ] interface PooledBranchPoint
- [ ] interface AIBranchingContext
- [ ] interface PlayerProfile
- [ ] interface NarrativeContext
- [ ] interface AIGenerationHints

## src/performance/HotReloadDelta.ts
- [ ] interface Asset
- [ ] interface StoryDelta
- [ ] interface NodeDelta
- [ ] interface AssetDelta
- [ ] interface ExtendedStoryData
- [ ] class     StoryDeltaComparator
- [ ] class     StoryDeltaPatcher
- [ ] interface PatchResult
- [ ] function  createDeltaTools

## src/performance/ObjectPool.ts
- [ ] interface Poolable
- [ ] interface PoolableConstructor
- [ ] class     ObjectPool
- [ ] class     PooledFlow
- [ ] class     PooledNode
- [ ] class     PooledAsset
- [ ] class     PoolManager
- [ ] const     poolManager

## src/performance/PerfReporter.ts
- [ ] interface PerfEvent
- [ ] interface PerfSummary
- [ ] interface PerfReporterConfig
- [ ] class     PerfReporter
- [ ] function  getPerfReporter
- [ ] function  shutdownPerfReporter
- [ ] const     perf

## src/performance/ThreadPool.ts
- [ ] interface QnceJob
- [ ] interface ThreadPoolConfig
- [ ] interface ThreadPoolStats
- [ ] class     QnceThreadPool
- [ ] function  getThreadPool
- [ ] function  shutdownThreadPool

## src/persistence/StorageAdapters.ts
- [ ] class     MemoryStorageAdapter
- [ ] class     LocalStorageAdapter
- [ ] class     SessionStorageAdapter
- [ ] class     FileStorageAdapter
- [ ] class     IndexedDBStorageAdapter
- [ ] type      AnyAdapter
- [ ] function  createStorageAdapter
- [ ] function  createStorageAdapter
- [ ] function  createStorageAdapter
- [ ] function  createStorageAdapter
- [ ] function  createStorageAdapter
- [ ] function  createStorageAdapter

## src/schemas/validateStoryData.ts
- [ ] interface SchemaValidation
- [ ] function  validateStoryData

## src/telemetry/core.ts
- [ ] class     RingBuffer
- [ ] class     TelemetryImpl
- [ ] class     ConsoleAdapter
- [ ] interface FileAdapterOptions
- [ ] class     FileAdapter
- [ ] function  createTelemetryAdapter
- [ ] function  createTelemetry

## src/telemetry/types.ts
- [ ] type      Env
- [ ] interface QEvent
- [ ] interface TelemetryAdapter
- [ ] interface TelemetryOptions
- [ ] interface Telemetry

## src/ui/components/AutosaveIndicator.tsx
- [ ] const     AutosaveIndicator

## src/ui/components/UndoRedoControls.tsx
- [ ] const     UndoRedoControls

## src/ui/hooks/useKeyboardShortcuts.ts
- [ ] function  useKeyboardShortcuts

## src/ui/index.ts
- [ ] re-export UndoRedoControls
- [ ] re-export AutosaveIndicator
- [ ] re-export useKeyboardShortcuts

## src/ui/types.ts
- [ ] interface QNCETheme
- [ ] interface UndoRedoControlsProps
- [ ] type      AutosaveStatus
- [ ] interface AutosaveIndicatorProps
- [ ] interface KeyboardShortcutsConfig
- [ ] const     defaultTheme
