/* QNCE Micro Benchmarks (ad hoc) */
import { FeatureFlags } from '../src/quantum/flags';
import { Measurement } from '../src/quantum/measurement';

function bench(label: string, fn: () => void, iterations = 300_000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const total = performance.now() - start;
  const perUs = (total * 1000) / iterations; // microseconds/op
  console.log(`${label}: ${total.toFixed(2)}ms total (${perUs.toFixed(3)}µs/op)`);
}

const flags = new FeatureFlags({ phase: false });
bench('FeatureFlags.isEnabled(false)', () => { flags.isEnabled('phase' as any); });
flags.enable('phase' as any);
bench('FeatureFlags.isEnabled(true)', () => { flags.isEnabled('phase' as any); });

// Measurement(name, sampler?) where sampler returns boolean | probability number
const coin = new Measurement('coin');
bench('Measurement.sample() fair coin', () => { coin.sample(); });
const deterministic = new Measurement('alwaysTrue', () => true);
bench('Measurement.sample() deterministic', () => { deterministic.sample(); });
console.log('Done.');
