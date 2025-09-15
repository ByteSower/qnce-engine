/*
 * Micro-benchmark for condition evaluation hot paths.
 * Measures cold vs cached evaluation latency and basic p50/p95 stats.
 */
import { conditionEvaluator } from '../src/engine/condition';
import { createQNCEEngine } from '../src/engine/core';
import { DEMO_STORY } from '../src/engine/demo-story';

interface StatBucket { times: number[]; }

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function run(label: string, expr: string, iterations: number) {
  const engine = createQNCEEngine(DEMO_STORY);
  const ctx = { state: (engine as any).state, timestamp: Date.now() } as any;
  const cold: StatBucket = { times: [] };
  const warm: StatBucket = { times: [] };

  // Cold (first evaluation repeatedly with cache flush each time)
  for (let i = 0; i < iterations; i++) {
    // crude cache flush by touching internal map if present
    (conditionEvaluator as any).functionCache?.clear?.();
    const t0 = performance.now();
    conditionEvaluator.evaluate(expr, ctx);
    cold.times.push(performance.now() - t0);
  }
  // Warm (reuse cache)
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    conditionEvaluator.evaluate(expr, ctx);
    warm.times.push(performance.now() - t0);
  }

  cold.times.sort((a,b)=>a-b); warm.times.sort((a,b)=>a-b);
  function summary(bucket: StatBucket) {
    return {
      n: bucket.times.length,
      min: bucket.times[0]?.toFixed(4),
      p50: percentile(bucket.times, 50).toFixed(4),
      p95: percentile(bucket.times, 95).toFixed(4),
      max: bucket.times[bucket.times.length - 1]?.toFixed(4)
    };
  }
  return { label, expr, cold: summary(cold), warm: summary(warm) };
}

function main() {
  const iterations = parseInt(process.env.QNCE_BENCH_ITERS || '500', 10);
  const expressions = [
    'flags.score > 10 && flags.lives >= 2',
    'flags.mode === "hard" || flags.debug',
    'flags.a && flags.b && flags.c && flags.d',
    'flags.combo > 5 && (flags.streak >= 3 || flags.powerup)'
  ];
  const results = expressions.map((e,i)=>run(`expr${i+1}`, e, iterations));
  // eslint-disable-next-line no-console
  console.log('\nQNCE Condition Evaluation Benchmark');
  // eslint-disable-next-line no-console
  console.log('Iterations per phase (cold/warm):', iterations);
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`\n[${r.label}] ${r.expr}`);
    // eslint-disable-next-line no-console
    console.log('  Cold  p50:', r.cold.p50,'ms p95:', r.cold.p95,'ms min:', r.cold.min,'ms max:', r.cold.max,'ms');
    // eslint-disable-next-line no-console
    console.log('  Warm  p50:', r.warm.p50,'ms p95:', r.warm.p95,'ms min:', r.warm.min,'ms max:', r.warm.max,'ms');
  }
}

main();
