#!/usr/bin/env node
/**
 * Sensitive File Guard Script
 *
 * Scans the repository for forbidden patterns or re-introduction of sanitized internal
 * planning artifacts. Intended to run locally (npm run check:sensitive) and in CI.
 *
 * Exit Codes:
 *  0 - No violations
 *  1 - Violations detected
 */
import { createHash } from 'node:crypto';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// Directories to skip entirely
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'coverage', '.github', '.vscode'
]);

// File globs/pattern fragments considered sensitive if (re)introduced
const FORBIDDEN_NAME_PATTERNS = [
  'SPRINT_0', // any sprint artifact
  'SPRINT_01',
  'SPRINT_TEMPLATE',
  'TEAM_CHARTER',
  'COMMUNICATION',
  'ROADMAP-CHECKLIST',
  'API-INVENTORY',
  'internal-roadmap',
  'private-roadmap'
];

// Content signatures (lowercased substring checks) that should not appear
// Content snippets: keep minimal to reduce false positives in legitimate policy docs.
// Removed broad phrases like "internal planning artifact" which appear in sanitized warnings.
const FORBIDDEN_CONTENT_SNIPPETS = [
  'confidential sprint',
  'private retrospective'
];

// Allowlist of files that are known sanitized placeholders
const ALLOWLIST_FILES = new Set([
  'docs/ROADMAP.md',
  'docs/ROADMAP-CHECKLIST.local.md',
  'docs/API-INVENTORY.local.md',
  'docs/collaboration/COMMUNICATION.md',
  'docs/collaboration/SPRINT_01_CURRENT.md',
  'docs/collaboration/SPRINT_TEMPLATE.md',
  'docs/collaboration/TEAM_CHARTER.md'
]);

// Hash baseline of sanitized placeholder header marker (first line comment) to confirm still sanitized
// We accept any of several sanctioned placeholder banner prefixes to allow flexible wording.
const PLACEHOLDER_MARKERS = [
  'NOTE: This file previously contained internal planning details.',
  'Sanitized:',
  '(Sanitized)' ,
  'Removed from tracked repo'
];

const PLACEHOLDER_HASHES = new Set(PLACEHOLDER_MARKERS.map(m => createHash('sha256').update(m).digest('hex')));

function walk(dir, root, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(root, full);
    if (!rel) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      if (IGNORE_DIRS.has(entry)) continue;
      walk(full, root, results);
    } else {
      results.push({ path: rel });
    }
  }
  return results;
}

function fileMatchesNamePattern(relPath) {
  // Ignore tooling/scripts directory for name-based checks; intent is to catch docs or stray uploads
  if (relPath.startsWith('scripts/')) return false;
  const upper = relPath.toUpperCase();
  return FORBIDDEN_NAME_PATTERNS.some(p => upper.includes(p.toUpperCase()));
}

function analyzeFile(relPath) {
  const raw = readFileSync(relPath, 'utf8');
  const lower = raw.toLowerCase();

  // If file is sanitized placeholder ensure marker exists
  if (ALLOWLIST_FILES.has(relPath)) {
    // Validate at least one marker present anywhere near top (first 5 lines)
    const firstLines = raw.split('\n').slice(0, 5).join(' ');
    const markerFound = PLACEHOLDER_MARKERS.some(m => firstLines.includes(m));
    if (!markerFound) {
      return { relPath, issue: 'Sanitized placeholder file missing recognized marker (potential reintroduction).'};
    }
    // Optional hash drift check (non-fatal) - tolerate wording variation
    const line0 = raw.split('\n').find(l => l.trim().length > 0) || '';
    const hash = createHash('sha256').update(line0.replace(/^<!--\s*/,'').trim()).digest('hex');
    if (![...PLACEHOLDER_HASHES].includes(hash)) {
      // Not returning violation - informational only.
      // console.log(`Info: placeholder header variant detected in ${relPath}`);
    }
    return null; // placeholder validated
  }

  // Name pattern check (only if not allowlisted)
  if (fileMatchesNamePattern(relPath)) {
    return { relPath, issue: 'Filename resembles forbidden internal planning artifact.' };
  }

  // Content pattern check
  const snippet = FORBIDDEN_CONTENT_SNIPPETS.find(s => lower.includes(s));
  if (snippet) {
    return { relPath, issue: `Contains forbidden content snippet: "${snippet}"` };
  }

  return null;
}

function main() {
  const root = process.cwd();
  const files = walk(root, root);
  const violations = [];
  for (const f of files) {
    // Only scan text-like files
    if (/\.(?:png|jpg|jpeg|gif|svg|ico|lock|map|gz|zip|tgz|jar|bin)$/i.test(f.path)) continue;
  // Skip scanning this script itself
  if (f.path === 'scripts/check-sensitive-files.mjs') continue;
  const issue = analyzeFile(f.path);
    if (issue) violations.push(issue);
  }

  if (violations.length) {
    console.error('\nSensitive file guard detected issues:\n');
    for (const v of violations) {
      console.error(` - ${v.relPath}: ${v.issue}`);
    }
    console.error('\nRefuse to proceed. Sanitize or remove offending files.');
    process.exit(1);
  } else {
    console.log('✅ Sensitive file scan passed (no violations).');
  }
}

main();
