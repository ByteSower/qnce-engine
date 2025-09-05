import { FeatureFlags } from '../src/quantum/flags';

describe('FeatureFlags (experimental)', () => {
  test('enable/disable and isEnabled work', () => {
    const ff = new FeatureFlags({ alpha: false });
    expect(ff.isEnabled('alpha')).toBe(false);
    ff.enable('alpha');
    expect(ff.isEnabled('alpha')).toBe(true);
    ff.disable('alpha');
    expect(ff.isEnabled('alpha')).toBe(false);
  });

  test('getAll returns a copy of flags', () => {
    const ff = new FeatureFlags({ q: true });
    const all = ff.getAll();
    expect(all).toEqual({ q: true });
    all.q = false as any;
    expect(ff.isEnabled('q')).toBe(true);
  });
});
