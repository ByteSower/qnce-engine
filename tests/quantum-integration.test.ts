import { attachQuantumFeatures } from '../src/quantum/integration.js';
import { Phase } from '../src/quantum/phase.js';
import { FeatureFlags } from '../src/quantum/flags.js';
import { createQNCEEngine } from '../src/engine/core.js';

const story = { initialNodeId: 'start', nodes: [{ id: 'start', text: 'hi', choices: [] }] };

describe('quantum integration (experimental)', () => {
  test('isPhaseActive is false by default (flags off)', () => {
    const engine = createQNCEEngine(story);
    const q = attachQuantumFeatures(engine); // no flags provided
    const phase = new Phase('alpha', ({ flags }) => !!flags['unlockAlpha']);
    expect(q.isPhaseActive(phase)).toBe(false);
  });

  test('isPhaseActive respects flags when enabled', () => {
    const engine = createQNCEEngine(story, { flags: { unlockAlpha: true } });
    const q = attachQuantumFeatures(engine, new FeatureFlags({ 'quantum.phases': true }));
    const phase = new Phase('alpha', ({ flags }) => !!flags['unlockAlpha']);
    expect(q.isPhaseActive(phase)).toBe(true);
  });

  test('entangle is a no-op when entanglement flag is off', () => {
    const engine = createQNCEEngine(story, { flags: { a: 1 } });
    const q = attachQuantumFeatures(engine); // flags off
    q.entangle(e => e.bind('a', 'b'));
    expect(engine.flags['b']).toBeUndefined();
  });

  test('entangle applies bindings when entanglement flag is on', () => {
    const engine = createQNCEEngine(story, { flags: { a: 2 } });
    const q = attachQuantumFeatures(engine, new FeatureFlags({ 'quantum.entanglement': true }));
    q.entangle(e => e.bind('a', 'b', v => Number(v) * 2));
    expect(engine.flags['b']).toBe(4);
  });
});
