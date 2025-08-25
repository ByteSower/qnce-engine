# QNCE Import CLI

Normalize external story formats into QNCE `StoryData`.

Usage:

```
qnce-import <input-file>|(stdin) [--out <file>|stdout] [--id-prefix <prefix>] [--format json|twison|ink] [--strict] [--experimental-ink]
```

- Auto-detects format (Custom JSON, Twison/Twine JSON, minimal Ink stub). Use `--format` to override.
- Reads from stdin when no input file is provided; write to stdout with `--out stdout`.
- `--strict` enforces JSON Schema validation and stricter adapters (e.g., unknown keys error in Custom JSON). In lenient mode, unknown keys will be ignored with warnings.
- `--id-prefix` can namespace node IDs during import.
- `--experimental-ink` enables extra heuristics for Ink JSON (still best-effort).

Exit codes:
- 0: Success without schema warnings
- 1: Success with schema warnings (non-strict)
- 2: Errors (parse/validation/IO failures)

Examples:

```
qnce-import story.twison.json --out game.qnce.json
qnce-import ink.json --id-prefix ink- --format ink
cat story.json | qnce-import --out stdout > normalized.json
```

Notes:
- Twison passages with tags are mapped to `node.meta.tags` in the output schema. You can post-process these tags into flags/requirements if desired.
- The Ink adapter here is a minimal stub intended for simple JSON structures; consider `--format ink` to force it. Use `--experimental-ink` to enable extra heuristics.
- The engine performs a final validation pass via `loadStoryData` before writing.
