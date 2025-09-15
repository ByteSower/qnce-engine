#!/usr/bin/env node
/**
 * License Audit Placeholder
 *
 * This is a lightweight placeholder script that can be replaced with a more
 * comprehensive license compliance tool (e.g. license-checker, ORT) later.
 * For now it enumerates production dependencies and prints their license field.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }

function getProdDeps() {
  const raw = execSync('npm ls --prod --json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const data = safeParse(raw);
  if (!data || !data.dependencies) return {};
  return data.dependencies;
}

function flatten(deps, acc = {}, path = []) {
  for (const [name, meta] of Object.entries(deps)) {
    if (!meta || acc[name]) continue; // simple de-dupe by name (not version-specific here)
    acc[name] = meta;
    if (meta.dependencies) flatten(meta.dependencies, acc, path.concat(name));
  }
  return acc;
}

function main() {
  const rootPkg = safeParse(readFileSync('package.json', 'utf8'));
  const prod = flatten(getProdDeps());
  console.log('QNCE Engine License Inventory (placeholder)');
  console.log('Root Package:', rootPkg?.name, rootPkg?.version);
  console.log('');
  const rows = Object.entries(prod).map(([name, meta]) => ({
    name,
    version: meta.version,
    license: meta.license || meta.licenses || 'UNKNOWN'
  })).sort((a,b)=> a.name.localeCompare(b.name));

  for (const r of rows) {
    console.log(`${r.name}@${r.version} -> ${Array.isArray(r.license)? r.license.join(', '): r.license}`);
  }
  console.log('\nSummary:');
  const counts = new Map();
  for (const r of rows) {
    const key = Array.isArray(r.license)? r.license.join(', '): r.license;
    counts.set(key, (counts.get(key)||0)+1);
  }
  for (const [lic,count] of counts.entries()) {
    console.log(` - ${lic}: ${count}`);
  }
  console.log('\n(Placeholder) For enforcement integrate a formal SPDX / policy tool.');
}

main();
