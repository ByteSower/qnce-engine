/**
 * @beta Adaptive control utilities (EMA smoothing & dynamic sampling scaffolding)
 * These are internal-to-engine but marked @beta for potential future public exposure.
 */

export interface EmaOptions {
  alpha?: number; // Smoothing factor (0 < alpha <= 1). Lower -> heavier smoothing.
  seed?: number;  // Optional initial value to avoid cold start bias.
}

/**
 * Exponential Moving Average smoother for latency / rate metrics.
 */
export class EmaSmoother {
  private alpha: number;
  private current: number | null;

  constructor(opts: EmaOptions = {}) {
    this.alpha = opts.alpha ?? 0.2; // moderate smoothing default
    this.current = typeof opts.seed === 'number' ? opts.seed : null;
  }

  update(sample: number): number {
    if (sample < 0 || !isFinite(sample)) return this.current ?? 0;
    if (this.current === null) {
      this.current = sample; // seed on first valid sample
    } else {
      this.current = this.alpha * sample + (1 - this.alpha) * this.current;
    }
    return this.current;
  }

  value(): number { return this.current ?? 0; }
  reset(): void { this.current = null; }
}

/**
 * AdaptiveSampler decides whether to emit an event based on a moving events/sec rate
 * and rejection/backpressure signals.
 *
 * Strategy (initial skeleton):
 *  - Maintain an EMA of events/sec (caller supplies instantaneous rate or we derive externally)
 *  - If rate below low watermark -> sample 100%
 *  - If rate above high watermark -> down-sample linearly toward minSampleRate
 *  - Always allow 'error' / critical categories (caller responsibility).
 */
export interface AdaptiveSamplerConfig {
  lowWatermark: number;    // events/sec below which we sample everything
  highWatermark: number;   // events/sec above which we enforce max down-sampling
  minSampleRate: number;   // floor sample rate (0..1)
  alpha?: number;          // EMA smoothing factor for rate
  enabled?: boolean;       // gate
}

export class AdaptiveSampler {
  private cfg: AdaptiveSamplerConfig;
  private ema: EmaSmoother;
  private lastTickTime = performance.now();
  private eventsThisInterval = 0;

  constructor(cfg: Partial<AdaptiveSamplerConfig> = {}) {
    this.cfg = {
      lowWatermark: cfg.lowWatermark ?? 500,      // generous default
      highWatermark: cfg.highWatermark ?? 5000,   // heavy load threshold
      minSampleRate: cfg.minSampleRate ?? 0.2,
      alpha: cfg.alpha ?? 0.25,
      enabled: cfg.enabled ?? false
    };
    this.ema = new EmaSmoother({ alpha: this.cfg.alpha });
  }

  /** Should be called for each candidate event; returns true if event should be kept */
  shouldSample(): boolean {
    if (!this.cfg.enabled) return true;
    this.eventsThisInterval++;
    const now = performance.now();
    const elapsed = now - this.lastTickTime;
    if (elapsed >= 1000) { // once per second bucket
      const rate = (this.eventsThisInterval * 1000) / elapsed;
      this.ema.update(rate);
      this.eventsThisInterval = 0;
      this.lastTickTime = now;
    }
    const rateEma = this.ema.value();
    if (rateEma <= this.cfg.lowWatermark) return true;
    if (rateEma >= this.cfg.highWatermark) {
      // max pressure -> min sample rate
      return Math.random() < this.cfg.minSampleRate;
    }
    // interpolate sample rate between 1.0 and minSampleRate
    const span = this.cfg.highWatermark - this.cfg.lowWatermark;
    const over = rateEma - this.cfg.lowWatermark;
    const t = over / span; // 0..1
    const targetRate = 1 - t * (1 - this.cfg.minSampleRate);
    return Math.random() < targetRate;
  }

  /** Force enable/disable at runtime */
  setEnabled(enabled: boolean): void { this.cfg.enabled = enabled; }
  isEnabled(): boolean { return !!this.cfg.enabled; }
  getCurrentRateEstimate(): number { return this.ema.value(); }
}

// Factory (placeholder) - future config integration point
export function createDefaultAdaptiveSampler(): AdaptiveSampler {
  const envEnabled = typeof process !== 'undefined' && !!process.env.QNCE_ADAPTIVE_SAMPLING;
  return new AdaptiveSampler({ enabled: envEnabled });
}
