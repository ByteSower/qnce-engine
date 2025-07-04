// QNCE Branching System - Platform Data Model (PDM)
// Sprint #3 - Advanced Narrative & AI Integration

/**
 * Core branching entities for dynamic narrative flow management
 * Built on Sprint #2 performance infrastructure with object pooling support
 */

import { NarrativeNode, QNCEState } from '../../engine/core';

// ================================
// Story Structure Hierarchy
// ================================

/**
 * Top-level story container with branching metadata
 */
export interface QNCEStory {
  id: string;
  title: string;
  version: string;
  metadata: StoryMetadata;
  chapters: Chapter[];
  branchingConfig: BranchingConfig;
}

export interface StoryMetadata {
  author: string;
  description: string;
  tags: string[];
  createDate: Date;
  lastModified: Date;
  estimatedPlaytime: number; // minutes
}

export interface BranchingConfig {
  maxActiveBranches: number;
  branchCacheSize: number;
  enableDynamicInsertion: boolean;
  enableAnalytics: boolean;
  performanceMode: boolean;
}

/**
 * Chapter: Logical grouping of narrative flows with branching points
 */
export interface Chapter {
  id: string;
  title: string;
  description?: string;
  flows: NarrativeFlow[];
  branches: BranchPoint[];
  prerequisites?: ChapterPrerequisites;
  metadata: ChapterMetadata;
}

export interface ChapterPrerequisites {
  requiredFlags: Record<string, unknown>;
  requiredChoices: string[];
  minPlaytime?: number;
}

export interface ChapterMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  themes: string[];
  estimatedDuration: number; // minutes
  branchComplexity: number; // 1-10 scale
}

// ================================
// Flow & Branching Logic
// ================================

/**
 * NarrativeFlow: Sequence of connected nodes with entry/exit points
 */
export interface NarrativeFlow {
  id: string;
  name: string;
  description?: string;
  nodes: NarrativeNode[];
  entryPoints: FlowEntryPoint[];
  exitPoints: FlowExitPoint[];
  flowType: FlowType;
  metadata: FlowMetadata;
}

export type FlowType = 'linear' | 'branching' | 'conditional' | 'procedural';

export interface FlowEntryPoint {
  id: string;
  nodeId: string; // Entry node within the flow
  conditions?: BranchCondition[];
  priority: number; // Higher priority = evaluated first
}

export interface FlowExitPoint {
  id: string;
  nodeId: string; // Exit node within the flow
  targetFlowId?: string; // Next flow, if specified
  conditions?: BranchCondition[];
}

export interface FlowMetadata {
  complexity: number; // 1-10 scale
  avgCompletionTime: number; // milliseconds
  playerChoiceCount: number;
  aiGeneratedContent: boolean;
}

/**
 * BranchPoint: Dynamic branching logic between flows
 */
export interface BranchPoint {
  id: string;
  name: string;
  sourceFlowId: string;
  sourceNodeId: string;
  branchOptions: BranchOption[];
  branchType: BranchType;
  conditions?: BranchCondition[];
  metadata: BranchMetadata;
}

export type BranchType = 'choice-driven' | 'flag-conditional' | 'time-based' | 'procedural' | 'conditional';

export interface BranchOption {
  id: string;
  targetFlowId: string;
  targetNodeId?: string; // Specific entry point, or flow default
  displayText: string;
  conditions?: BranchCondition[];
  flagEffects?: Record<string, unknown>;
  weight: number; // For procedural selection
}

export interface BranchCondition {
  type: 'flag' | 'choice' | 'time' | 'random' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists';
  key: string;
  value: unknown;
  evaluator?: (state: QNCEState, context: BranchContext) => boolean;
}

export interface BranchMetadata {
  usageCount: number;
  avgTraversalTime: number;
  playerPreference: number; // 0-1 based on analytics
  lastUsed: Date;
}

// ================================
// Runtime Context & State
// ================================

/**
 * BranchContext: Runtime state for branch evaluation and tracking
 */
export interface BranchContext {
  currentStory: QNCEStory;
  currentChapter: Chapter;
  currentFlow: NarrativeFlow;
  activeState: QNCEState;
  branchHistory: BranchHistoryEntry[];
  pendingBranches: PendingBranch[];
  analytics: BranchAnalytics;
}

export interface BranchHistoryEntry {
  id: string;
  branchPointId: string;
  chosenOptionId: string;
  timestamp: Date;
  executionTime: number; // milliseconds
  context: Partial<QNCEState>;
}

export interface PendingBranch {
  id: string;
  branchPointId: string;
  triggerConditions: BranchCondition[];
  timeoutMs?: number;
  createdAt: Date;
}

export interface BranchAnalytics {
  totalBranchesTraversed: number;
  avgBranchDecisionTime: number;
  mostPopularBranches: string[];
  abandonmentPoints: string[];
  completionRate: number;
  sessionStartTime: Date;
}

// ================================
// Dynamic Branch Management
// ================================

/**
 * Dynamic branching operations for runtime story modification
 */
export interface DynamicBranchOperation {
  type: 'insert' | 'remove' | 'modify';
  branchId: string;
  targetLocation: BranchLocation;
  payload?: Partial<BranchPoint>;
  conditions?: BranchCondition[];
}

export interface BranchLocation {
  chapterId: string;
  flowId: string;
  nodeId: string;
  insertionPoint: 'before' | 'after' | 'replace';
}

/**
 * Dynamic flow insertion for procedural content
 */
export interface DynamicFlowOperation {
  type: 'insert' | 'remove' | 'modify';
  flowId: string;
  targetChapterId: string;
  flow?: NarrativeFlow;
  entryConditions?: BranchCondition[];
}

// ================================
// Performance & Pooling Extensions
// ================================

/**
 * Pool-aware branch entities for performance optimization
 */
export interface PooledBranchContext extends BranchContext {
  poolId: string;
  acquisitionTime: number;
  maxLifetime: number;
}

export interface PooledBranchPoint extends BranchPoint {
  poolId: string;
  activeReferences: number;
  lastAccessed: number;
}

// ================================
// AI Integration Interfaces
// ================================

/**
 * Interfaces for AI-driven content generation and branching
 */
export interface AIBranchingContext {
  playerProfile: PlayerProfile;
  narrativeContext: NarrativeContext;
  generationHints: AIGenerationHints;
}

export interface PlayerProfile {
  playStyle: 'explorer' | 'achiever' | 'socializer' | 'killer';
  preferences: Record<string, number>; // 0-1 scale
  historicalChoices: string[];
  averageDecisionTime: number;
}

export interface NarrativeContext {
  currentTone: string;
  thematicElements: string[];
  characterRelationships: Record<string, number>;
  plotTension: number; // 0-1 scale
}

export interface AIGenerationHints {
  maxBranchDepth: number;
  desiredComplexity: number;
  contentThemes: string[];
  avoidElements: string[];
}

// All interfaces are exported above and ready for engine integration
