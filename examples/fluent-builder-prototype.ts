// Prototype: Fluent narrative builder to explore ergonomics
// Not part of the public API; for design validation only.

type Predicate<T> = (ctx: T) => boolean;

interface BuilderContext {
  flags: Record<string, unknown>;
  nodeId?: string;
}

class Phase {
  constructor(public readonly name: string, public when?: Predicate<BuilderContext>) {}
}

class Entangler<TKeys extends string = string> {
  private bindings: Array<{ from: TKeys; to: TKeys; transform?: (v: any) => any }>= [];
  bind(from: TKeys, to: TKeys, transform?: (v: any) => any) {
    this.bindings.push({ from, to, transform });
    return this;
  }
  apply(flags: Record<string, unknown>) {
    for (const b of this.bindings) {
      const v = flags[b.from];
      flags[b.to] = b.transform ? b.transform(v) : v;
    }
  }
}

class NarrativeBuilder {
  private phases: Phase[] = [];
  private entangler = new Entangler<string>();

  phase(name: string, when?: Predicate<BuilderContext>) {
    this.phases.push(new Phase(name, when));
    return this;
  }

  entangle(from: string, to: string, transform?: (v: any) => any) {
    this.entangler.bind(from, to, transform);
    return this;
  }

  measure(cb: (ctx: BuilderContext) => void) {
    // noop placeholder for prototype
    return this;
  }

  run(initial: BuilderContext) {
    const ctx: BuilderContext = { flags: { ...initial.flags }, nodeId: initial.nodeId };
    // apply entanglement first
    this.entangler.apply(ctx.flags);
    // evaluate phases
    const active = this.phases.filter(p => !p.when || p.when(ctx)).map(p => p.name);
    return { ctx, activePhases: active };
  }
}

// Tiny smoke test for the prototype
if (require.main === module) {
  const builder = new NarrativeBuilder()
    .phase('dreaming', ({ flags }) => !!flags["asleep"]) // superposition-like conditional phase
    .phase('awake', ({ flags }) => !flags["asleep"])      // mutually exclusive for demo
    .entangle('mood', 'narrationTone', v => (v === 'calm' ? 'soft' : 'tense'))
    .measure(() => {});

  const result = builder.run({ flags: { asleep: true, mood: 'calm' } });
  console.log('Active phases:', result.activePhases);
  console.log('Flags:', result.ctx.flags);
}

export { NarrativeBuilder, Entangler, Phase };
