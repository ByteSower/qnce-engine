// Experimental: Optional integration helpers for quantum primitives behind feature flags
// @experimental

import type { QNCEEngine } from '../engine/core.js';
import { Phase } from './phase.js';
import { Entangler } from './entangler.js';
import { FeatureFlags, type FeatureFlagsConfig } from './flags.js';

export type QuantumIntegration = {
  isPhaseActive: (phase: Phase, ctx?: { nodeId?: string }) => boolean;
  entangle: (configure: (e: Entangler) => Entangler) => void;
  detach: () => void;
  flags: FeatureFlags;
};

/**
 * Attach optional quantum helpers to an engine instance. No-ops unless the corresponding
 * feature flags are enabled. This does not mutate engine behavior; it only provides
 * opt-in utilities that operate against engine.flags.
 */
export function attachQuantumFeatures(
  engine: Pick<QNCEEngine, 'flags'>,
  flagsConfig?: FeatureFlags | FeatureFlagsConfig
): QuantumIntegration {
  const flags = flagsConfig instanceof FeatureFlags ? flagsConfig : new FeatureFlags(flagsConfig);

  const isOn = (key: string) => flags.isEnabled(key);

  return {
    flags,
    isPhaseActive: (phase: Phase, ctx?: { nodeId?: string }) => {
      if (!isOn('quantum.phases')) return false;
      return phase.isActive({ flags: engine.flags, nodeId: ctx?.nodeId });
    },
    entangle: (configure: (e: Entangler) => Entangler) => {
      if (!isOn('quantum.entanglement')) return; // no-op when disabled
      const e = new Entangler();
      configure(e).apply(engine.flags);
    },
    detach: () => {
      // currently stateless; reserved for future wiring
    }
  };
}
