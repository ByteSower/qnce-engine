/** Lightweight logger with level filtering and pluggable sink (no external deps). */
export type LogLevelName = 'silent' | 'error' | 'warn' | 'info' | 'success' | 'debug';

const LEVEL_ORDER: Record<LogLevelName, number> = {
  silent: 100, // suppress all
  error: 50,
  warn: 40,
  info: 30,
  success: 30, // treat success same visibility as info
  debug: 10
};

export interface LogEntry {
  level: LogLevelName;
  message: string;
  ts: number;
}

export interface LoggerSink {
  write(entry: LogEntry): void;
}

class ConsoleSink implements LoggerSink {
  constructor(private useColor: boolean) {}
  write(entry: LogEntry): void {
    const { level, message } = entry;
    const color = this.colorFor(level);
    const prefix = this.prefixFor(level);
    // Use process.stdout / stderr directly to avoid triggering no-console
    const out = (level === 'error' ? process.stderr : process.stdout);
    out.write(`${color}${prefix}${message}${this.useColor ? '\u001b[0m' : ''}\n`);
  }
  private colorFor(level: LogLevelName): string {
    if (!this.useColor) return '';
    switch (level) {
      case 'error': return '\u001b[31m'; // red
      case 'warn': return '\u001b[33m'; // yellow
      case 'success': return '\u001b[32m'; // green
      case 'debug': return '\u001b[90m'; // gray
      default: return '\u001b[36m'; // cyan/info
    }
  }
  private prefixFor(level: LogLevelName): string {
    switch (level) {
      case 'error': return '❌ ';
      case 'warn': return '⚠️  ';
      case 'success': return '✅ ';
      case 'debug': return '🔍 ';
      default: return '';
    }
  }
}

export interface CreateLoggerOptions {
  level?: LogLevelName;
  sink?: LoggerSink;
  useColor?: boolean;
}

export interface Logger {
  level: LogLevelName;
  setLevel(lvl: LogLevelName): void;
  error(msg: string): void;
  warn(msg: string): void;
  info(msg: string): void;
  success(msg: string): void;
  debug(msg: string): void;
  child(pfx: string): Logger; // simple namespacing
}

/** Serialize arbitrary values safely for log messages (avoids generic [object Object]). */
export function formatLog(value: unknown, depth = 0, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;
  const t = typeof value;
  if (value == null || t === 'number' || t === 'boolean') return String(value);
  if (t === 'function') return `[Function ${(value as Function).name || 'anonymous'}]`;
  if (t === 'symbol') return (value as symbol).toString();
  if (Array.isArray(value)) {
    if (depth > 2) return `[Array(${value.length})]`;
    return '[' + value.map(v => formatLog(v, depth + 1, seen)).join(', ') + ']';
  }
  if (t === 'object') {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);
    if (depth > 2) return '{…}';
    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, 25)
      .map(([k, v]) => `${k}: ${formatLog(v, depth + 1, seen)}`);
    const truncated = Object.keys(value as object).length > 25 ? ' …' : '';
    return '{ ' + entries.join(', ') + truncated + ' }';
  }
  try { return JSON.stringify(value); } catch { return String(value); }
}

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const sink = opts.sink || new ConsoleSink(opts.useColor ?? process.stdout.isTTY);
  let level: LogLevelName = opts.level || 'info';
  const basePrefix = '';
  function emit(l: LogLevelName, msg: string) {
    // lower numeric = more verbose; allow if candidate order >= current level order
  if (LEVEL_ORDER[l] < LEVEL_ORDER[level]) return; // require candidate >= threshold
  sink.write({ level: l, message: basePrefix + formatLog(msg), ts: Date.now() });
  }
  const logger: Logger = {
    get level() { return level; },
    setLevel(lvl: LogLevelName) { level = lvl; },
    error(msg: string) { emit('error', msg); },
    warn(msg: string) { emit('warn', msg); },
    info(msg: string) { emit('info', msg); },
    success(msg: string) { emit('success', msg); },
    debug(msg: string) { emit('debug', msg); },
  child() { return createLogger({ level, sink, useColor: (opts.useColor ?? process.stdout.isTTY) }); }
  };
  return logger;
}

/** Helper to derive level from flags */
export function deriveLogLevel(flags: { quiet?: boolean; verbose?: boolean }): LogLevelName {
  if (flags.quiet) return 'warn';
  if (flags.verbose) return 'debug';
  return 'info';
}
