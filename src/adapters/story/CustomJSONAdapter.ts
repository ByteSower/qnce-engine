// Custom JSON Story Adapter
// Accepts already-normalized QNCE StoryData or a close variant and ensures it conforms

import type { StoryAdapter, AdapterOptions } from '../../adapters/contracts';
import type { StoryData } from '../../engine/core';
import type { ValidationResult } from '../../engine/validation';

export class CustomJSONAdapter implements StoryAdapter {
  async load(source: string | object, options?: AdapterOptions): Promise<StoryData> {
    const data = typeof source === 'string' ? JSON.parse(source) : source;

    if (!data || typeof data !== 'object') throw new Error('Invalid story source');
    type InputChoice = {
      text?: unknown;
      nextNodeId?: unknown;
      flagEffects?: unknown;
      flagRequirements?: unknown;
      timeRequirements?: unknown;
      inventoryRequirements?: unknown;
      enabled?: unknown;
      condition?: unknown;
      [k: string]: unknown;
    };
    type InputNode = {
      id?: unknown;
      text?: unknown;
      meta?: { tags?: unknown } | unknown;
      choices?: InputChoice[] | unknown;
      [k: string]: unknown;
    };

    const initialNodeId = (data as { initialNodeId?: unknown }).initialNodeId || 'start';
    const nodes = (data as { nodes?: unknown }).nodes ?? [];

    if (!Array.isArray(nodes)) throw new Error('Invalid nodes array');

    const normalized: StoryData = {
      initialNodeId,
      nodes: (nodes as InputNode[]).map((n) => ({
        id: String((n as InputNode).id),
        text: String((n as InputNode).text ?? ''),
        meta:
          n && typeof n === 'object' && (n as InputNode).meta && typeof (n as InputNode).meta === 'object'
            ? (() => {
                const meta = (n as InputNode).meta as { tags?: unknown };
                const tags = meta.tags;
                return {
                  tags: Array.isArray(tags) ? (tags as unknown[]).map((t) => String(t)) : undefined,
                };
              })()
            : undefined,
        choices: Array.isArray((n as InputNode).choices)
          ? ((n as InputNode).choices as InputChoice[]).map((c) => ({
              text: String(c.text ?? ''),
              nextNodeId: String(c.nextNodeId ?? ''),
              flagEffects: c.flagEffects as unknown,
              flagRequirements: c.flagRequirements as unknown,
              timeRequirements: c.timeRequirements as unknown,
              inventoryRequirements: c.inventoryRequirements as unknown,
              enabled: c.enabled as unknown,
              condition: c.condition as unknown,
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
      // Lenient mode: ignore unknown keys silently
      const allowedNodeKeys = new Set(['id', 'text', 'choices', 'meta']);
      const allowedChoiceKeys = new Set([
        'text','nextNodeId','flagEffects','flagRequirements','timeRequirements','inventoryRequirements','enabled','condition'
      ]);
      for (const n of nodes as InputNode[]) {
        for (const k of Object.keys(n)) {
          // ignore unknown keys
          void (allowedNodeKeys.has(k));
        }
        for (const c of ((n as InputNode).choices as InputChoice[] | undefined) || []) {
          for (const ck of Object.keys(c)) {
            // ignore unknown keys
            void (allowedChoiceKeys.has(ck));
          }
        }
      }
    }

    return normalized;
  }

  validate(): ValidationResult {
    return { isValid: true };
  }

  detect(source: unknown): boolean {
  if (typeof source === 'string') {
      try {
        const obj = JSON.parse(source);
    return !!obj && typeof obj === 'object' && Array.isArray((obj as { nodes?: unknown }).nodes);
      } catch {
        return false;
      }
    }
  const obj = source as { nodes?: unknown } | null;
  return !!obj && typeof obj === 'object' && Array.isArray(obj.nodes);
  }
}

export default CustomJSONAdapter;
