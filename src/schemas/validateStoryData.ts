// JSON Schema validation for QNCE StoryData using AJV
import Ajv, { ErrorObject, type AnySchema, type ValidateFunction } from 'ajv';
import schema from './story-data.schema.json';
import type { StoryData } from '../engine/core';

const ajv = new Ajv({ allErrors: true });
const _validateFn = ajv.compile(schema as unknown as AnySchema) as ValidateFunction<StoryData>;
const validateFn = ((data: StoryData) => _validateFn(data) as boolean) as (data: StoryData) => boolean & { errors?: ErrorObject[] };
// Attach errors getter compatibility
Object.defineProperty(validateFn, 'errors', {
  get: () => (_validateFn.errors as unknown as ErrorObject[] | undefined),
});

export interface SchemaValidation {
  valid: boolean;
  errors?: ErrorObject[];
}

export function validateStoryData(data: StoryData): SchemaValidation {
  const valid: boolean = validateFn(data);
  const errs = (validateFn as unknown as { errors?: ErrorObject[] }).errors;
  return { valid, errors: valid ? undefined : (errs || undefined) };
}
