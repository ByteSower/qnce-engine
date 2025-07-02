// S2-T1: Object Pooling for Narrative Objects
// Generic object pool to eliminate runtime allocations and reduce GC pressure

export interface Poolable {
  reset(): void;
  isInUse(): boolean;
  setInUse(inUse: boolean): void;
}

export interface PoolableConstructor<T extends Poolable> {
  new(): T;
}

/**
 * Generic Object Pool for QNCE narrative objects
 * Reduces GC pressure by reusing objects instead of creating new ones
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private createFn: () => T;
  private maxSize: number;
  private created: number = 0;
  private borrowed: number = 0;
  private returned: number = 0;

  constructor(
    createFn: () => T,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.maxSize = maxSize;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.setInUse(false);
      this.pool.push(obj);
      this.created++;
    }
  }

  /**
   * Borrow an object from the pool
   */
  borrow(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      // Pool exhausted, create new object
      obj = this.createFn();
      this.created++;
    }
    
    obj.reset();
    obj.setInUse(true);
    this.borrowed++;
    
    return obj;
  }

  /**
   * Return an object to the pool
   */
  return(obj: T): void {
    if (!obj.isInUse()) {
      console.warn('Attempting to return object that is not in use');
      return;
    }
    
    obj.setInUse(false);
    this.returned++;
    
    // Only return to pool if under max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // Otherwise let GC handle it (controlled disposal)
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      created: this.created,
      borrowed: this.borrowed,
      returned: this.returned,
      inUse: this.borrowed - this.returned,
      hitRate: this.borrowed > 0 ? ((this.borrowed - this.created) / this.borrowed) * 100 : 0
    };
  }

  /**
   * Clear the pool (useful for testing)
   */
  clear(): void {
    this.pool.forEach(obj => obj.setInUse(false));
    this.pool.length = 0;
    this.created = 0;
    this.borrowed = 0;
    this.returned = 0;
  }

  /**
   * Resize the pool
   */
  resize(newSize: number): void {
    if (newSize < this.pool.length) {
      // Shrink pool
      this.pool.splice(newSize);
    } else if (newSize > this.pool.length) {
      // Grow pool
      const toAdd = newSize - this.pool.length;
      for (let i = 0; i < toAdd && this.pool.length < this.maxSize; i++) {
        const obj = this.createFn();
        obj.setInUse(false);
        this.pool.push(obj);
        this.created++;
      }
    }
  }
}

/**
 * Pooled Flow object for narrative state management
 */
export class PooledFlow implements Poolable {
  private _inUse: boolean = false;
  public nodeId: string = '';
  public timestamp: number = 0;
  public metadata: Record<string, unknown> = {};
  public transitions: string[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.nodeId = '';
    this.timestamp = 0;
    this.metadata = {};
    this.transitions.length = 0;
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }

  // Flow-specific methods
  initialize(nodeId: string, metadata?: Record<string, unknown>): void {
    this.nodeId = nodeId;
    this.timestamp = performance.now();
    if (metadata) {
      this.metadata = { ...metadata };
    }
  }

  addTransition(fromNodeId: string, toNodeId: string): void {
    this.transitions.push(`${fromNodeId}->${toNodeId}`);
  }

  getDuration(): number {
    return performance.now() - this.timestamp;
  }
}

/**
 * Pooled Node object for narrative content
 */
export class PooledNode implements Poolable {
  private _inUse: boolean = false;
  public id: string = '';
  public text: string = '';
  public choices: unknown[] = [];
  public flags: Record<string, unknown> = {};
  public lastAccessed: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.id = '';
    this.text = '';
    this.choices.length = 0;
    this.flags = {};
    this.lastAccessed = 0;
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }

  // Node-specific methods
  initialize(id: string, text: string, choices: unknown[] = []): void {
    this.id = id;
    this.text = text;
    this.choices = [...choices];
    this.lastAccessed = performance.now();
  }

  touch(): void {
    this.lastAccessed = performance.now();
  }
}

/**
 * Pooled Asset object for narrative resources
 */
export class PooledAsset implements Poolable {
  private _inUse: boolean = false;
  public id: string = '';
  public type: string = '';
  public data: unknown = null;
  public size: number = 0;
  public loaded: boolean = false;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.id = '';
    this.type = '';
    this.data = null;
    this.size = 0;
    this.loaded = false;
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }

  // Asset-specific methods
  initialize(id: string, type: string, data: unknown): void {
    this.id = id;
    this.type = type;
    this.data = data;
    this.size = this.calculateSize(data);
    this.loaded = true;
  }

  private calculateSize(data: unknown): number {
    if (typeof data === 'string') {
      return data.length * 2; // Approximate UTF-16 size
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 0;
  }
}

/**
 * Pool Manager - Centralized management of all object pools
 */
export class PoolManager {
  private static instance: PoolManager;
  
  private flowPool: ObjectPool<PooledFlow>;
  private nodePool: ObjectPool<PooledNode>;
  private assetPool: ObjectPool<PooledAsset>;

  private constructor() {
    // Initialize pools with different sizes based on expected usage
    this.flowPool = new ObjectPool(() => new PooledFlow(), 5, 50);
    this.nodePool = new ObjectPool(() => new PooledNode(), 20, 200);
    this.assetPool = new ObjectPool(() => new PooledAsset(), 10, 100);
  }

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  // Flow pool methods
  borrowFlow(): PooledFlow {
    return this.flowPool.borrow();
  }

  returnFlow(flow: PooledFlow): void {
    this.flowPool.return(flow);
  }

  // Node pool methods
  borrowNode(): PooledNode {
    return this.nodePool.borrow();
  }

  returnNode(node: PooledNode): void {
    this.nodePool.return(node);
  }

  // Asset pool methods
  borrowAsset(): PooledAsset {
    return this.assetPool.borrow();
  }

  returnAsset(asset: PooledAsset): void {
    this.assetPool.return(asset);
  }

  // Statistics and monitoring
  getAllStats() {
    return {
      flows: this.flowPool.getStats(),
      nodes: this.nodePool.getStats(),
      assets: this.assetPool.getStats()
    };
  }

  // Performance monitoring
  getGCPressureReduction(): number {
    const stats = this.getAllStats();
    const totalHitRate = (
      stats.flows.hitRate + 
      stats.nodes.hitRate + 
      stats.assets.hitRate
    ) / 3;
    return totalHitRate;
  }

  // Cleanup for testing
  clearAllPools(): void {
    this.flowPool.clear();
    this.nodePool.clear();
    this.assetPool.clear();
  }
}

// Export singleton instance
export const poolManager = PoolManager.getInstance();
