// S2-T2: Multithreaded Job Scheduler Integration
// QnceThreadPool for cache loads and telemetry writes off main thread

// Type definitions for cross-environment compatibility
interface WorkerLike {
  postMessage(data: unknown): void;
  terminate(): void;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface NavigatorLike {
  hardwareConcurrency?: number;
}

declare const navigator: NavigatorLike | undefined;
declare const Worker: any;
declare const window: any;

export interface QnceJob {
  id: string;
  type: 'cache-load' | 'telemetry-write' | 'hot-reload-prep' | 'asset-process';
  priority: 'low' | 'normal' | 'high';
  payload: unknown;
  timestamp: number;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export interface ThreadPoolConfig {
  maxWorkers: number;
  queueLimit: number;
  idleTimeout: number; // ms before worker cleanup
  enableProfiling: boolean;
}

export interface ThreadPoolStats {
  activeWorkers: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgExecutionTime: number;
  workerUtilization: number;
}

/**
 * QnceThreadPool - Background job processing for QNCE engine
 * Handles cache operations, telemetry, and other non-blocking tasks
 */
export class QnceThreadPool {
  private workers: WorkerLike[] = [];
  private jobQueue: QnceJob[] = [];
  private activeJobs: Map<string, QnceJob> = new Map();
  private config: ThreadPoolConfig;
  private stats: ThreadPoolStats;
  private isShuttingDown = false;

  constructor(config: Partial<ThreadPoolConfig> = {}) {
    this.config = {
      maxWorkers: config.maxWorkers || Math.max(1, Math.floor(navigator?.hardwareConcurrency || 4) / 2),
      queueLimit: config.queueLimit || 100,
      idleTimeout: config.idleTimeout || 30000,
      enableProfiling: config.enableProfiling || false
    };

    this.stats = {
      activeWorkers: 0,
      queuedJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      avgExecutionTime: 0,
      workerUtilization: 0
    };

    this.initializeWorkers();
  }

  /**
   * Submit job for background processing
   */
  async submitJob<T = unknown>(
    type: QnceJob['type'], 
    payload: unknown, 
    priority: QnceJob['priority'] = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.isShuttingDown) {
        reject(new Error('ThreadPool is shutting down'));
        return;
      }

      if (this.jobQueue.length >= this.config.queueLimit) {
        reject(new Error('Job queue limit exceeded'));
        return;
      }

      const job: QnceJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        priority,
        payload,
        timestamp: performance.now(),
        resolve: resolve as (result: unknown) => void,
        reject
      };

      // Insert based on priority (high -> normal -> low)
      const insertIndex = this.findInsertionIndex(priority);
      this.jobQueue.splice(insertIndex, 0, job);
      this.stats.queuedJobs = this.jobQueue.length;

      this.processQueue();
    });
  }

  /**
   * Cache load operation (S2-T2 primary use case)
   */
  async loadFromCache(cacheKey: string, loader: () => Promise<unknown>): Promise<unknown> {
    return this.submitJob('cache-load', { cacheKey, loader: loader.toString() }, 'normal');
  }

  /**
   * Telemetry write operation (S2-T2 primary use case)
   */
  async writeTelemetry(eventData: unknown): Promise<void> {
    return this.submitJob('telemetry-write', eventData, 'low');
  }

  /**
   * Hot-reload preparation (integration with S2-T3)
   */
  async prepareHotReload(deltaData: unknown): Promise<unknown> {
    return this.submitJob('hot-reload-prep', deltaData, 'high');
  }

  /**
   * Get current thread pool statistics
   */
  getStats(): ThreadPoolStats {
    return { ...this.stats };
  }

  /**
   * Graceful shutdown of thread pool
   */
  async shutdown(timeoutMs = 5000): Promise<void> {
    this.isShuttingDown = true;
    
    const startTime = Date.now();
    
    // Wait for active jobs to complete or timeout
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    this.workers.length = 0;
    this.stats.activeWorkers = 0;
  }

  /**
   * Initialize worker threads based on environment
   */
  private initializeWorkers(): void {
    // Browser environment: Use Web Workers
    if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
      this.initializeWebWorkers();
    } 
    // Node.js environment: Use worker_threads
    else if (typeof require !== 'undefined') {
      this.initializeNodeWorkers();
    }
    // Fallback: Simulate workers with setTimeout (for testing)
    else {
      this.initializeFallbackWorkers();
    }
  }

  /**
   * Web Workers for browser environment
   */
  private initializeWebWorkers(): void {
    const workerCode = this.generateWebWorkerCode();
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new Worker(workerUrl);
        this.setupWorkerHandlers(worker, i);
        this.workers.push(worker);
        this.stats.activeWorkers++;
      } catch (error) {
        console.warn(`Failed to create worker ${i}:`, error);
      }
    }
  }

  /**
   * Node.js worker_threads (placeholder - would need actual implementation)
   */
  private initializeNodeWorkers(): void {
    // TODO: Implement worker_threads for Node.js environment
    // For now, fall back to simulation
    this.initializeFallbackWorkers();
  }

  /**
   * Fallback simulation for testing/development
   */
  private initializeFallbackWorkers(): void {
    // Simulate workers with async processing
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const mockWorker = {
        postMessage: (data: unknown) => {
          // Simulate async processing
          setTimeout(() => {
            this.handleWorkerMessage({
              data: {
                jobId: (data as any).jobId,
                result: `Processed: ${JSON.stringify((data as any).payload)}`,
                success: true
              }
            } as MessageEvent);
          }, Math.random() * 100 + 50); // 50-150ms simulation
        },
        terminate: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      } as unknown as WorkerLike;

      this.workers.push(mockWorker);
      this.stats.activeWorkers++;
    }
  }

  /**
   * Generate Web Worker code for browser execution
   */
  private generateWebWorkerCode(): string {
    return `
      // QNCE Thread Pool Worker
      self.addEventListener('message', function(e) {
        const { jobId, type, payload } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'cache-load':
              // Simulate cache loading
              result = processCache(payload);
              break;
              
            case 'telemetry-write':
              // Simulate telemetry writing
              result = writeTelemetryData(payload);
              break;
              
            case 'hot-reload-prep':
              // Simulate hot-reload preparation
              result = prepareReload(payload);
              break;
              
            case 'asset-process':
              // Simulate asset processing
              result = processAsset(payload);
              break;
              
            default:
              throw new Error('Unknown job type: ' + type);
          }
          
          self.postMessage({
            jobId,
            result,
            success: true
          });
          
        } catch (error) {
          self.postMessage({
            jobId,
            error: error.message,
            success: false
          });
        }
      });
      
      function processCache(payload) {
        // Simulate cache processing work
        const data = JSON.parse(JSON.stringify(payload));
        return { cached: true, data, timestamp: Date.now() };
      }
      
      function writeTelemetryData(payload) {
        // Simulate telemetry write
        return { written: true, bytes: JSON.stringify(payload).length };
      }
      
      function prepareReload(payload) {
        // Simulate hot-reload preparation
        return { prepared: true, deltaSize: JSON.stringify(payload).length };
      }
      
      function processAsset(payload) {
        // Simulate asset processing
        return { processed: true, asset: payload };
      }
    `;
  }

  /**
   * Setup worker message handlers
   */
  private setupWorkerHandlers(worker: WorkerLike, workerId: number): void {
    worker.addEventListener('message', (e: any) => this.handleWorkerMessage(e));
    worker.addEventListener('error', (e: any) => this.handleWorkerError(e, workerId));
  }

  /**
   * Handle worker completion messages
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { jobId, result, error, success } = event.data;
    const job = this.activeJobs.get(jobId);
    
    if (!job) return;
    
    this.activeJobs.delete(jobId);
    
    if (success) {
      job.resolve(result);
      this.stats.completedJobs++;
    } else {
      job.reject(new Error(error));
      this.stats.failedJobs++;
    }
    
    // Update execution time stats
    const executionTime = performance.now() - job.timestamp;
    this.updateExecutionTimeStats(executionTime);
    
    // Process next job in queue
    this.processQueue();
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: any, workerId: number): void {
    console.error(`Worker ${workerId} error:`, error);
    // TODO: Implement worker recovery/restart logic
  }

  /**
   * Process job queue by assigning jobs to available workers
   */
  private processQueue(): void {
    if (this.jobQueue.length === 0) return;
    
    const availableWorkers = this.config.maxWorkers - this.activeJobs.size;
    if (availableWorkers <= 0) return;
    
    const job = this.jobQueue.shift()!;
    this.stats.queuedJobs = this.jobQueue.length;
    
    this.activeJobs.set(job.id, job);
    
    // Find least busy worker (for now, just use round-robin)
    const workerIndex = this.stats.completedJobs % this.workers.length;
    const worker = this.workers[workerIndex];
    
    worker.postMessage({
      jobId: job.id,
      type: job.type,
      payload: job.payload
    });
  }

  /**
   * Find insertion index for job based on priority
   */
  private findInsertionIndex(priority: QnceJob['priority']): number {
    const priorityValues = { high: 3, normal: 2, low: 1 };
    const jobPriority = priorityValues[priority];
    
    for (let i = 0; i < this.jobQueue.length; i++) {
      if (priorityValues[this.jobQueue[i].priority] < jobPriority) {
        return i;
      }
    }
    
    return this.jobQueue.length;
  }

  /**
   * Update execution time statistics
   */
  private updateExecutionTimeStats(executionTime: number): void {
    const totalJobs = this.stats.completedJobs + this.stats.failedJobs;
    this.stats.avgExecutionTime = (
      (this.stats.avgExecutionTime * (totalJobs - 1)) + executionTime
    ) / totalJobs;
    
    this.stats.workerUtilization = (this.activeJobs.size / this.config.maxWorkers) * 100;
  }
}

// Singleton instance for global access
let globalThreadPool: QnceThreadPool | null = null;

export function getThreadPool(config?: Partial<ThreadPoolConfig>): QnceThreadPool {
  if (!globalThreadPool) {
    globalThreadPool = new QnceThreadPool(config);
  }
  return globalThreadPool;
}

export function shutdownThreadPool(): Promise<void> {
  if (globalThreadPool) {
    const shutdown = globalThreadPool.shutdown();
    globalThreadPool = null;
    return shutdown;
  }
  return Promise.resolve();
}
