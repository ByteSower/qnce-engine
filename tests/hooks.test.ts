import { createQNCEEngine, type StoryData } from '../src/engine/core';

describe('Engine hooks', () => {
  const story: StoryData = {
    initialNodeId: 'start',
    nodes: [
      { id: 'start', text: 'start', choices: [ { text: 'Go', nextNodeId: 'end', flagEffects: { progressed: true } } ] },
      { id: 'end', text: 'end', choices: [] }
    ]
  };

  test('pre-choice hook can cancel transition', () => {
    const engine = createQNCEEngine(story);
    let called = 0;
    engine.registerHook('pre-choice', () => { called++; return false; }, 5);
    const choice = engine.getAvailableChoices()[0];
    engine.selectChoice(choice);
    expect(engine.getCurrentNode().id).toBe('start');
    expect(called).toBe(1);
  });

  test('priority ordering executes higher priority first', () => {
    const order: string[] = [];
    const engine = createQNCEEngine(story);
    engine.registerHook('pre-choice', () => { order.push('low'); }, 0);
    engine.registerHook('pre-choice', () => { order.push('high'); }, 10);
    const choice = engine.getAvailableChoices()[0];
    engine.selectChoice(choice);
    expect(order).toEqual(['high','low']);
  });

  test('unregister hook stops further calls', () => {
    const engine = createQNCEEngine(story);
    let count = 0;
    const off = engine.registerHook('post-choice', () => { count++; }, 0);
    const choice = engine.getAvailableChoices()[0];
    engine.selectChoice(choice);
    off();
    engine.resetNarrative();
    engine.selectChoice(engine.getAvailableChoices()[0]);
    expect(count).toBe(1);
  });
});
