#!/usr/bin/env node
// Simple API inventory generator: scans src/**/*.ts(x) for exported symbols
// Outputs docs/API-INVENTORY.local.md (ignored by Git)
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'src');
const OUT_FILE = path.join(ROOT, 'docs', 'API-INVENTORY.local.md');

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip build, coverage, and test output folders if any under src
      if (/(^|\/)dist($|\/)|(^|\/)__tests__($|\/)|(^|\/)fixtures($|\/)/.test(full)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
        yield full;
      }
    }
  }
}

function extractExports(content) {
  const lines = content.split(/\r?\n/);
  const exports = [];
  const push = (kind, name, extra) => exports.push({ kind, name: name || 'default', extra });

  // Simple regexes for common TS export forms
  const regexes = [
    { kind: 'function', re: /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/ },
    { kind: 'class',    re: /export\s+class\s+([A-Za-z0-9_]+)/ },
    { kind: 'interface',re: /export\s+interface\s+([A-Za-z0-9_]+)/ },
    { kind: 'type',     re: /export\s+type\s+([A-Za-z0-9_]+)/ },
    { kind: 'const',    re: /export\s+const\s+([A-Za-z0-9_]+)/ },
    { kind: 'enum',     re: /export\s+enum\s+([A-Za-z0-9_]+)/ },
    { kind: 'default',  re: /export\s+default\s+(?:class|function)?\s*([A-Za-z0-9_]+)?/ },
  ];

  for (const line of lines) {
    // re-exports like: export { A, B as C } from './mod'
    const reexport = line.match(/^export\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/);
    if (reexport) {
      const names = reexport[1].split(',').map(s => s.trim());
      for (const n of names) {
        const [orig, alias] = n.split(/\s+as\s+/i).map(s => s.trim());
        exports.push({ kind: 're-export', name: alias || orig, extra: { from: true, orig } });
      }
      continue;
    }
    for (const { kind, re } of regexes) {
      const m = line.match(re);
      if (m) push(kind, m[1]);
    }
  }
  return exports;
}

async function main() {
  const map = new Map(); // file -> exports
  for await (const file of walk(SRC_DIR)) {
    const rel = path.relative(ROOT, file);
    const content = await fs.readFile(file, 'utf8');
    const ex = extractExports(content);
    if (ex.length) map.set(rel, ex);
  }

  const sections = [];
  sections.push('# QNCE Engine – API Inventory (Local)');
  sections.push('');
  sections.push('_Generated from source exports. For planning only; not tracked in Git._');
  sections.push('');

  const files = Array.from(map.keys()).sort();
  for (const rel of files) {
    sections.push(`## ${rel}`);
    const ex = map.get(rel);
    for (const e of ex) {
      const kind = e.kind.padEnd(9);
      sections.push(`- [ ] ${kind} ${e.name}`);
    }
    sections.push('');
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, sections.join('\n'), 'utf8');
  console.log(`🧾 API inventory written to ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch(err => {
  console.error('Failed to generate API inventory:', err);
  process.exit(1);
});
