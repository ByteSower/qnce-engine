// Experimental: Phase primitive representing a labeled coexistence region
// @experimental

export interface PhaseContext {
  flags: Record<string, unknown>;
  nodeId?: string;
}

export type PhasePredicate = (ctx: PhaseContext) => boolean;

export class Phase {
  constructor(public readonly name: string, public when?: PhasePredicate) {}
  isActive(ctx: PhaseContext) {
    return !this.when || this.when(ctx);
  }
}
