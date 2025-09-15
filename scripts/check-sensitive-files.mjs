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
const FORBIDDEN_CONTENT_SNIPPETS = [
  'confidential sprint',
  'team charter objective',
  'internal planning artifact',
  'do not distribute internally',
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
const PLACEHOLDER_MARKER = 'NOTE: This file previously contained internal planning details.';
const PLACEHOLDER_HASH = createHash('sha256').update(PLACEHOLDER_MARKER).digest('hex');

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
  const upper = relPath.toUpperCase();
  return FORBIDDEN_NAME_PATTERNS.some(p => upper.includes(p.toUpperCase()));
}

function analyzeFile(relPath) {
  const raw = readFileSync(relPath, 'utf8');
  const lower = raw.toLowerCase();

  // If file is sanitized placeholder ensure marker exists
  if (ALLOWLIST_FILES.has(relPath)) {
    if (!raw.includes(PLACEHOLDER_MARKER)) {
      return { relPath, issue: 'Sanitized placeholder file missing marker (potential reintroduction).'};
    }
    // Quick hash based check (not security strong, just drift detection)
    const line0 = raw.split('\n')[0];
    const hash = createHash('sha256').update(line0.trim()).digest('hex');
    if (hash !== PLACEHOLDER_HASH) {
      return { relPath, issue: 'Placeholder header altered - please keep sanitized banner.' };
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
