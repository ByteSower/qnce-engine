## Sprint <X> Template

### Goal
<High-level sprint objective>

### Committed Stories / Checklist
- [ ] Feature: 
- [ ] Quality: 
- [ ] Docs: 
- [ ] Performance: 

### Definition of Done
- Tests (unit + integration) green
- Lint & typecheck clean (no errors)
- API report updated (`dx:api-report`)
- Changelog entry under Unreleased

### Metrics Targets (Adjust as Needed)
- p50 transition < 2ms
- Storage ops success rate > 99%
- Telemetry drop rate < 1% (non-stress)

### Risks / Mitigations
| Risk | Mitigation |
| ---- | ---------- |
|  |  |

### Optional Enhancements (Not in Sprint Commitment)
- Telemetry open-handle audit (jest --detectOpenHandles)
- Replace remaining `any` in CLI with precise types & structured logger wrapper
- Add pluggable retry/backoff for storage adapter failures
- Provide `qnce-report` CLI for aggregated telemetry summaries
- Add benchmark for conditional choice filtering at scale (10k choices)

### Retro Notes Placeholder
- What went well:
- What to improve:
- Action items:

---
Generated template - copy and adapt per sprint.
