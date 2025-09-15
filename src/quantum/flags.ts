/**
 * Feature flags utility to gate experimental behavior
 * @beta
 * @experimental
 */

/**
 * @beta
 * @experimental
 */
export type FeatureFlagsConfig = {
  [flag: string]: boolean;
};

/** @beta @experimental */
export class FeatureFlags {
  private flags: FeatureFlagsConfig;

  constructor(initial?: FeatureFlagsConfig) {
    this.flags = { ...(initial || {}) };
  }

  enable(flag: string) {
    this.flags[flag] = true;
  }

  disable(flag: string) {
    this.flags[flag] = false;
  }

  isEnabled(flag: string) {
    return !!this.flags[flag];
  }

  getAll() {
    return { ...this.flags };
  }
}
