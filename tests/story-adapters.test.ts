import { CustomJSONAdapter } from '../src/adapters/story/CustomJSONAdapter';
import { TwisonAdapter } from '../src/adapters/story/TwisonAdapter';
import { InkAdapter } from '../src/adapters/story/InkAdapter';
import { loadStoryData } from '../src/engine/core';

describe('Story Adapters - minimal smoke', () => {
  test('CustomJSONAdapter loads normalized StoryData', async () => {
    const adapter = new CustomJSONAdapter();
    const story = await adapter.load({ initialNodeId: 'start', nodes: [{ id: 'start', text: 'hi', choices: [] }] });
    const normalized = loadStoryData(story);
    expect(normalized.initialNodeId).toBe('start');
    expect(normalized.nodes.length).toBe(1);
  });

  test('TwisonAdapter basic transform', async () => {
    const adapter = new TwisonAdapter();
    const twison = { passages: [ { pid:1, name:'Start', text:'hello', links:[{ name:'Go', link:'End' }] }, { pid:2, name:'End', text:'bye' } ], startnode:1 };
    const story = await adapter.load(twison, { idPrefix: 'tw-' });
    const normalized = loadStoryData(story);
    expect(normalized.initialNodeId).toBe('tw-Start');
    expect(normalized.nodes.find(n=>n.id==='tw-Start')?.choices[0].nextNodeId).toBe('tw-End');
  });

  test('InkAdapter minimal transform', async () => {
    const adapter = new InkAdapter();
    const ink = { start: 'knot1', knots: { knot1: { text: 'a', choices: [{ text:'to2', target:'knot2' }] }, knot2: { text: 'b', choices: [] } } };
    const story = await adapter.load(ink, { idPrefix: 'ink-' });
    const normalized = loadStoryData(story);
    expect(normalized.initialNodeId).toBe('ink-knot1');
    expect(normalized.nodes.find(n=>n.id==='ink-knot1')?.choices[0].nextNodeId).toBe('ink-knot2');
  });
});
