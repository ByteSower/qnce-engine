// Experimental: Feature flags utility to gate experimental behavior
// @experimental

export type FeatureFlagsConfig = {
  [flag: string]: boolean;
};

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
