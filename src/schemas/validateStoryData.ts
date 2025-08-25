// JSON Schema validation for QNCE StoryData using AJV
import Ajv, { ErrorObject } from 'ajv';
import schema from './story-data.schema.json';
import type { StoryData } from '../engine/core';

const ajv = new Ajv({ allErrors: true } as any);
const validateFn = ajv.compile(schema as any);

export interface SchemaValidation {
  valid: boolean;
  errors?: ErrorObject[];
}

export function validateStoryData(data: StoryData): SchemaValidation {
  const valid = validateFn(data) as boolean;
  return { valid, errors: valid ? undefined : (validateFn.errors || undefined) };
}
