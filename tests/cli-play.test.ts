import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

function runCli(args: string[]) {
  const bin = resolve(__dirname, '../dist/cli/play.js');
  const res = spawnSync('node', [bin, ...args], { encoding: 'utf-8' });
  return res;
}

describe('qnce-play CLI --storage', () => {
  beforeAll(() => {
    // Ensure dist is up to date with latest CLI changes
    const build = spawnSync('npm', ['run', 'build'], { encoding: 'utf-8' });
    if (build.status !== 0) {
      throw new Error(`Build failed: ${build.stderr || build.stdout}`);
    }
  });
  test('non-interactive with memory storage saves and lists key', () => {
    const res = runCli(['--storage', 'memory', '--non-interactive', '--save-key', 'slot1']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Storage adapter attached: memory');
  const lines = res.stdout.trim().split('\n').filter(Boolean);
  const summary = JSON.parse(lines[lines.length - 1] || '{}');
    expect(summary.currentNodeId).toBeDefined();
    expect(Array.isArray(summary.storageKeys)).toBe(true);
    expect(summary.storageKeys).toContain('slot1');
  });

  test('file storage saves and then loads from directory', () => {
    const dir = resolve(__dirname, 'tmp-saves');
    try { mkdirSync(dir, { recursive: true }); } catch {}

    // Save
    const resSave = runCli(['--storage', 'file', '--storage-dir', dir, '--non-interactive', '--save-key', 'slotA']);
    expect(resSave.status).toBe(0);

    // Load
    const resLoad = runCli(['--storage', 'file', '--storage-dir', dir, '--non-interactive', '--load-key', 'slotA']);
    expect(resLoad.status).toBe(0);
  const lines = resLoad.stdout.trim().split('\n').filter(Boolean);
  const summary = JSON.parse(lines[lines.length - 1] || '{}');
    expect(summary.currentNodeId).toBeDefined();

    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  });
});
