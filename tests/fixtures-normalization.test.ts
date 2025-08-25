import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadStoryData } from '../src/engine/core';
import { TwisonAdapter } from '../src/adapters/story/TwisonAdapter';
import { InkAdapter } from '../src/adapters/story/InkAdapter';

function readJSON(p: string) { return JSON.parse(readFileSync(resolve(__dirname, '..', p), 'utf-8')); }

describe('Golden fixtures - normalization', () => {
  test('Twison basic -> StoryData matches expected', async () => {
    const src = readJSON('fixtures/twison-basic.json');
    const expected = readJSON('fixtures/twison-basic.expected.qnce.json');
    const adapter = new TwisonAdapter();
    const normalized = await adapter.load(src);
    const story = loadStoryData(normalized);
    expect(story).toEqual(expected);
  });

  test('Ink basic -> StoryData matches expected', async () => {
    const src = readJSON('fixtures/ink-basic.json');
    const expected = readJSON('fixtures/ink-basic.expected.qnce.json');
    const adapter = new InkAdapter();
    const normalized = await adapter.load(src);
    const story = loadStoryData(normalized);
    expect(story).toEqual(expected);
  });
});
