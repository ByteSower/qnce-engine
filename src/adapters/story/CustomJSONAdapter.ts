// Custom JSON Story Adapter
// Accepts already-normalized QNCE StoryData or a close variant and ensures it conforms

import type { StoryAdapter, AdapterOptions } from '../../adapters/contracts';
import type { StoryData } from '../../engine/core';
import type { ValidationResult } from '../../engine/validation';

export class CustomJSONAdapter implements StoryAdapter {
  async load(source: string | object, options?: AdapterOptions): Promise<StoryData> {
    const data = typeof source === 'string' ? JSON.parse(source) : source;

    if (!data || typeof data !== 'object') throw new Error('Invalid story source');
    const initialNodeId = (data as any).initialNodeId || 'start';
    const nodes = (data as any).nodes || [];

    if (!Array.isArray(nodes)) throw new Error('Invalid nodes array');

    const normalized: StoryData = {
      initialNodeId,
      nodes: nodes.map((n: any) => ({
        id: String(n.id),
        text: String(n.text ?? ''),
        meta: n.meta && typeof n.meta === 'object'
          ? ({
              tags: Array.isArray(n.meta.tags) ? n.meta.tags.map((t: any) => String(t)) : undefined
            } as any)
          : undefined,
        choices: Array.isArray(n.choices)
          ? n.choices.map((c: any) => ({
              text: String(c.text ?? ''),
              nextNodeId: String(c.nextNodeId ?? ''),
              flagEffects: c.flagEffects,
              flagRequirements: c.flagRequirements,
              timeRequirements: c.timeRequirements,
              inventoryRequirements: c.inventoryRequirements,
              enabled: c.enabled,
              condition: c.condition,
            }))
          : [],
      })),
    } as StoryData;

    if (options?.strict) {
      // Fail on unknown keys at top-level nodes/choices
  const allowedNodeKeys = new Set(['id', 'text', 'choices', 'meta']);
      const allowedChoiceKeys = new Set([
        'text','nextNodeId','flagEffects','flagRequirements','timeRequirements','inventoryRequirements','enabled','condition'
      ]);
      for (const n of nodes) {
        for (const k of Object.keys(n)) if (!allowedNodeKeys.has(k)) throw new Error(`Unknown node key: ${k}`);
        for (const c of (n.choices || [])) {
          for (const ck of Object.keys(c)) if (!allowedChoiceKeys.has(ck)) throw new Error(`Unknown choice key: ${ck}`);
        }
      }
    } else {
      // Lenient mode: warn on unknown keys
  const allowedNodeKeys = new Set(['id', 'text', 'choices', 'meta']);
      const allowedChoiceKeys = new Set([
        'text','nextNodeId','flagEffects','flagRequirements','timeRequirements','inventoryRequirements','enabled','condition'
      ]);
      for (const n of nodes) {
        for (const k of Object.keys(n)) if (!allowedNodeKeys.has(k)) console.warn(`[QNCE] Unknown node key ignored: ${k}`);
        for (const c of (n.choices || [])) {
          for (const ck of Object.keys(c)) if (!allowedChoiceKeys.has(ck)) console.warn(`[QNCE] Unknown choice key ignored: ${ck}`);
        }
      }
    }

    return normalized;
  }

  validate(_storyData: StoryData): ValidationResult {
    return { isValid: true };
  }

  detect(source: unknown): boolean {
    if (typeof source === 'string') {
      try {
        const obj = JSON.parse(source);
        return !!obj && typeof obj === 'object' && Array.isArray((obj as any).nodes);
      } catch {
        return false;
      }
    }
    const obj = source as any;
    return !!obj && typeof obj === 'object' && Array.isArray(obj.nodes);
  }
}

export default CustomJSONAdapter;
