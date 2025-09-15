/** Lightweight ring-buffer debug logger (opt-in at runtime). */
export interface DebugLogEntry {
  ts: number; // epoch ms
  level: 'debug';
  event: string;
  data?: Record<string, unknown>;
}

export class DebugLogger {
  private enabled = false;
  private buffer: DebugLogEntry[] = [];
  private capacity: number;

  constructor(capacity = 200) { this.capacity = capacity; }

  setEnabled(v: boolean) { this.enabled = v; }
  isEnabled() { return this.enabled; }

  log(event: string, data?: Record<string, unknown>) {
    if (!this.enabled) return;
    const entry: DebugLogEntry = { ts: Date.now(), level: 'debug', event, data };
    if (this.buffer.length >= this.capacity) this.buffer.shift();
    this.buffer.push(entry);
  }

  flush(): DebugLogEntry[] { return [...this.buffer]; }
  clear() { this.buffer = []; }
}

export const globalDebugLogger = new DebugLogger();
