// QNCE Adapter Contracts
// Shared interfaces for story and storage adapter lanes

import type { StoryData } from '../engine/core';
import type { ValidationResult } from '../engine/validation';

export interface AdapterOptions {
  namespace?: string;
  strict?: boolean;
  idPrefix?: string;
}

export interface StoryAdapter {
  load(source: string | object, options?: AdapterOptions): Promise<StoryData>;
  validate(storyData: StoryData): ValidationResult;
  detect?(source: unknown): boolean;
  mapIds?(storyData: StoryData, strategy?: 'deterministic' | 'passthrough'): StoryData;
}

// Persistence envelope for saves
export interface SaveEnvelope<TPayload = any> {
  version: number; // schema version
  storyId: string;
  storyVersion: string;
  timestamp: string; // ISO string
  engineVersion: string;
  checksum: string; // checksum of payload
  payload: TPayload; // engine state snapshot or delta
}
