import { createTelemetry } from '../src/telemetry/core';
import type { QEvent, TelemetryAdapter } from '../src/telemetry/types';

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
      onDrop: (r: any) => drops.push(String(r))
    } as any);

    for (let i = 0; i < 10; i++) telemetry.emit(makeEvent(i));
    const s = telemetry.stats();
    expect(s.queued).toBe(5);
    expect(s.dropped).toBe(5);
    expect(drops.filter(d => d === 'queue_full').length).toBeGreaterThan(0);
  });

  test('computes p50/p95 send latency', async () => {
    const delays = [2, 4, 6, 8, 10];
    let sendCalls = 0;
    const adapter: TelemetryAdapter = { async send() { const d = delays[Math.min(sendCalls, delays.length - 1)]; sendCalls++; await new Promise(r => setTimeout(r, d)); } };
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, batchSize: 1 } as any);
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
});
