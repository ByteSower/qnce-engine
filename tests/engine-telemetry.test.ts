import { createQNCEEngine, type StoryData } from '../src/engine/core';
import { createTelemetry } from '../src/telemetry/core';
import type { TelemetryAdapter } from '../src/telemetry/types';

function makeStory(): StoryData {
  return {
    initialNodeId: 'start',
    nodes: [
      { id: 'start', text: 'Start', choices: [
        { text: 'Go', nextNodeId: 'end', condition: '1 + 1 === 2' },
        { text: 'Hidden', nextNodeId: 'end', condition: 'invalid syntax here' }
      ] },
      { id: 'end', text: 'End', choices: [] }
    ]
  };
}

class MemoryAdapter implements TelemetryAdapter {
  public batches: any[][] = [];
  async send(batch: any[]): Promise<void> { this.batches.push(batch); }
}

describe('Engine telemetry hooks', () => {
  test('emits session.start, node.enter, expression.evaluate, choice.select', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    // Drain initial session.start and node.enter on first getCurrentNode
    engine.getCurrentNode();
    await telemetry.flush();
    const all1 = adapter.batches.flat();
    const types1 = all1.map(e => e.type);
    expect(types1).toEqual(expect.arrayContaining(['session.start', 'node.enter']));

    // Trigger expression.evaluate (valid) and choice.select
    const choices = engine.getAvailableChoices();
    expect(choices.length).toBeGreaterThan(0);
    engine.selectChoice(choices[0]);
    await telemetry.flush();
    const all2 = adapter.batches.flat();
    const types2 = all2.map(e => e.type);
    expect(types2).toEqual(expect.arrayContaining(['expression.evaluate', 'choice.select']));
  });

  test('emits storage.op events for save/load/list/delete/clear', async () => {
    const adapter = new MemoryAdapter();
    const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 1, defaultCtx: { sessionId: 't', engineVersion: 'test', env: 'test' } });
    const engine = createQNCEEngine(makeStory(), undefined, false, undefined, { telemetry, env: 'test' });

    // Use in-memory storage adapter via existing factory used in CLI tests
    const { createStorageAdapter } = await import('../src/persistence/StorageAdapters');
    const mem = createStorageAdapter('memory' as any, {});
    (engine as any).attachStorageAdapter(mem);

    await (engine as any).saveToStorage('k1');
    await (engine as any).loadFromStorage('k1');
    await (engine as any).listStorageKeys();
    await (engine as any).deleteFromStorage('k1');
    await (engine as any).clearStorage();
    await telemetry.flush();

    const types = adapter.batches.flat().map(e => e.type);
    expect(types.filter(t => t === 'storage.op').length).toBeGreaterThanOrEqual(5);
  });
});
