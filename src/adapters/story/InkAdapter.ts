// Ink (Inklecate JSON) Story Adapter - minimal stub
// Many Ink workflows compile to a JSON state machine; here we support a simple node/choice projection

import type { StoryAdapter, AdapterOptions } from '../../adapters/contracts';
import type { StoryData } from '../../engine/core';
import type { ValidationResult } from '../../engine/validation';

// This is intentionally a very light stub; real Ink JSON can be complex.
export class InkAdapter implements StoryAdapter {
  async load(source: string | object, options?: AdapterOptions): Promise<StoryData> {
    const obj: any = typeof source === 'string' ? JSON.parse(source) : source;
    if (!obj || typeof obj !== 'object') throw new Error('Invalid Ink JSON');

    // Heuristic: accept a simplified format { knots: { [name]: { text, choices: [{ text, target }] } } , start?: string }
    const knots = obj.knots || {};
    const idPrefix = options?.idPrefix ?? '';

    if (!(options as any)?.experimentalInk && (obj.inkVersion || obj.listDefs || obj.inkState)) {
      console.warn('[QNCE] Ink JSON appears complex; using minimal adapter. Pass experimentalInk to attempt richer import.');
    }

    const nodes = Object.keys(knots).map((k) => ({
      id: `${idPrefix}${k}`,
      text: String(knots[k].text ?? ''),
      choices: Array.isArray(knots[k].choices)
        ? knots[k].choices.map((c: any) => ({ text: String(c.text ?? ''), nextNodeId: `${idPrefix}${c.target}` }))
        : [],
    }));

    const initialNodeId = `${idPrefix}${(obj.start ?? Object.keys(knots)[0] ?? 'start')}`;
    return { initialNodeId, nodes } as StoryData;
  }

  validate(_storyData: StoryData): ValidationResult { return { isValid: true }; }

  detect(source: unknown): boolean {
    let obj: any = source;
    if (typeof source === 'string') { try { obj = JSON.parse(source); } catch { return false; } }
    return !!obj && typeof obj === 'object' && (!!obj.knots || !!obj.inkVersion);
  }
}

export default InkAdapter;
