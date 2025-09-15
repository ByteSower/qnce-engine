import { createQNCEEngine, type StoryData } from '../src/engine/core';

const story: StoryData = {
  initialNodeId: 'n0',
  nodes: [
    { id: 'n0', text: 'start', choices: [ { text: 'Go', nextNodeId: 'n1' } ] },
    { id: 'n1', text: 'end', choices: [] }
  ]
};

describe('Debug mode & hot profiler', () => {
  test('debug logs capture choice + flag events', () => {
    const engine = createQNCEEngine(story);
    engine.enableDebug();
    engine.setFlag('x', 1);
    const choice = engine.getAvailableChoices()[0];
    engine.selectChoice(choice);
    const logs = engine.getDebugLogs();
    const events = logs.map(l => l.event);
    expect(events).toContain('flag.set');
    expect(events).toContain('choice.select.start');
    expect(events).toContain('choice.select.end');
  });

  test('hot profiler aggregates condition evaluations', () => {
    const engine = createQNCEEngine({ initialNodeId: 'a', nodes: [ { id: 'a', text: 'A', choices: [ { text: 'X', nextNodeId: 'b', condition: '1 === 1' } ] }, { id: 'b', text: 'B', choices: [] } ] });
    engine.enableHotProfiling();
    engine.getAvailableChoices();
    engine.getAvailableChoices();
    const summary = engine.getHotProfileSummary();
    expect(summary['condition.evaluate'].count).toBeGreaterThanOrEqual(2);
  });
});
