import { CustomJSONAdapter } from '../src/adapters/story/CustomJSONAdapter';
import { TwisonAdapter } from '../src/adapters/story/TwisonAdapter';
import { InkAdapter } from '../src/adapters/story/InkAdapter';

const customSource = { initialNodeId: 'start', nodes: [ { id: 'start', text: 'Hello', choices: [] } ] };
const twisonSource = { passages: [ { name: 'Start', text: 'Hi', links: [] } ], name: 'Demo' };
const inkSource = { knots: { start: { text: 'Ink Hello', choices: [] } }, start: 'start' };

describe('StoryAdapter lifecycle', () => {
  const cases = [
    { name: 'CustomJSONAdapter', Adapter: CustomJSONAdapter, source: customSource },
    { name: 'TwisonAdapter', Adapter: TwisonAdapter, source: twisonSource },
    { name: 'InkAdapter', Adapter: InkAdapter, source: inkSource }
  ];

  for (const { name, Adapter, source } of cases) {
    test(`${name} detects, loads, normalizes, validates`, async () => {
      const adapter = new Adapter();
      expect(adapter.detect(source)).toBe(true);
      const storyData = await adapter.load(source);
      expect(storyData).toBeDefined();
      expect(storyData.initialNodeId).toBeTruthy();
      expect(Array.isArray(storyData.nodes)).toBe(true);
      expect(storyData.nodes.length).toBeGreaterThan(0);
  // Adapter validate currently takes no arguments and returns a ValidationResult
  const result = adapter.validate();
      expect(result.isValid).toBe(true);
    });
  }

  test('detect returns false for unrelated object', () => {
    expect(new CustomJSONAdapter().detect({})).toBe(false);
    expect(new TwisonAdapter().detect({ random: 'value' })).toBe(false);
    expect(new InkAdapter().detect({ not: 'ink' })).toBe(false);
  });
});
