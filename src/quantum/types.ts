// Experimental helper types for quantum primitives
// These are opt-in and may change.

/** @beta @experimental */
export type FeatureFlagKey = string;

/** @beta @experimental */
export type EntangleTransform = (value: unknown) => unknown;

/** @beta @experimental */
export interface PhasePredicateContext {
  flags: Record<string, unknown>;
  nodeId?: string;
}

/** @beta @experimental */
export type PhasePredicate = (ctx: PhasePredicateContext) => boolean;
