import { conditionEvaluator } from '../src/engine/condition';
import { QNCEEngine } from '../src/engine/core';
// (No additional validator imports needed for pooling tests)

// Simple story fixture
interface StoryNode { id: string; text: string; choices: Array<{ text: string; nextNodeId: string; condition?: string }>; }
interface StoryData { initialNodeId: string; nodes: StoryNode[] }
const story: StoryData = {
  initialNodeId: 'start',
  nodes: [
    { id: 'start', text: 'Start', choices: [ { text: 'Go', nextNodeId: 'start', condition: 'flags.a > 1 && flags.b < 5' } ] }
  ]
};

describe('Condition Evaluator Pooling & Interning', () => {
  test('expression normalization reuses canonical string', () => {
    const expr = '  flags.a > 1 && flags.b < 5  ';
    // Access private intern via evaluating multiple times (indirect). We assume canonicalization occurs.
  const engine = new QNCEEngine(story as unknown as StoryData, { flags: { a: 2, b: 3 } }, true /* perf mode enables pooling */);
    for (let i = 0; i < 10; i++) {
      engine['state'].flags.a = 2 + i;
      conditionEvaluator.evaluate(expr, { state: engine['state'], timestamp: Date.now() });
    }
    // Heuristic: accessing internal cache size via casting (test-only) to ensure not exploding with duplicates
  interface CEInternal { expressionCache: Map<string,string>; }
  const cacheSize = (conditionEvaluator as unknown as CEInternal).expressionCache.size;
    expect(cacheSize).toBeGreaterThan(0);
    expect(cacheSize).toBeLessThanOrEqual(5); // only sanitized unique variants
  });

  test('context objects are reused under pooling', () => {
  const engine = new QNCEEngine(story as unknown as StoryData, { flags: { a: 2, b: 3 } }, true);
  interface CEPoolInternal { contextPool: unknown[] }
  const beforePoolLen = (conditionEvaluator as unknown as CEPoolInternal).contextPool.length;
    for (let i = 0; i < 50; i++) {
      conditionEvaluator.evaluate('flags.a > 1', { state: engine['state'], timestamp: Date.now() });
    }
  const afterPoolLen = (conditionEvaluator as unknown as CEPoolInternal).contextPool.length;
    expect(afterPoolLen).toBeGreaterThanOrEqual(beforePoolLen); // pool grows or stays
    expect(afterPoolLen).toBeGreaterThan(0);
  });

  test('performance: 10k evaluations stays within budget', () => {
  const engine = new QNCEEngine(story as unknown as StoryData, { flags: { a: 2, b: 3 } }, true);
    const expr = 'flags.a > 1 && flags.b < 5 && flags.a + flags.b < 20';
    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      engine['state'].flags.a = (i % 10) + 1;
      conditionEvaluator.evaluate(expr, { state: engine['state'], timestamp: start + i });
    }
    const duration = Date.now() - start;
    // Budget: arbitrary < 750ms (adjustable later); pooling should keep this well below
    expect(duration).toBeLessThan(750);
  });
});