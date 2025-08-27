# Analytics & Telemetry (Sprint 4.1)

QNCE ships an opt-in, privacy-safe telemetry pipeline to help you understand usage, performance, and health without collecting personal data.

- Lightweight: in-process queue + batching with backpressure (drop-new)
- Privacy-safe by default: no PII; you control context fields
- Pluggable adapters: console (dev) and NDJSON file (node); HTTP/IndexedDB planned
- Sampling, batching, and basic stats with p50/p95 batch send latency

## Quick start

### CLI

- Enable telemetry and print a session report:
  - qnce-play --non-interactive --telemetry console --telemetry-report
- Write NDJSON events to a file:
  - qnce-play --telemetry file --telemetry-file qnce-telemetry.ndjson
- Adjust sampling:
  - qnce-play --telemetry console --telemetry-sample 0.5

Notes
- When --telemetry-report is provided, the CLI prints queued/sent/dropped and p50/p95 send latency (if available) on exit (interactive and non-interactive).

### Engine (programmatic)

- Pass a telemetry instance when creating the engine:
  - const telemetry = createTelemetry({ adapter, enabled: true, sampleRate: 0.25, defaultCtx: { sessionId, engineVersion, env } })
  - const engine = createQNCEEngine(story, undefined, false, undefined, { telemetry, env: 'dev' })
- You can flush at shutdown: await telemetry.flush(); and read stats via telemetry.stats()

## Event model

Events are simple envelopes: { type, payload, ts, ctx, meta }

- ctx: { sessionId, storyId?, appVersion?, engineVersion, env? }
- meta: { seq?: number, source?: 'engine' | 'cli' | 'ui' }
- Current engine emissions:
  - session.start, node.enter, choice.select
  - expression.evaluate { ok, ms? }
  - storage.op { op: 'save'|'load'|'delete'|'list'|'clear', ok, ms, key?, count? }
  - engine.error { where, error }
- CLI adds import.load and reports aggregate stats

## Sampling, batching, and backpressure

- Bernoulli sampling per event (sampleRate 0..1). Dropped events via sampling are counted.
- Batching: flush by size (default 50) and interval (default 2000ms).
- Queue backpressure: fixed-size ring buffer (default 1000). When full, new events are dropped and counted as 'queue_full'.

## Adapters

- ConsoleAdapter: dev-friendly logging of compact event lines
- FileAdapter: NDJSON append-only stream for offline processing
- Planned: HTTP adapter, IndexedDB adapter (UI)

## Stats and latency percentiles

telemetry.stats(): { queued, sent, dropped, lastFlushTs, p50?, p95? }

- p50/p95 reflect recent batch send latency samples (up to 200 samples)
- CLI prints these when available

## Privacy posture

- QNCE does not collect PII by default. You control ctx and payloads.
- Recommended defaults: opaque sessionId, coarse env, engine/app versions.
- For external transmission, ensure compliance with your privacy policy.

## Troubleshooting

- Seeing "Job queue limit exceeded" in tests? This comes from a legacy background path, not the new telemetry pipeline. It is harmless but can be silenced in CI by gating logs in test mode.
- No percentiles printed? Ensure at least one batch was sent during the run.

## Roadmap (Sprint 4.2+)

- HTTP adapter with retries and exponential backoff
- Browser IndexedDB adapter
- Extended metrics (error codes, per-event latency)
- Configurable redaction hooks

---

Version: 1.3.1  •  Status: Experimental
