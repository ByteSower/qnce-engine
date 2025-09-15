/** Simple aggregated hot-path profiler for micro-sections. */
export interface HotSample { count: number; totalMs: number; maxMs: number; }

export class HotProfiler {
  private map = new Map<string, HotSample>();
  private enabled = false;
  enable(v = true) { this.enabled = v; }
  isEnabled() { return this.enabled; }
  wrap<T>(label: string, fn: () => T): T {
    if (!this.enabled) return fn();
    const t0 = performance.now();
    try { return fn(); } finally {
      const ms = performance.now() - t0;
      const s = this.map.get(label) || { count: 0, totalMs: 0, maxMs: 0 };
      s.count++; s.totalMs += ms; if (ms > s.maxMs) s.maxMs = ms; this.map.set(label, s);
    }
  }
  summary() {
    const out: Record<string, { count: number; avgMs: number; maxMs: number }> = {};
    for (const [k, v] of this.map) out[k] = { count: v.count, avgMs: v.totalMs / v.count, maxMs: v.maxMs };
    return out;
  }
  reset() { this.map.clear(); }
}

export const globalHotProfiler = new HotProfiler();
