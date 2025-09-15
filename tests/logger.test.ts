import { createLogger } from '../src/utils/logger';

describe('Logger', () => {
  test('debug suppressed at info level', () => {
  const entries: { message: string }[] = [];
    const logger = createLogger({ level: 'info', sink: { write: (e) => entries.push(e) }, useColor: false });
    logger.debug('hidden');
    logger.info('visible');
    expect(entries.some(e => e.message.includes('hidden'))).toBe(false);
    expect(entries.some(e => e.message.includes('visible'))).toBe(true);
  });

  test('debug shown at debug level', () => {
  const entries: { message: string }[] = [];
    const logger = createLogger({ level: 'debug', sink: { write: (e) => entries.push(e) }, useColor: false });
    logger.debug('dbg');
    expect(entries.some(e => e.message === 'dbg')).toBe(true);
  });
});
