markdown
<!--  
  Use this file to provide workspace-specific custom instructions to Copilot.  
  For more details, visit  
  https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file  
-->

# Copilot Instructions for QNCE-Engine Core

This project is the headless Quantum Narrative Convergence Engine (QNCE) core library and CLI. It empowers developers to build quantum-inspired interactive stories with superposition, entanglement, measurement, and more.

---

## 1. QNCE Core Concepts

- **Superposition**: Variables hold multiple possible states until observed.  
- **Collapse**: An `observe()` call resolves a superposition into one definite state.  
- **Entanglement**: Linked flags influence each other’s outcomes whenever one is measured.  
- **Decoherence**: Flags lose superposed information over time or actions.  
- **Measurement & Uncertainty**: Support sampling strategies, p50/p95 latency metrics, and state versioning.

---

## 2. Module Responsibilities

- **`src/engine/`**: Core runtime, story graph traversal, flag lifecycle, event hooks.  
- **`src/parser/`**: QSL or JSON story import, AST definitions, grammar module.  
- **`src/adapters/`**:  
  - **StoryAdapter**: Ink, Twine, JSON → internal `StoryData`.  
  - **StorageAdapter**: Memory, LocalStorage, File, IndexedDB.  
  - **TelemetryAdapter**: Console, File, Sampling, Batching.  
- **`src/cli/`**: `qnce-import` and `qnce-play` commands, flag parsing, reporting, non-interactive mode.  
- **`src/utils/`**: Logging, formatting, deterministic ID maps, schema validation.

---

## 3. Development Workflow

### Branching Strategy

- `main` holds production-ready releases.  
- Create feature branches off `main`:  
  `feature/<short-description>` (e.g., `feature/quantum-flag-refactor`).  
- Use `release/<version>` branches for patch or minor releases.

### Commit Conventions

- Use [Conventional Commits]:  
  - `feat(parser): add superposition grammar rule`  
  - `fix(engine): handle missing storage adapter error`  
  - `chore(release): bump to 1.0.0`  
- Always reference issue numbers when applicable:  
  `fix(engine): prevent infinite loop in collapse (#123)`

### Changelog Management

- Maintain `CHANGELOG.md` with an **Unreleased** section on top.  
- On each release:  
  1. Move Unreleased entries under `## [x.y.z] – YYYY-MM-DD`.  
  2. Add new **Unreleased** header.  
- Automate changelog generation via Conventional Commits or a tool like `standard-version`.

### API Surface Discipline

- All exported APIs must carry a recognized TSDoc release tag: `@public`, `@beta`, `@alpha`, or `@internal`. You may add `@experimental` in addition, but it is not a recognized release tag by API Extractor.
- The API report (`etc/qnce-engine.api.md`) must be kept up to date. CI will fail if the API report drifts.

### Always Update the Changelog

- For every meaningful code, tooling, or documentation change, add an entry under `## [Unreleased]` in `CHANGELOG.md` with one of: Added, Changed, Fixed, Performance, Tooling, Docs/Meta, or Tests.
- On release, move the accumulated Unreleased entries into a new versioned section and start a fresh Unreleased block.

### Versioning & Releases

- Follow Semantic Versioning: MAJOR.MINOR.PATCH.  
- Bump versions in `package.json` before tagging.  
- Tag releases in Git:  
  ```bash
  git tag -a v1.0.0 -m "release: QNCE Engine v1.0.0"
  git push origin main --tags
  npm publish
CI pipelines should publish only on main-branch tags.

4. How to Run & Test
Install dependencies:

bash
npm install
Build & typecheck:

bash
npm run build
npm run typecheck
Unit & integration tests:

bash
npm test
CLI smoke tests:

bash
qnce-import examples/demo.json
qnce-play examples/demo.json --telemetry console --telemetry-report
5. Code Quality & Standards
Use TypeScript with strict mode enabled.

Lint via ESLint + Prettier; enforce in CI.

Achieve ≥ 90 % coverage on core modules.

Write tests for every new feature, edge case, and adapter failure.

Document public APIs with JSDoc comments.
Run API Extractor locally (`npm run dx:api-report`) before pushing. Fix or annotate any missing release tags.

6. Copilot Usage Tips
Encourage Copilot to suggest code snippets using the existing module patterns.

Prompt for boilerplate: “Generate a StorageAdapter for Redis implementing the adapter interface.”

Ask Copilot for test templates: “Create Jest tests for the observeFlag method covering success and error paths.”

Use inline comments to guide Copilot toward design patterns:

ts
// TODO: implement CompositeEntangler to bind multiple QuantumFlags
7. Contribution & Collaboration
Open issues for feature requests or bugs; label them help-wanted or good-first-issue.

Review PRs with focus on backward compatibility, docs updates, and test coverage.

Keep discussions in GitHub Discussions or your chosen forum to preserve context.

Hold biweekly syncs to roadmap upcoming sprints and prioritize feedback.

---

## 8. Security & Privacy Practices

Guidance for assistants and contributors to maintain our current security posture while avoiding leaks:

- Public roadmap (docs/PUBLIC_ROADMAP.md) MUST NOT include forward-looking security tasks. Track security backlog privately in `docs/SECURITY_ROADMAP.local.md` (ignored by Git).
- Before merging, run the sensitive artifact guard:
  - `npm run check:sensitive`
- Do not reintroduce internal planning artifacts. Sanitized placeholders are allowed, but new content must remain private.
- SECURITY policy changes belong in `SECURITY.md` only when controls are active and safe to disclose (scope/definitions allowed).
- Prefer outcome-based phrasing in public surfaces (CHANGELOG/Release Notes); avoid tool names or attack surface details when not necessary.
- No default external telemetry. Any remote export must be explicitly opt-in and avoid PII.

### Security Checklist (per PR)
- [ ] Run `npm run check:sensitive` (must pass)
- [ ] No forward-looking security tasks added to public docs
- [ ] Public changes contain no internal sprint/charter details
- [ ] If a new control is shipped, update SECURITY.md minimally (scope, commands) and CHANGELOG

### Useful Commands
- Sensitive scan: `npm run check:sensitive`
- API report: `npm run dx:api-report`
- Tests: `npm test`
- Typecheck: `npm run typecheck`