// Lightweight string interning utility to reduce duplicate string allocations
// Intended for short, frequently repeated keys/values on hot paths

const MAX_ENTRIES = 1024; // soft cap to avoid unbounded growth

const pool = new Map<string, string>();

/**
 * Intern a short string. Returns a canonical instance from a small pool.
 * Non-string or long strings are returned as-is.
 * @internal
 */
export function internString<T = unknown>(value: T): T {
  if (typeof value !== 'string') return value;
  if (value.length > 64) return value as unknown as T;

  const existing = pool.get(value);
  if (existing) return existing as unknown as T;

  // Evict oldest when exceeding cap (Map preserves insertion order)
  if (pool.size >= MAX_ENTRIES) {
    const firstKey = pool.keys().next().value;
    if (firstKey !== undefined) pool.delete(firstKey);
  }
  pool.set(value, value);
  return value as unknown as T;
}

/** Intern all string keys and string values in an object (shallow).
 * @internal
 */
export function internShallowRecord(obj: Record<string, unknown> | undefined | null): Record<string, unknown> | undefined {
  if (!obj) return obj as unknown as undefined;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    const ik = internString(k);
    const v = (obj as Record<string, unknown>)[k];
    out[ik as string] = typeof v === 'string' ? internString(v) : v;
  }
  return out;
}
