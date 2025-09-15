// Benchmark: Engine initialization + initial superposition (available choices)
// Target: <50ms for 1k nodes (baseline). Reports p50/p95.
import { createQNCEEngine } from '../src/engine/core';

interface BenchResult { label: string; samples: number[]; }

function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const idx = (p/100)*(sorted.length-1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] + (sorted[hi]-sorted[lo])*w;
}

function genStory(nodes = 1000) {
  const storyNodes = [] as any[];
  for (let i=0;i<nodes;i++) {
    const id = `n${i}`;
    const nextA = `n${(i+1)%nodes}`;
    const nextB = `n${(i+2)%nodes}`;
    storyNodes.push({ id, text: `Node ${i}`, choices: [ { text: 'A', nextNodeId: nextA }, { text: 'B', nextNodeId: nextB } ] });
  }
  return { initialNodeId: 'n0', nodes: storyNodes };
}

function bench(label: string, iterations: number, fn: () => void): BenchResult {
  const samples: number[] = [];
  for (let i=0;i<iterations;i++) {
    const t0 = performance.now();
    fn();
    const dt = performance.now() - t0;
    samples.push(dt);
  }
  console.log(`${label}: p50=${percentile(samples,50).toFixed(2)}ms p95=${percentile(samples,95).toFixed(2)}ms max=${Math.max(...samples).toFixed(2)}ms (n=${iterations})`);
  return { label, samples };
}

async function main() {
  const story = genStory(1000);
  // Warmup
  for (let i=0;i<5;i++) createQNCEEngine(story);
  const init = bench('Engine init (1000 nodes)', 40, () => { createQNCEEngine(story); });
  const engine = createQNCEEngine(story);
  const choices = bench('Get available choices (first node)', 200, () => { engine.getAvailableChoices(); });
  const p95Init = percentile(init.samples,95);
  const p95Choices = percentile(choices.samples,95);
  const target = 50; // ms
  const pass = p95Init < target && p95Choices < target;
  console.log(`\nResult: ${pass ? '✅' : '❌'} p95 init=${p95Init.toFixed(2)}ms p95 choices=${p95Choices.toFixed(2)}ms (<${target}ms target)`);
  if (!pass) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
