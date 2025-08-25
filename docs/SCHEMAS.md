# QNCE Schemas

This directory contains JSON Schemas used to validate story data and persisted save envelopes.

## Story Data Schema
- File: `schemas/story-data.schema.json`
- Validates the `StoryData` shape used by the engine.
- Use in CLI `--dry-run` import to validate input stories before conversion.

## Save Envelope Schema
- File: `schemas/save-envelope.schema.json`
- Wraps engine state snapshots/deltas with metadata (version, storyId, engineVersion, checksum).
- Enables compatibility checks, integrity validation, and migrations.

These schemas are kept stable and versioned. Draft: JSON Schema draft-07 for broad tool compatibility.
