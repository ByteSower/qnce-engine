// Experimental helper types for quantum primitives
// These are opt-in and may change.

/** @experimental */
export type FeatureFlagKey = string;

/** @experimental */
export type EntangleTransform = (value: unknown) => unknown;

/** @experimental */
export interface PhasePredicateContext {
  flags: Record<string, unknown>;
  nodeId?: string;
}

/** @experimental */
export type PhasePredicate = (ctx: PhasePredicateContext) => boolean;
