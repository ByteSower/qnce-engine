// QNCE Branching API - Simplified Runtime Implementation  
// Sprint #3 - Advanced Narrative & AI Integration

import { 
  QNCEStory, 
  Chapter, 
  NarrativeFlow, 
  BranchPoint, 
  BranchContext, 
  BranchOption,
  BranchCondition,
  DynamicBranchOperation,
  BranchHistoryEntry,
  AIBranchingContext 
} from './models';
import { QNCEState, NarrativeNode } from '../../engine/core';

/**
 * QNCE Branching Engine - Core API for dynamic narrative branching
 * Simplified implementation focusing on core functionality
 */
export class QNCEBranchingEngine {
  private story: QNCEStory;
  private context: BranchContext;
  private aiContext?: AIBranchingContext;

  constructor(story: QNCEStory, initialState: QNCEState) {
    this.story = story;
    this.context = this.createBranchContext(story, initialState);
  }

  // ================================
  // Core Branching Operations
  // ================================

  /**
   * Evaluate available branches from current position
   */
  async evaluateAvailableBranches(): Promise<BranchOption[]> {
    const currentNode = this.getCurrentNode();
    const availableBranches = this.findBranchPointsForNode(
      this.context.currentFlow.id, 
      currentNode.id
    );

    const validOptions: BranchOption[] = [];

    for (const branchPoint of availableBranches) {
      // Evaluate branch point conditions
      if (await this.evaluateConditions(branchPoint.conditions || [])) {
        // Evaluate individual option conditions
        for (const option of branchPoint.branchOptions) {
          if (await this.evaluateConditions(option.conditions || [])) {
            validOptions.push(option);
          }
        }
      }
    }

    return validOptions;
  }

  /**
   * Execute a branch transition
   */
  async executeBranch(optionId: string): Promise<boolean> {
    const option = await this.findBranchOption(optionId);
    if (!option) {
      throw new Error(`Branch option not found: ${optionId}`);
    }

    // Apply flag effects
    if (option.flagEffects) {
      Object.assign(this.context.activeState.flags, option.flagEffects);
    }

    // Execute flow transition
    const targetFlow = this.findFlow(option.targetFlowId);
    if (!targetFlow) {
      throw new Error(`Target flow not found: ${option.targetFlowId}`);
    }

    const success = await this.transitionToFlow(targetFlow, option.targetNodeId);

    if (success) {
      // Record branch execution in history
      this.recordBranchHistory(optionId);
      
      // Update analytics
      this.updateBranchAnalytics(optionId);
    }

    return success;
  }

  /**
   * Dynamic branch insertion at runtime
   */
  async insertDynamicBranch(operation: DynamicBranchOperation): Promise<boolean> {
    // Validate operation conditions
    if (operation.conditions && !await this.evaluateConditions(operation.conditions)) {
      return false;
    }

    // Find target location
    const chapter = this.findChapter(operation.targetLocation.chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${operation.targetLocation.chapterId}`);
    }

    // Create new branch point
    const branchPoint: BranchPoint = {
      id: operation.branchId,
      name: operation.payload?.name || `Dynamic Branch ${operation.branchId}`,
      sourceFlowId: operation.targetLocation.flowId,
      sourceNodeId: operation.targetLocation.nodeId,
      branchType: operation.payload?.branchType || 'conditional',
      branchOptions: operation.payload?.branchOptions || [],
      conditions: operation.conditions,
      metadata: {
        usageCount: 0,
        avgTraversalTime: 0,
        playerPreference: 0,
        lastUsed: new Date()
      }
    };

    // Insert into chapter
    chapter.branches.push(branchPoint);
    return true;
  }

  /**
   * Remove dynamic branch
   */
  async removeDynamicBranch(branchId: string): Promise<boolean> {
    for (const chapter of this.story.chapters) {
      const index = chapter.branches.findIndex(b => b.id === branchId);
      if (index !== -1) {
        chapter.branches.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  // ================================
  // AI Integration Methods
  // ================================

  /**
   * Set AI context for enhanced branching decisions
   */
  setAIContext(aiContext: AIBranchingContext): void {
    this.aiContext = aiContext;
  }

  /**
   * Generate AI-driven branch options
   */
  async generateAIBranches(maxOptions = 3): Promise<BranchOption[]> {
    if (!this.aiContext) {
      throw new Error('AI context not set. Call setAIContext() first.');
    }

    const generatedOptions: BranchOption[] = [];
    const playerProfile = this.aiContext.playerProfile;

    // Example: Generate options based on player style
    if (playerProfile.playStyle === 'explorer') {
      generatedOptions.push({
        id: `ai-explore-${Date.now()}`,
        targetFlowId: this.context.currentFlow.id, 
        displayText: "Investigate the mysterious artifact",
        weight: 0.8
      });
    }

    if (playerProfile.playStyle === 'socializer') {
      generatedOptions.push({
        id: `ai-social-${Date.now()}`,
        targetFlowId: this.context.currentFlow.id,
        displayText: "Ask your companion about their past",
        weight: 0.7
      });
    }

    return generatedOptions.slice(0, maxOptions);
  }

  // ================================
  // Analytics & Monitoring
  // ================================

  /**
   * Get current branching analytics
   */
  getBranchingAnalytics() {
    return {
      ...this.context.analytics,
      currentChapter: this.context.currentChapter.id,
      currentFlow: this.context.currentFlow.id,
      historyLength: this.context.branchHistory.length,
      pendingBranches: this.context.pendingBranches.length
    };
  }

  /**
   * Export branching data for external analysis
   */
  exportBranchingData() {
    return {
      story: {
        id: this.story.id,
        title: this.story.title,
        version: this.story.version
      },
      session: {
        startTime: this.context.analytics.sessionStartTime,
        currentState: this.context.activeState,
        branchHistory: this.context.branchHistory,
        analytics: this.context.analytics
      }
    };
  }

  // ================================
  // Private Helper Methods
  // ================================

  private createBranchContext(story: QNCEStory, initialState: QNCEState): BranchContext {
    const initialChapter = story.chapters[0];
    const initialFlow = initialChapter.flows[0];

    return {
      currentStory: story,
      currentChapter: initialChapter,
      currentFlow: initialFlow,
      activeState: initialState,
      branchHistory: [],
      pendingBranches: [],
      analytics: {
        totalBranchesTraversed: 0,
        avgBranchDecisionTime: 0,
        mostPopularBranches: [],
        abandonmentPoints: [],
        completionRate: 0,
        sessionStartTime: new Date()
      }
    };
  }

  private getCurrentNode(): NarrativeNode {
    const currentNodeId = this.context.activeState.currentNodeId;
    const node = this.context.currentFlow.nodes.find(n => n.id === currentNodeId);
    if (!node) {
      throw new Error(`Current node not found: ${currentNodeId}`);
    }
    return node;
  }

  private findBranchPointsForNode(flowId: string, nodeId: string): BranchPoint[] {
    return this.context.currentChapter.branches.filter(
      b => b.sourceFlowId === flowId && b.sourceNodeId === nodeId
    );
  }

  private async evaluateConditions(conditions: BranchCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.evaluateCondition(condition)) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: BranchCondition): Promise<boolean> {
    const { operator, key, value, evaluator } = condition;

    // Custom evaluator takes precedence
    if (evaluator) {
      return evaluator(this.context.activeState, this.context);
    }

    // Standard condition evaluation
    const stateValue = this.context.activeState.flags[key];

    switch (operator) {
      case 'equals':
        return stateValue === value;
      case 'not_equals':
        return stateValue !== value;
      case 'greater':
        return Number(stateValue) > Number(value);
      case 'less':
        return Number(stateValue) < Number(value);
      case 'contains':
        return Array.isArray(stateValue) && stateValue.includes(value);
      case 'exists':
        return stateValue !== undefined;
      default:
        return false;
    }
  }

  private async findBranchOption(optionId: string): Promise<BranchOption | null> {
    for (const chapter of this.story.chapters) {
      for (const branchPoint of chapter.branches) {
        const option = branchPoint.branchOptions.find(o => o.id === optionId);
        if (option) {
          return option;
        }
      }
    }
    return null;
  }

  private findFlow(flowId: string): NarrativeFlow | null {
    for (const chapter of this.story.chapters) {
      const flow = chapter.flows.find(f => f.id === flowId);
      if (flow) {
        return flow;
      }
    }
    return null;
  }

  private findChapter(chapterId: string): Chapter | null {
    return this.story.chapters.find(c => c.id === chapterId) || null;
  }

  private async transitionToFlow(targetFlow: NarrativeFlow, targetNodeId?: string): Promise<boolean> {
    // Find entry point
    let entryNodeId: string;
    
    if (targetNodeId) {
      entryNodeId = targetNodeId;
    } else if (targetFlow.entryPoints.length > 0) {
      // Use highest priority entry point
      const entryPoint = targetFlow.entryPoints.sort((a, b) => b.priority - a.priority)[0];
      entryNodeId = entryPoint.nodeId;
    } else if (targetFlow.nodes.length > 0) {
      // Use first node as fallback
      entryNodeId = targetFlow.nodes[0].id;
    } else {
      return false;
    }

    // Update context
    this.context.currentFlow = targetFlow;
    this.context.activeState.currentNodeId = entryNodeId;
    this.context.activeState.history.push(entryNodeId);

    // Update chapter if necessary
    const targetChapter = this.story.chapters.find(c => 
      c.flows.some(f => f.id === targetFlow.id)
    );
    if (targetChapter) {
      this.context.currentChapter = targetChapter;
    }

    return true;
  }

  private recordBranchHistory(optionId: string): void {
    const historyEntry: BranchHistoryEntry = {
      id: `history-${Date.now()}`,
      branchPointId: 'unknown', // Would need to track this
      chosenOptionId: optionId,
      timestamp: new Date(),
      executionTime: 0, // Would measure actual execution time
      context: {
        currentNodeId: this.context.activeState.currentNodeId,
        flags: { ...this.context.activeState.flags }
      }
    };

    this.context.branchHistory.push(historyEntry);
    
    // Limit history size for memory management
    if (this.context.branchHistory.length > 1000) {
      this.context.branchHistory.splice(0, 100);
    }
  }

  private updateBranchAnalytics(optionId: string): void {
    this.context.analytics.totalBranchesTraversed++;
    
    // Update popular branches
    const popular = this.context.analytics.mostPopularBranches;
    const index = popular.indexOf(optionId);
    if (index !== -1) {
      // Move to front
      popular.splice(index, 1);
      popular.unshift(optionId);
    } else {
      // Add to front
      popular.unshift(optionId);
      // Limit to top 10
      if (popular.length > 10) {
        popular.pop();
      }
    }
  }
}

/**
 * Factory function for creating branching engines
 */
export function createBranchingEngine(
  story: QNCEStory, 
  initialState: QNCEState
): QNCEBranchingEngine {
  return new QNCEBranchingEngine(story, initialState);
}

// Export for engine integration
export { QNCEBranchingEngine as default };
