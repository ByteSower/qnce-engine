#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import type { StoryData } from '../engine/core.js';
import { loadStoryData } from '../engine/core.js';
import { CustomJSONAdapter } from '../adapters/story/CustomJSONAdapter.js';
import { TwisonAdapter } from '../adapters/story/TwisonAdapter.js';
import { InkAdapter } from '../adapters/story/InkAdapter.js';
import { validateStoryData } from '../schemas/validateStoryData.js';

/**
 * QNCE Import CLI
 * Detects story format (Custom JSON, Twison, basic Ink) and outputs normalized QNCE StoryData JSON
 */

function detectAdapter(payload: unknown) {
  const candidates = [
    { key: 'json', inst: new CustomJSONAdapter() },
    { key: 'twison', inst: new TwisonAdapter() },
    { key: 'ink', inst: new InkAdapter() }
  ];
  for (const c of candidates) {
    try { if (c.inst.detect?.(payload)) return c; } catch {}
  }
  return candidates[0];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  return await new Promise((resolve) => {
    process.stdin.on('data', (d) => chunks.push(Buffer.from(d)));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const showHelp = args.length === 0 && process.stdin.isTTY;
  if (showHelp || args.includes('--help') || args.includes('-h')) {
  console.log(`\nQNCE Import CLI\nUsage: qnce-import <input-file>|(read from stdin) [--out <file>|stdout] [--id-prefix <prefix>] [--format json|twison|ink] [--strict] [--experimental-ink]\n`);
    process.exit(0);
  }

  const formatIdx = args.indexOf('--format');
  const format = formatIdx >= 0 ? args[formatIdx + 1] : undefined;
  const strict = args.includes('--strict');
  const experimentalInk = args.includes('--experimental-ink');
  const idPrefixIndex = args.indexOf('--id-prefix');
  const idPrefix = idPrefixIndex >= 0 ? args[idPrefixIndex + 1] : '';
  const outIndex = args.indexOf('--out');
  const outArg = outIndex >= 0 ? args[outIndex + 1] : undefined;

  let raw: string;
  let inputName = 'stdin';
  if (args[0] && !args[0].startsWith('--')) {
    const inPath = resolve(args[0]);
    inputName = inPath;
    raw = readFileSync(inPath, 'utf-8');
  } else {
    raw = await readStdin();
  }

  let exitCode = 0;

  try {
    const json = JSON.parse(raw);

  let selected: { key: string; inst: any };
    if (format) {
      const map: Record<string, any> = {
        json: new CustomJSONAdapter(),
        twison: new TwisonAdapter(),
        ink: new InkAdapter()
      };
      if (!map[format]) throw new Error(`Unknown format: ${format}`);
      selected = { key: format, inst: map[format] };
    } else {
      selected = detectAdapter(json);
      console.log(`ℹ️  Detected format: ${selected.key} (from ${inputName})`);
    }

    const normalized: StoryData = await selected.inst.load(json, { idPrefix, strict, experimentalInk });

    // Schema validation (strict enforces failure)
    const schema = validateStoryData(normalized);
    if (!schema.valid) {
      const msg = `Schema validation failed with ${schema.errors?.length || 0} error(s).`;
      const fmtErrors = (schema.errors || []).map((e: any) => ` - ${(e.instancePath ?? e.dataPath) || ''} ${e.message || ''}`).join('\n');
      if (strict) {
        console.error(`❌ ${msg}`);
        if (fmtErrors) console.error(fmtErrors);
        process.exit(2);
      } else {
        console.warn(`⚠️  ${msg}`);
        if (fmtErrors) console.warn(fmtErrors);
        exitCode = Math.max(exitCode, 1);
      }
    }

    // Additional semantic checks: initial node exists, dangling nextNodeId targets
    const nodeIds = new Set(normalized.nodes.map(n => n.id));
    const invalidLinks: Array<{ from: string; to: string }> = [];
    for (const n of normalized.nodes) {
      for (const c of n.choices) {
        if (c.nextNodeId && !nodeIds.has(c.nextNodeId)) {
          invalidLinks.push({ from: n.id, to: c.nextNodeId });
        }
      }
    }
    const initialExists = nodeIds.has(normalized.initialNodeId);
    if (!initialExists) {
      const msg = `Initial node '${normalized.initialNodeId}' does not exist in nodes`;
      if (strict) {
        console.error(`❌ ${msg}`);
        process.exit(2);
      } else {
        console.warn(`⚠️  ${msg}`);
        exitCode = Math.max(exitCode, 1);
      }
    }
    if (invalidLinks.length > 0) {
      const msg = `Found ${invalidLinks.length} dangling link(s)`;
      const lines = invalidLinks.slice(0, 10).map(l => ` - ${l.from} -> ${l.to} (missing)`);
      if (strict) {
        console.error(`❌ ${msg}`);
        if (lines.length) console.error(lines.join('\n'));
        process.exit(2);
      } else {
        console.warn(`⚠️  ${msg}`);
        if (lines.length) console.warn(lines.join('\n'));
        exitCode = Math.max(exitCode, 1);
      }
    }

    const story = loadStoryData(normalized);

    if (outArg && outArg !== 'stdout') {
      const outPath = resolve(outArg);
      writeFileSync(outPath, JSON.stringify(story, null, 2));
      console.log(`✅ Imported and normalized to ${outPath}`);
    } else if (!outArg && inputName !== 'stdin') {
      const outPath = resolve(basename(inputName).replace(/\.[^.]+$/, '') + '.qnce.json');
      writeFileSync(outPath, JSON.stringify(story, null, 2));
      console.log(`✅ Imported and normalized to ${outPath}`);
    } else {
      // stdout
      process.stdout.write(JSON.stringify(story, null, 2));
    }

    process.exit(exitCode);
  } catch (err: any) {
    console.error('❌ Import failed:', err?.message || err);
    process.exit(2);
  }
}

const isMainModule = require.main === module;
if (isMainModule) {
  main().catch((e) => {
    console.error('❌ Import failed:', e?.message || e);
    process.exit(2);
  });
}

export {};
