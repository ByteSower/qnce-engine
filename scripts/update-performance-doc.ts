#!/usr/bin/env ts-node
/*
 * update-performance-doc.ts
 *
 * Runs the condition evaluation benchmark and injects/updates a profiling snapshot
 * section in docs/PERFORMANCE.md between markers.
 *
 * Markers used:
 *   <!-- PROFILING-SNAPSHOT:START -->
 *   <!-- PROFILING-SNAPSHOT:END -->
 *
 * Usage:
 *   npx ts-node scripts/update-performance-doc.ts        # default iterations (500)
 *   QNCE_BENCH_ITERS=300 npx ts-node scripts/update-performance-doc.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

const ROOT = resolve(__dirname, '..');
const PERF_DOC = resolve(ROOT, 'docs', 'PERFORMANCE.md');
const BENCH_SCRIPT = resolve(ROOT, 'scripts', 'perf-conditions.ts');
const START = '<!-- PROFILING-SNAPSHOT:START -->';
const END = '<!-- PROFILING-SNAPSHOT:END -->';

function runBenchmark(): string {
  if (!existsSync(BENCH_SCRIPT)) throw new Error('Benchmark script missing: ' + BENCH_SCRIPT);
  const env = { ...process.env };
  // Ensure ts-node register works; rely on devDependency
  const result = spawnSync('npx', ['-y', 'ts-node', BENCH_SCRIPT], { env, cwd: ROOT, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Benchmark failed: ' + result.stderr);
  return result.stdout;
}

interface BenchRow { label: string; expr: string; coldP50: string; coldP95: string; warmP50: string; warmP95: string; }

function parse(output: string): BenchRow[] {
  const rows: BenchRow[] = [];
  const lines = output.split(/\r?\n/);
  let current: Partial<BenchRow> | null = null;
  for (const line of lines) {
    const matchHeader = line.match(/^\[(expr\d+)\]\s+(.+)/);
    if (matchHeader) {
      if (current && current.label && current.expr && current.coldP50 && current.warmP50) {
        rows.push(current as BenchRow);
      }
      current = { label: matchHeader[1], expr: matchHeader[2] };
      continue;
    }
    const cold = line.match(/Cold\s+p50:\s+([0-9.]+) ms p95:\s+([0-9.]+)/);
    if (cold && current) { current.coldP50 = cold[1]; current.coldP95 = cold[2]; }
    const warm = line.match(/Warm\s+p50:\s+([0-9.]+) ms p95:\s+([0-9.]+)/);
    if (warm && current) { current.warmP50 = warm[1]; current.warmP95 = warm[2]; }
  }
  if (current && current.label && current.expr && current.coldP50 && current.warmP50) rows.push(current as BenchRow);
  return rows;
}

function buildSection(rows: BenchRow[]): string {
  const ts = new Date().toISOString();
  const header = '### Profiling Snapshot (Automated)\n\n' +
    `Generated: ${ts}\n\n` +
    'Condition evaluation benchmark cold vs warm cache latency (milliseconds). ' +
    'Targets: keep warm p50 < 0.002 ms for simple expressions.\n\n';
  const tableHeader = '| Expr | Cold p50 | Cold p95 | Warm p50 | Warm p95 |\n|------|---------:|---------:|---------:|---------:|';
  const tableRows = rows.map(r => {
    const short = r.expr.length > 40 ? r.expr.slice(0,37) + '…' : r.expr;
    return `| ${short} | ${r.coldP50} | ${r.coldP95 ?? '-'} | ${r.warmP50} | ${r.warmP95 ?? '-'} |`;
  }).join('\n');
  return [START, '\n', header, tableHeader, '\n', tableRows, '\n', END].join('\n');
}

function inject(doc: string, section: string): string {
  if (doc.includes(START) && doc.includes(END)) {
    return doc.replace(new RegExp(START + '[\s\S]*?' + END), section);
  }
  // Append before final newline or at end
  return doc.trimEnd() + '\n\n' + section + '\n';
}

function main() {
  if (!existsSync(PERF_DOC)) throw new Error('Performance doc missing: ' + PERF_DOC);
  const benchOut = runBenchmark();
  const rows = parse(benchOut);
  if (!rows.length) throw new Error('No benchmark rows parsed');
  const section = buildSection(rows);
  const original = readFileSync(PERF_DOC, 'utf8');
  const updated = inject(original, section);
  if (updated === original) {
    console.log('Performance doc already up to date.');
  } else {
    writeFileSync(PERF_DOC, updated, 'utf8');
    console.log('Performance doc updated with profiling snapshot.');
  }
}

main();
