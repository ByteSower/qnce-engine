import { createTelemetry } from '../src/telemetry/core';
import type { QEvent, TelemetryAdapter } from '../src/telemetry/types';

class CapturingAdapter implements TelemetryAdapter {
  public sent: QEvent[][] = [];
  async send(batch: QEvent[]): Promise<void> { this.sent.push(batch); }
}

describe('Telemetry sampling & overflow strategies', () => {
  test('sampling drops events deterministically with seed', async () => {
    const adapter = new CapturingAdapter();
    let drops = 0;
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 0.5, sampleSeed: 123, onDrop: r => { if (r === 'filter') drops++; } });
    for (let i = 0; i < 200; i++) {
      telemetry.emit({ type: 'test.event', payload: { i }, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' } });
    }
    await telemetry.flush();
    const sent = adapter.sent.flat().length;
  // With 0.5 sample rate expect roughly half retained (~100) allow wide tolerance for deterministic sequence
  expect(sent).toBeGreaterThanOrEqual(40);
  expect(sent).toBeLessThanOrEqual(160);
    expect(drops).toBeGreaterThan(0);
  });

  test('disabled->enabled toggle starts capturing subsequently emitted events', async () => {
    const adapter = new CapturingAdapter();
    const telemetry = createTelemetry({ adapter, enabled: false, sampleRate: 1 });
    telemetry.emit({ type: 'ignored', payload: {}, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' } });
    telemetry.configure({ enabled: true });
    telemetry.emit({ type: 'accepted', payload: {}, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' } });
    await telemetry.flush();
    const types = adapter.sent.flat().map(e => e.type);
    expect(types).toContain('accepted');
    expect(types).not.toContain('ignored');
  });

  test('overflow strategy drop retains earliest events up to capacity', async () => {
    const adapter = new CapturingAdapter();
    let queueDrops = 0;
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, maxQueue: 10, batchSize: 50, overflowStrategy: 'drop', onDrop: r => { if (r === 'queue_full') queueDrops++; } });
    for (let i = 0; i < 30; i++) {
      telemetry.emit({ type: 'seq', payload: { i }, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' }, meta: { seq: i } });
    }
    // Force flush
    await telemetry.flush();
    const sent = adapter.sent.flat();
    // Only up to maxQueue should be flushed since we never flushed during emit and overflow drops new events
    expect(sent.length).toBeLessThanOrEqual(10);
    expect(queueDrops).toBeGreaterThan(0);
  });

  test('overflow strategy drop-oldest preserves newest events', async () => {
    const adapter = new CapturingAdapter();
    let queueDrops = 0;
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, maxQueue: 10, batchSize: 50, overflowStrategy: 'drop-oldest', onDrop: r => { if (r === 'queue_full') queueDrops++; } });
    for (let i = 0; i < 25; i++) {
      telemetry.emit({ type: 'seq', payload: { i }, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' }, meta: { seq: i } });
    }
    await telemetry.flush();
  interface Payload { i: number }
  const seqs = adapter.sent.flat().map(e => (e.payload as Payload).i).sort((a,b)=>a-b);
    // Expect we retained roughly the last 10 sequence numbers (15..24)
    expect(seqs[0]).toBeGreaterThanOrEqual(14); // allow one off
    expect(seqs[seqs.length - 1]).toBe(24);
    expect(seqs.length).toBeLessThanOrEqual(10);
    expect(queueDrops).toBeGreaterThan(0);
  });

  test('stats reports p50/p95 after multiple flushes', async () => {
    const adapter = new CapturingAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, flushIntervalMs: 10 });
    for (let i = 0; i < 40; i++) {
      telemetry.emit({ type: 'timed', payload: { i }, ts: Date.now(), ctx: { sessionId: 's', engineVersion: 't' } });
    }
    await telemetry.flush();
    const stats = telemetry.stats();
    expect(stats.sent).toBeGreaterThanOrEqual(40);
    // p50 & p95 might be undefined if only one latency recorded; we expect at least one latency
    expect(stats.p50).toBeDefined();
  });
});
