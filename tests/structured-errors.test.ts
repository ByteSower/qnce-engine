import { createStructuredError, ErrorFactory, serializeStructuredError, toStructuredError } from '../src/engine/error-factory';

describe('Structured error factory', () => {
  test('creates structured navigation error', () => {
    const s = createStructuredError('navigation', 'Failed to move', { nodeId: 'n1', storyId: 'story' });
    expect(s.code).toBe('NAVIGATION_ERROR');
    expect(s.kind).toBe('navigation');
    expect(s.context.nodeId).toBe('n1');
    const plain = serializeStructuredError(s);
    expect(plain.code).toBe('NAVIGATION_ERROR');
    expect(plain.context.nodeId).toBe('n1');
  });

  test('convenience helper hook', () => {
    const h = ErrorFactory.hook('Hook failed', { hookStage: 'pre-choice', nodeId: 'x' });
    expect(h.kind).toBe('hook');
    expect(h.code).toBe('HOOK_ERROR');
  });

  test('toStructuredError wraps native Error', () => {
    const native = new Error('Boom');
    const s = toStructuredError(native);
    expect(s.code).toBe('UNKNOWN_ERROR');
    expect(s.message).toBe('Boom');
  });
});
