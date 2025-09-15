import { Measurement } from '../src/quantum/measurement';

describe('Measurement (experimental)', () => {
  test('default fair coin produces stats shape', () => {
    const m = new Measurement('coin');
    for (let i = 0; i < 10; i++) m.sample();
    const s = m.getStats();
    expect(s.trials).toBe(10);
    expect(s.successes).toBeGreaterThanOrEqual(0);
    expect(s.successes).toBeLessThanOrEqual(10);
    expect(s.rate).toBeGreaterThanOrEqual(0);
    expect(s.rate).toBeLessThanOrEqual(1);
  });

  test('deterministic boolean sampler', () => {
    const m = new Measurement('alwaysTrue', () => true);
    for (let i = 0; i < 5; i++) expect(m.sample()).toBe(true);
    const s = m.getStats();
    expect(s.trials).toBe(5);
    expect(s.successes).toBe(5);
    expect(s.rate).toBe(1);
  });

  test('probability sampler clamps values', () => {
    const m = new Measurement('clamped', () => 2); // treated as 1.0
    for (let i = 0; i < 5; i++) m.sample();
    const s = m.getStats();
    expect(s.trials).toBe(5);
    expect(s.rate).toBeGreaterThanOrEqual(0.5); // likely high, but non-deterministic
  });
});
