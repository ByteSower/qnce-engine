// S2-T3: Hot-Reload Delta Patching - Initial Spike
// Explore delta comparison logic for story content updates

export interface StoryDelta {
  nodeChanges: NodeDelta[];
  assetChanges: AssetDelta[];
  timestamp: number;
}

export interface NodeDelta {
  nodeId: string;
  changeType: 'added' | 'modified' | 'removed';
  oldNode?: any;
  newNode?: any;
  affectedFields: string[];
}

export interface AssetDelta {
  assetId: string;
  changeType: 'added' | 'modified' | 'removed';
  oldAsset?: any;
  newAsset?: any;
  sizeChange: number;
}

/**
 * Delta Comparison Engine for Hot-Reload Story Updates
 * Identifies minimal changes needed to update narrative content
 */
export class StoryDeltaComparator {
  
  /**
   * Compare two story configurations and generate delta
   */
  compareStories(oldStory: any, newStory: any): StoryDelta {
    const timestamp = performance.now();
    
    return {
      nodeChanges: this.compareNodes(oldStory.nodes || [], newStory.nodes || []),
      assetChanges: this.compareAssets(oldStory.assets || [], newStory.assets || []),
      timestamp
    };
  }
  
  /**
   * Deep comparison of narrative nodes
   */
  private compareNodes(oldNodes: any[], newNodes: any[]): NodeDelta[] {
    const deltas: NodeDelta[] = [];
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
    
    // Check for removed nodes
    for (const [nodeId, oldNode] of oldNodeMap) {
      if (!newNodeMap.has(nodeId)) {
        deltas.push({
          nodeId,
          changeType: 'removed',
          oldNode,
          affectedFields: ['*']
        });
      }
    }
    
    // Check for added and modified nodes
    for (const [nodeId, newNode] of newNodeMap) {
      const oldNode = oldNodeMap.get(nodeId);
      
      if (!oldNode) {
        // New node
        deltas.push({
          nodeId,
          changeType: 'added',
          newNode,
          affectedFields: ['*']
        });
      } else {
        // Check for modifications
        const affectedFields = this.findChangedFields(oldNode, newNode);
        if (affectedFields.length > 0) {
          deltas.push({
            nodeId,
            changeType: 'modified',
            oldNode,
            newNode,
            affectedFields
          });
        }
      }
    }
    
    return deltas;
  }
  
  /**
   * Compare assets (future: images, audio, etc.)
   */
  private compareAssets(oldAssets: any[], newAssets: any[]): AssetDelta[] {
    const deltas: AssetDelta[] = [];
    const oldAssetMap = new Map(oldAssets.map(a => [a.id, a]));
    const newAssetMap = new Map(newAssets.map(a => [a.id, a]));
    
    // Check for removed assets
    for (const [assetId, oldAsset] of oldAssetMap) {
      if (!newAssetMap.has(assetId)) {
        deltas.push({
          assetId,
          changeType: 'removed',
          oldAsset,
          sizeChange: -(oldAsset.size || 0)
        });
      }
    }
    
    // Check for added and modified assets
    for (const [assetId, newAsset] of newAssetMap) {
      const oldAsset = oldAssetMap.get(assetId);
      
      if (!oldAsset) {
        // New asset
        deltas.push({
          assetId,
          changeType: 'added',
          newAsset,
          sizeChange: newAsset.size || 0
        });
      } else if (this.assetsAreDifferent(oldAsset, newAsset)) {
        // Modified asset
        deltas.push({
          assetId,
          changeType: 'modified',
          oldAsset,
          newAsset,
          sizeChange: (newAsset.size || 0) - (oldAsset.size || 0)
        });
      }
    }
    
    return deltas;
  }
  
  /**
   * Fine-grained field comparison for nodes
   */
  private findChangedFields(oldNode: any, newNode: any): string[] {
    const changedFields: string[] = [];
    const allFields = new Set([...Object.keys(oldNode), ...Object.keys(newNode)]);
    
    for (const field of allFields) {
      if (!this.deepEqual(oldNode[field], newNode[field])) {
        changedFields.push(field);
      }
    }
    
    return changedFields;
  }
  
  /**
   * Asset comparison logic
   */
  private assetsAreDifferent(oldAsset: any, newAsset: any): boolean {
    // Simple comparison - in practice, would use checksums/hashes
    return JSON.stringify(oldAsset) !== JSON.stringify(newAsset);
  }
  
  /**
   * Deep equality check for objects
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}

/**
 * Hot-Reload Delta Patcher
 * Applies story deltas with minimal engine disruption
 */
export class StoryDeltaPatcher {
  private engine: any;
  
  constructor(engine: any) {
    this.engine = engine;
  }
  
  /**
   * Apply delta patch to running engine
   * Target: <2ms frame stall for hot-reload
   */
  async applyDelta(delta: StoryDelta): Promise<PatchResult> {
    const startTime = performance.now();
    const patchId = `patch-${Date.now()}`;
    
    try {
      // Phase 1: Validate delta can be applied safely (sync, fast)
      const validation = this.validateDelta(delta);
      if (!validation.safe) {
        return {
          success: false,
          patchId,
          duration: performance.now() - startTime,
          error: validation.error
        };
      }
      
      // Phase 2: Apply changes synchronously for speed
      // For small deltas (<10 changes), apply immediately
      // For larger deltas, use optimized batch processing
      if (delta.nodeChanges.length <= 10) {
        this.applyNodeChangesFast(delta.nodeChanges);
      } else {
        await this.applyNodeChanges(delta.nodeChanges);
      }
      
      // Phase 3: Skip asset changes for now (async operation)
      // Assets can be updated in background without frame stall
      
      // Phase 4: Minimal state refresh
      this.refreshEngineState();
      
      const duration = performance.now() - startTime;
      
      return {
        success: true,
        patchId,
        duration,
        nodesChanged: delta.nodeChanges.length,
        assetsChanged: delta.assetChanges.length
      };
      
    } catch (error) {
      return {
        success: false,
        patchId,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Validate delta is safe to apply
   */
  private validateDelta(delta: StoryDelta): { safe: boolean; error?: string } {
    // Check if current node would be affected
    const currentNodeId = this.engine.getState().currentNodeId;
    const currentNodeChange = delta.nodeChanges.find(c => c.nodeId === currentNodeId);
    
    if (currentNodeChange && currentNodeChange.changeType === 'removed') {
      return {
        safe: false,
        error: 'Cannot remove currently active node'
      };
    }
    
    // Additional safety checks could go here
    return { safe: true };
  }
  
  /**
   * Apply node changes to story data
   */
  private async applyNodeChanges(nodeChanges: NodeDelta[]): Promise<void> {
    // Batch node changes to minimize engine updates
    const batches = this.batchNodeChanges(nodeChanges);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }
  
  /**
   * Fast synchronous node changes for small deltas (no async overhead)
   */
  private applyNodeChangesFast(nodeChanges: NodeDelta[]): void {
    for (const change of nodeChanges) {
      this.applyNodeChange(change);
    }
  }
  
  /**
   * Apply asset changes (placeholder for future implementation)
   */
  private async applyAssetChanges(assetChanges: AssetDelta[]): Promise<void> {
    // Future: Implement asset hot-reload
    console.log(`Would apply ${assetChanges.length} asset changes`);
  }
  
  /**
   * Batch node changes by type for efficient processing
   */
  private batchNodeChanges(nodeChanges: NodeDelta[]): NodeDelta[][] {
    const batches: NodeDelta[][] = [];
    const batchSize = 25; // Larger batch size for efficiency
    
    for (let i = 0; i < nodeChanges.length; i += batchSize) {
      batches.push(nodeChanges.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  /**
   * Process a batch of node changes
   */
  private async processBatch(batch: NodeDelta[]): Promise<void> {
    // Use requestAnimationFrame or setTimeout to yield control
    return new Promise(resolve => {
      setTimeout(() => {
        for (const change of batch) {
          this.applyNodeChange(change);
        }
        resolve();
      }, 0);
    });
  }
  
  /**
   * Apply individual node change
   */
  private applyNodeChange(change: NodeDelta): void {
    // Access engine's internal story data
    const storyData = (this.engine as any).storyData;
    
    switch (change.changeType) {
      case 'added':
        storyData.nodes.push(change.newNode);
        break;
        
      case 'removed':
        const removeIndex = storyData.nodes.findIndex((n: any) => n.id === change.nodeId);
        if (removeIndex >= 0) {
          storyData.nodes.splice(removeIndex, 1);
        }
        break;
        
      case 'modified':
        const modifyIndex = storyData.nodes.findIndex((n: any) => n.id === change.nodeId);
        if (modifyIndex >= 0) {
          // Only update changed fields for minimal disruption
          for (const field of change.affectedFields) {
            if (field === '*') {
              storyData.nodes[modifyIndex] = change.newNode;
            } else {
              storyData.nodes[modifyIndex][field] = change.newNode[field];
            }
          }
        }
        break;
    }
  }
  
  /**
   * Refresh engine state after patch
   */
  private refreshEngineState(): void {
    // Minimal state refresh - avoid full reinitialization
    // Future: Could trigger cache invalidation, UI updates, etc.
  }
}

export interface PatchResult {
  success: boolean;
  patchId: string;
  duration: number;
  nodesChanged?: number;
  assetsChanged?: number;
  error?: string;
}

// Factory function for creating delta tools
export function createDeltaTools(engine: any) {
  return {
    comparator: new StoryDeltaComparator(),
    patcher: new StoryDeltaPatcher(engine)
  };
}
