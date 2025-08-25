import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

function runCli(args: string[], input?: string) {
  const bin = resolve(__dirname, '../dist/cli/import.js');
  const res = spawnSync('node', [bin, ...args], { input, encoding: 'utf-8' });
  return res;
}

describe('qnce-import CLI', () => {
  test('imports Custom JSON and writes default out', () => {
    const tmp = resolve(__dirname, 'tmp-story.json');
    writeFileSync(tmp, JSON.stringify({ initialNodeId: 'start', nodes: [{ id: 'start', text: 'hi', choices: [] }] }));
    const res = runCli([tmp]);
    expect(res.status).toBe(0);
    // Cleanup generated file
    try { unlinkSync(resolve(__dirname, 'tmp-story.qnce.json')); } catch {}
    try { unlinkSync(tmp); } catch {}
  });

  test('reads from stdin and outputs to stdout', () => {
    const input = JSON.stringify({ initialNodeId: 'start', nodes: [{ id: 'start', text: 'hi', choices: [] }] });
    const res = runCli(['--out', 'stdout'], input);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('"initialNodeId": "start"');
  });
});
