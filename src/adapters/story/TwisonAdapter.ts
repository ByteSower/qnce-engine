// Twison (Twine JSON) Story Adapter
// Parses Twison/Twine JSON export into QNCE StoryData

import type { StoryAdapter, AdapterOptions } from '../../adapters/contracts';
import type { StoryData } from '../../engine/core';
import type { ValidationResult } from '../../engine/validation';

interface TwisonPassage {
  pid?: number;
  name: string;
  text: string;
  links?: Array<{ name: string; pid?: number; link: string }>;
  tags?: string[];
}

interface TwisonDocument {
  passages: TwisonPassage[];
  startnode?: number;
  name?: string;
  ifid?: string;
}

export class TwisonAdapter implements StoryAdapter {
  async load(source: string | object, options?: AdapterOptions): Promise<StoryData> {
    const doc: TwisonDocument = typeof source === 'string' ? JSON.parse(source) : (source as any);
    if (!doc || !Array.isArray(doc.passages)) throw new Error('Invalid Twison document');

    const idPrefix = options?.idPrefix ?? '';

    const makeId = (name: string) => `${idPrefix}${name}`;
    const tagSet = new Set<string>();
    const nodes = doc.passages.map((p) => ({
      id: makeId(p.name),
      text: p.text ?? '',
      choices: (p.links ?? []).map((l) => ({
        text: l.name ?? l.link,
        nextNodeId: makeId(l.link),
        // tags could be surfaced as requirements/effects by a later mapping stage
      })),
      meta: Array.isArray(p.tags) && p.tags.length > 0 ? { tags: p.tags.filter(Boolean).map(String) } : undefined,
    }));

    // Collect tags for visibility (not yet mapped into StoryData schema)
    for (const p of doc.passages) {
      if (Array.isArray(p.tags)) {
        p.tags.filter(Boolean).forEach((t) => tagSet.add(String(t)));
      }
    }

    // Improved start detection:
    // 1) explicit startnode by pid
    // 2) passage named "Start" (case-insensitive)
    // 3) first passage fallback
    let initialNodeId = nodes[0]?.id ?? 'start';
    if (doc.startnode) {
      const startPassage = doc.passages.find((p) => p.pid === doc.startnode) || doc.passages[0];
      if (startPassage) initialNodeId = makeId(startPassage.name);
    } else {
      const byName = doc.passages.find((p) => /^(start)$/i.test(p.name));
      if (byName) initialNodeId = makeId(byName.name);
    }

  // Tags are now captured in node.meta.tags; no warning needed.

    return { initialNodeId, nodes } as StoryData;
  }

  validate(_storyData: StoryData): ValidationResult {
    return { isValid: true };
  }

  detect(source: unknown): boolean {
    let obj: any = source;
    if (typeof source === 'string') {
      try { obj = JSON.parse(source); } catch { return false; }
    }
    return !!obj && Array.isArray(obj.passages);
  }
}

export default TwisonAdapter;
