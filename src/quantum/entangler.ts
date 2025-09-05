// Experimental: Entangler primitive for declarative variable binding
// @experimental

export type TransformFn = (value: unknown) => unknown;

export class Entangler<TKey extends string = string> {
  private bindings: Array<{ from: TKey; to: TKey; transform?: TransformFn }> = [];

  bind(from: TKey, to: TKey, transform?: TransformFn) {
    this.bindings.push({ from, to, transform });
    return this;
  }

  apply(flags: Record<string, unknown>) {
    for (const b of this.bindings) {
      const v = flags[b.from as string];
      flags[b.to as string] = b.transform ? b.transform(v) : v;
    }
  }
}
