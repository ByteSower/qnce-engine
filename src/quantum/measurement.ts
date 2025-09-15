// Experimental Measurement primitive
// Allows sampling outcomes (boolean or probabilistic) and tracking rates.

/** @beta @experimental */
export type MeasurementContext = { flags: Record<string, unknown>; nodeId?: string };

/** @beta @experimental */
export type Sampler = (ctx: MeasurementContext) => boolean | number; // number => probability [0,1]

/** @beta @experimental */
export class Measurement {
  readonly name: string;
  private sampler?: Sampler;
  private trials = 0;
  private successes = 0;

  constructor(name: string, sampler?: Sampler) {
    this.name = name;
    this.sampler = sampler;
  }

  sample(ctx: MeasurementContext = { flags: {} }): boolean {
    let result: boolean;
    if (this.sampler) {
      const out = this.sampler(ctx);
      if (typeof out === 'number') {
        const p = Math.max(0, Math.min(1, out));
        result = Math.random() < p;
      } else {
        result = !!out;
      }
    } else {
      // default fair coin
      result = Math.random() < 0.5;
    }
    this.trials++;
    if (result) this.successes++;
    return result;
  }

  getStats() {
    const { trials, successes } = this;
    const rate = trials > 0 ? successes / trials : 0;
    return { trials, successes, rate };
  }
}
