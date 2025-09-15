/**
 * Phase primitive representing a labeled coexistence region
 * @beta
 * @experimental
 */

/** @beta @experimental */
export interface PhaseContext {
  flags: Record<string, unknown>;
  nodeId?: string;
}

/** @beta @experimental */
export type PhasePredicate = (ctx: PhaseContext) => boolean;

/** @beta @experimental */
export class Phase {
  constructor(public readonly name: string, public when?: PhasePredicate) {}
  isActive(ctx: PhaseContext) {
    return !this.when || this.when(ctx);
  }
}
