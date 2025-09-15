#!/usr/bin/env ts-node
/**
 * sync-docs.ts
 *
 * Simple one-way sync (docs -> wiki) for paired documentation files.
 * Keeps wiki mirrors updated to match canonical docs versions.
 *
 * Usage:
 *   npx ts-node scripts/sync-docs.ts            # dry run (shows planned updates)
 *   SYNC_WRITE=1 npx ts-node scripts/sync-docs.ts  # apply changes
 *
 * Add new pairs to DOC_PAIRS below.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface DocPair { canonical: string; mirror: string; headerNote?: string }

const ROOT = resolve(__dirname, '..');
const DOC_PAIRS: DocPair[] = [
  {
    canonical: 'docs/ERROR-HANDLING-AND-DEBUG.md',
    mirror: 'wiki/Error-Handling-and-Debug.md',
    headerNote: '> Mirror: Do not edit directly here. Update docs/ERROR-HANDLING-AND-DEBUG.md and run sync.'
  }
];

function normalizeNewlines(content: string) {
  return content.replace(/\r\n/g, '\n');
}

function buildMirrorContent(original: string, note?: string) {
  const lines = normalizeNewlines(original).split('\n');
  // Ensure first heading preserved, then inject/update mirror note after first heading block.
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === '') idx++;
  if (idx < lines.length && lines[idx].startsWith('#')) {
    // Insert note directly after heading line if not already present.
    const headingLineIndex = idx;
    const existingNoteIndex = lines.findIndex(l => l.includes('Mirror: Do not edit'));
    if (note) {
      if (existingNoteIndex === -1) {
        lines.splice(headingLineIndex + 1, 0, '', note, '');
      } else {
        lines[existingNoteIndex] = note; // update note
      }
    }
  }
  return lines.join('\n').trimEnd() + '\n';
}

function syncPair(pair: DocPair) {
  const canonicalPath = resolve(ROOT, pair.canonical);
  const mirrorPath = resolve(ROOT, pair.mirror);

  if (!existsSync(canonicalPath)) {
    console.error(`Canonical doc missing: ${pair.canonical}`);
    return { updated: false, reason: 'missing canonical' };
  }
  if (!existsSync(mirrorPath)) {
    console.error(`Mirror missing: ${pair.mirror}`);
    return { updated: false, reason: 'missing mirror' };
  }

  const canonical = readFileSync(canonicalPath, 'utf8');
  const mirror = readFileSync(mirrorPath, 'utf8');
  const desired = buildMirrorContent(canonical, pair.headerNote);

  if (normalizeNewlines(mirror) === normalizeNewlines(desired)) {
    return { updated: false, reason: 'in sync' };
  }

  if (process.env.SYNC_WRITE) {
    writeFileSync(mirrorPath, desired, 'utf8');
    return { updated: true };
  }
  return { updated: false, reason: 'diff (dry-run)' };
}

function main() {
  const results = DOC_PAIRS.map(p => ({ pair: p, result: syncPair(p) }));
  const updated = results.filter(r => r.result.updated).length;
  console.log('Doc Sync Summary');
  results.forEach(r => {
    const status = r.result.updated ? 'UPDATED' : r.result.reason;
    console.log(`- ${r.pair.canonical} -> ${r.pair.mirror}: ${status}`);
  });
  if (!process.env.SYNC_WRITE) {
    console.log('\n(Dry run) Set SYNC_WRITE=1 to apply file updates.');
  } else {
    console.log(`\nApplied updates: ${updated}`);
  }
  process.exit(0);
}

main();
