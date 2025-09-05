import { Entangler } from '../src/quantum/entangler';
import { Phase } from '../src/quantum/phase';

describe('Quantum primitives (experimental)', () => {
  test('Entangler binds values with optional transform', () => {
    const e = new Entangler();
    const flags: Record<string, unknown> = { mood: 'calm' };
    e.bind('mood', 'narrationTone', v => (v === 'calm' ? 'soft' : 'tense'));
    e.apply(flags);
    expect(flags.narrationTone).toBe('soft');
  });

  test('Phase activates based on predicate', () => {
    const asleep = new Phase('dreaming', ({ flags }) => !!flags.asleep);
    const ctx = { flags: { asleep: true } };
    expect(asleep.isActive(ctx)).toBe(true);
  });
});
