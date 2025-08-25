import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { TwisonAdapter } from '../src/adapters/story/TwisonAdapter';
import { CustomJSONAdapter } from '../src/adapters/story/CustomJSONAdapter';

function runCli(args: string[], input?: string) {
  const bin = resolve(__dirname, '../dist/cli/import.js');
  return spawnSync('node', [bin, ...args], { input, encoding: 'utf-8' });
}

describe('Negative fixtures and strict mode', () => {
  test('Twison missing startnode falls back to name or first passage', async () => {
    const p = resolve(__dirname, '../fixtures/twison-missing-start.json');
    const src = JSON.parse(readFileSync(p, 'utf-8'));
    const adapter = new TwisonAdapter();
    const story = await adapter.load(src);
    expect(story.initialNodeId).toBe('Alpha');
  });

  test('CLI --strict fails on unknown keys in Custom JSON', () => {
    const p = resolve(__dirname, '../fixtures/custom-json-extra-keys.json');
    const res = runCli([p, '--format', 'json', '--strict']);
    expect(res.status).toBe(2);
    expect(res.stderr || res.stdout).toMatch(/Unknown node key/i);
  });

  test('CLI warns and returns code 1 for dangling links in lenient mode', () => {
    const p = resolve(__dirname, '../fixtures/custom-json-dangling-link.json');
    const res = runCli([p, '--format', 'json', '--out', 'stdout']);
    // Process returns 0/1 via res.status; node spawnSync gives status 0 but we print warnings.
    // Our CLI sets process.exit(exitCode), so expect 1 here.
    expect(res.status).toBe(1);
    expect((res.stderr || res.stdout)).toMatch(/dangling link/i);
  });
});
