import { createTelemetry, createTelemetryAdapter, ConsoleAdapter, FileAdapter } from '../src/telemetry/core';
import type { QEvent, TelemetryAdapter } from '../src/telemetry/types';

class MemoryAdapter implements TelemetryAdapter {
  public sent: QEvent[] = [];
  async send(batch: QEvent[]): Promise<void> { this.sent.push(...batch); }
}

const ctx = { sessionId: 's', engineVersion: 'test' } as const;

function makeEvent(i = 0): QEvent<'test', { i: number }> {
  return {
    type: 'test',
    payload: { i },
    ts: Date.now(),
    ctx: { sessionId: 's', engineVersion: 'test' }
  };
}

describe('Telemetry core', () => {
  test('drops when queue is full and calls onDrop', async () => {
    const drops: string[] = [];
    const adapter: TelemetryAdapter = { async send() { /* no-op */ } };
    const telemetry = createTelemetry({
      adapter,
      enabled: true,
      sampleRate: 1,
      maxQueue: 5,
      batchSize: 1000,
      onDrop: (r: 'queue_full' | 'filter') => drops.push(r)
    });

    for (let i = 0; i < 10; i++) telemetry.emit(makeEvent(i));
    const s = telemetry.stats();
    expect(s.queued).toBe(5);
    expect(s.dropped).toBe(5);
    expect(drops.filter(d => d === 'queue_full').length).toBeGreaterThan(0);
  });

  test('overflowStrategy=drop-oldest evicts oldest and accepts new', async () => {
    const adapter = new MemoryAdapter();
    let drops = 0;
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, maxQueue: 3, batchSize: 10, onDrop: () => { drops++; }, overflowStrategy: 'drop-oldest' });
    telemetry.emit({ type: 'e', payload: { i: 1 }, ts: Date.now(), ctx });
    telemetry.emit({ type: 'e', payload: { i: 2 }, ts: Date.now(), ctx });
    telemetry.emit({ type: 'e', payload: { i: 3 }, ts: Date.now(), ctx });
    telemetry.emit({ type: 'e', payload: { i: 4 }, ts: Date.now(), ctx }); // triggers eviction
    await telemetry.flush();
  const sentPayloads = adapter.sent.map(e => (e.payload as { i?: number }).i);
    expect(drops).toBe(1); // one eviction
    expect(sentPayloads.includes(1)).toBe(false); // oldest dropped
    expect(sentPayloads.includes(4)).toBe(true);  // newest kept
  });

  test('overflowStrategy=error simply drops new events (no eviction of existing)', async () => {
    const adapter = new MemoryAdapter();
    let drops = 0;
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, maxQueue: 2, batchSize: 10, onDrop: () => { drops++; }, overflowStrategy: 'error' });
    telemetry.emit({ type: 'e', payload: { i: 1 }, ts: Date.now(), ctx });
    telemetry.emit({ type: 'e', payload: { i: 2 }, ts: Date.now(), ctx });
    telemetry.emit({ type: 'e', payload: { i: 3 }, ts: Date.now(), ctx }); // dropped
    await telemetry.flush();
  const sentPayloads = adapter.sent.map(e => (e.payload as { i?: number }).i).sort();
    expect(drops).toBe(1);
    expect(sentPayloads).toEqual([1,2]);
  });

  test('computes p50/p95 send latency', async () => {
    const delays = [2, 4, 6, 8, 10];
    let sendCalls = 0;
    const adapter: TelemetryAdapter = { async send() { const d = delays[Math.min(sendCalls, delays.length - 1)]; sendCalls++; await new Promise(r => setTimeout(r, d)); } };
  const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, batchSize: 1 });
    // enqueue 5 events so we trigger 5 sends
    for (let i = 0; i < 5; i++) telemetry.emit(makeEvent(i));
    // flush until queue empty
    for (let i = 0; i < 5; i++) await telemetry.flush();
    const s = telemetry.stats();
    expect(typeof s.p50).toBe('number');
    expect(typeof s.p95).toBe('number');
    expect((s.p50 as number) >= 0).toBe(true);
    expect((s.p95 as number) >= (s.p50 as number)).toBe(true);
  });

  test('does not filter when sampleRate = 0 (no sampling)', async () => {
    const drops: string[] = [];
    const adapter: TelemetryAdapter = { async send() { /* no-op */ } };
    const telemetry = createTelemetry({
      adapter,
      enabled: true,
      sampleRate: 0,
      maxQueue: 10,
      batchSize: 10,
      onDrop: (r: 'queue_full' | 'filter') => drops.push(r)
    });

    for (let i = 0; i < 7; i++) telemetry.emit(makeEvent(i));
    const s = telemetry.stats();
    expect(s.queued).toBe(7);
    expect(s.dropped).toBe(0);
    expect(drops.length).toBe(0);
  });

  test('merges defaultCtx and assigns sequential meta.seq', async () => {
    let captured: QEvent[] | undefined;
    const adapter: TelemetryAdapter = {
      async send(batch) { captured = batch; }
    };
  const telemetry = createTelemetry({
      adapter,
      enabled: true,
      sampleRate: 1,
      batchSize: 10,
      defaultCtx: { appVersion: '1.0.0', env: 'dev' }
  });

    telemetry.emit(makeEvent(1));
    telemetry.emit(makeEvent(2));
    await telemetry.flush();

    expect(captured && captured.length).toBe(2);
    expect(captured![0].meta?.seq).toBe(0);
    expect(captured![1].meta?.seq).toBe(1);
    expect(captured![0].ctx.appVersion).toBe('1.0.0');
    expect(captured![0].ctx.env).toBe('dev');
    expect(captured![0].ctx.sessionId).toBe('s');
    expect(captured![0].ctx.engineVersion).toBe('test');
  });

  test('dispose flushes remaining events and calls adapter.dispose', async () => {
    let sends = 0;
    let disposed = false;
    const adapter: TelemetryAdapter = {
      async send(batch) { sends += batch.length; },
      async dispose() { disposed = true; }
    };
  const telemetry = createTelemetry({
      adapter,
      enabled: true,
      sampleRate: 1,
      flushIntervalMs: 10_000, // avoid auto-flush during test
      batchSize: 100
  });

    for (let i = 0; i < 3; i++) telemetry.emit(makeEvent(i));
    // No manual flush
    await telemetry.dispose();
    expect(sends).toBe(3);
    expect(disposed).toBe(true);
    expect(telemetry.stats().queued).toBe(0);
  });

  test('createTelemetryAdapter returns expected built-ins', () => {
    const c = createTelemetryAdapter('console');
    const f = createTelemetryAdapter('file', { path: 'tmp.ndjson' });
    expect(c).toBeInstanceOf(ConsoleAdapter);
    expect(f).toBeInstanceOf(FileAdapter);
  });
});
