// Ink (Inklecate JSON) Story Adapter - minimal stub
// Many Ink workflows compile to a JSON state machine; here we support a simple node/choice projection

import type { StoryAdapter, AdapterOptions } from '../../adapters/contracts';
import type { StoryData } from '../../engine/core';
import type { ValidationResult } from '../../engine/validation';

// This is intentionally a very light stub; real Ink JSON can be complex.
export class InkAdapter implements StoryAdapter {
  async load(source: string | object, options?: AdapterOptions): Promise<StoryData> {
  const obj: Record<string, unknown> = typeof source === 'string' ? JSON.parse(source) : (source as Record<string, unknown>);
    if (!obj || typeof obj !== 'object') throw new Error('Invalid Ink JSON');

    // Heuristic: accept a simplified format { knots: { [name]: { text, choices: [{ text, target }] } } , start?: string }
  type Knot = { text?: unknown; choices?: Array<{ text?: unknown; target?: unknown }> };
  const knots = ((obj as { knots?: Record<string, Knot> }).knots) || {};
    const idPrefix = options?.idPrefix ?? '';

    // Silently proceed in non-experimental mode; no console noise in library code

    const nodes = Object.keys(knots).map((k) => ({
      id: `${idPrefix}${k}`,
      text: String((knots[k] as Knot | undefined)?.text ?? ''),
      choices: Array.isArray((knots[k] as Knot | undefined)?.choices)
        ? ((knots[k] as Knot).choices as Array<{ text?: unknown; target?: unknown }>).map((c) => ({ text: String(c.text ?? ''), nextNodeId: `${idPrefix}${String(c.target ?? '')}` }))
        : [],
    }));

    const initialNodeId = `${idPrefix}${(((obj as { start?: unknown }).start as string) ?? Object.keys(knots)[0] ?? 'start')}`;
    return { initialNodeId, nodes } as StoryData;
  }

  validate(): ValidationResult { return { isValid: true }; }

  detect(source: unknown): boolean {
  let obj: unknown = source;
    if (typeof source === 'string') { try { obj = JSON.parse(source); } catch { return false; } }
  return !!obj && typeof obj === 'object' && ('knots' in obj || 'inkVersion' in obj);
  }
}

export default InkAdapter;
