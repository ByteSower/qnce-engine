import { createQNCEEngine, StoryData } from '../src/engine/core';

function buildStory(nodes = 10): StoryData {
  const arr: StoryData['nodes'] = [];
  for (let i = 0; i < nodes; i++) {
    arr.push({
      id: `n${i}`,
      text: `Node ${i}`,
      choices: [
        { text: 'A', nextNodeId: `n${(i + 1) % nodes}` },
        { text: 'B', nextNodeId: `n${(i + 2) % nodes}` }
      ]
    });
  }
  return { initialNodeId: 'n0', nodes: arr };
}

describe('Concurrent narrative evaluations', () => {
  test('engine instances progress independently', async () => {
    const story = buildStory();
    const engines = Array.from({ length: 6 }, () => createQNCEEngine(story));
    const steps = 60;
    await Promise.all(engines.map(async (engine, idx) => {
      for (let s = 0; s < steps; s++) {
        const choices = engine.getAvailableChoices();
        const choiceIndex = (s + idx + Math.random() * 2) % choices.length | 0;
        engine.selectChoice(choices[choiceIndex]);
        if (s % 12 === 0) await Promise.resolve(); // yield
      }
    }));
    const histories = engines.map(e => e.getState().history);
    histories.forEach(h => expect(h[0]).toBe('n0'));
    for (let i = 0; i < histories.length; i++) {
      for (let j = i + 1; j < histories.length; j++) {
        expect(histories[i]).not.toBe(histories[j]);
      }
    }
  });
});
