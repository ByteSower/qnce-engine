# Changelog

All notable changes to the QNCE Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**📌 Current Version: [1.3.1] - 2025-08-25**

## [1.3.1] - 2025-08-25

### Changed 📝

- README updated for v1.3.0 features (qnce-import, persistence adapters, qnce-play storage + non-interactive)
- NPM package republish to ensure accurate README on package page

> Patch release to align public docs with 1.3.0 functionality. No code changes.

## [1.3.0] - 2025-08-25

### Added ✨

- Story import CLI (`qnce-import`) with adapters:
  - Custom JSON (strict/lenient validation with JSON Schema)
  - Twison/Twine JSON (passages, links, robust start detection; tags mapped to `node.meta.tags`)
  - Minimal Ink JSON (developer preview; enable `--experimental-ink` for richer mapping)
- Persistence adapters (Memory, LocalStorage, SessionStorage, File, IndexedDB) with a simple factory
- Engine integration helpers: `attachStorageAdapter`, `saveToStorage`, `loadFromStorage`, `listStorageKeys`, etc.
- `qnce-play` CLI support for persistence backends and a scriptable non-interactive mode

### Changed 🔧

- Validation hardening: semantic checks for starting node and dangling links
- Documentation: New wiki pages and CLI docs for import and persistence; examples expanded

### Quality 🧪

- New adapter and CLI tests; full suite green across Node and jsdom projects

> This release delivers the Sprint 4.0 scope (Import + Persistence) as version 1.3.0.

## [1.2.3] - 2025-08-16

### Changed 📝

- **Documentation Consistency** – Standardized wiki footer/navigation across pages
- **Version Alignment** – Bumped library version to 1.2.3 (no engine code changes since 1.2.2)

### Housekeeping 🧹

- Minor README and metadata alignment preparing for next feature cycle

> Note: A temporary `v1.3.0` tag existed earlier in history but did not introduce new engine features compared to 1.2.x. The authoritative current release is 1.2.3; future feature work will target an upcoming 1.3.x milestone.

## [1.2.2] - 2025-07-05

### Security 🔒

- **Repository Security Audit** - Comprehensive security review and cleanup of public repository
- **Professional Metadata** - Updated package author and maintainer information to professional standards
- **Documentation Sanitization** - Removed internal development processes and team-specific references
- **Enhanced Protection** - Improved .gitignore patterns to prevent future sensitive file exposure

### Repository Cleanup 🧹

- **Removed Internal Files** - Eliminated chat logs, process documents, and internal development documentation
- **Standardized Attributions** - Updated all script and code attributions to professional standards
- **Clean Public Presentation** - Ensured all public-facing content maintains professional quality

## [1.2.1] - 2025-07-05

### Fixed 🐛

- **TypeScript Compatibility** - Fixed Set spread operator compatibility issue in condition.ts for better cross-environment support
- **Documentation Links** - Updated package.json with correct homepage and bugs URLs for improved NPM integration

### Enhanced 📚

- **Complete Documentation Overhaul** - Comprehensive documentation update for v1.2.0 features
  - Added React UI Components section with useQNCE hook, UndoRedoControls, and AutosaveIndicator
  - Enhanced Getting Started guide with current v1.2.0 React integration patterns
  - Expanded API Reference with complete TypeScript interfaces and practical examples
  - Updated Home page with State Management and UI Components feature highlights
  - Added missing v1.2.0 features to Release Notes (State Persistence, React UI, Undo/Redo)
- **Code Quality** - All documentation examples now compile successfully with TypeScript
- **Package Metadata** - Enhanced NPM package information for better discoverability

## [1.2.0] - 2025-07-03

### Added ✨

- **💾 State Persistence & Checkpoints** - Robust save/load and checkpoint features for autosave, undo, and scenario replay.
  - `saveState()` / `loadState()` for full serialization.
  - `createCheckpoint()` / `restoreFromCheckpoint()` for lightweight in-memory snapshots.
  - Data integrity via optional checksum validation.

- **🌿 Advanced Branching System** - Create dynamic, multi-path narratives with conditional logic and real-time content updates.
  - AI-driven content generation for dynamic story expansion.
  - Real-time branch insertion and removal.

- **⚡ Performance Infrastructure** - Enterprise-grade optimizations for large-scale narratives.
  - **Object Pooling:** Over 90% reduction in memory allocations.
  - **Background Processing:** Non-blocking cache preloading and telemetry.
  - **Hot-Reload:** Live story updates in <3.5ms with delta patching.

- **🖥️ Live Monitoring CLI** - `qnce-perf` command for real-time performance monitoring, live updates, and data export.

### Changed 🔧

- **Core Engine** - Refactored to support new persistence and branching features.
- **API** - `QNCEEngine` now includes methods for state management and branching.
- **Documentation** - Updated `README.md` and `wiki/API-Reference.md` with new features.

---

## [1.0.0] - 2025-07-01

### Added ✨
- **Core QNCE Engine** - Framework-agnostic narrative engine with quantum-inspired mechanics
- **TypeScript Support** - Full type definitions for all interfaces and functions
- **CLI Tools** - `qnce-init` and `qnce-audit` commands for project management
- **Demo Story** - Complete example narrative demonstrating quantum mechanics
- **Developer Experience** - Examples and comprehensive documentation

#### Developer Features
- **Examples** - Quantum Garden demo showcasing advanced narrative patterns
- **Integration Guide** - Complete setup instructions for any framework
- **API Documentation** - Comprehensive reference for all engine methods
- **Performance Focus** - Optimized for fast narrative transitions

### Technical Details 🔧
- **Core API** - `createQNCEEngine()`, `selectChoice()`, `getFlags()`, etc.
- **Data Models** - `StoryData`, `NarrativeNode`, `Choice`, `QNCEState` interfaces
- **CLI Commands** - Project initialization and story validation tools
- **Type Safety** - Proper TypeScript types throughout

### Initial Release Features
- ✅ **Superposition** - Multiple narrative outcomes until choice collapse
- ✅ **Entanglement** - Early decisions affect later story outcomes  
- ✅ **Flag System** - Dynamic state tracking across narrative progression
- ✅ **Node Graph** - Flexible story structure with choice-driven navigation
- ✅ **Framework Agnostic** - Works with React, Vue, vanilla JS, or any framework

### Published Package 📦
- **NPM Package** - `npm install qnce-engine`
- **GitHub Repository** - https://github.com/ByteSower/qnce-engine
- **MIT License** - Open source and community-friendly
- **Complete Distribution** - Ready-to-use package with examples and documentation

---

## Planned Releases

### [0.2.0] - Upcoming
- **Enhanced Performance** - Further optimization improvements
- **Advanced Features** - Additional narrative mechanics
- **Framework Integrations** - React and Vue adapters
- **Community Features** - User-requested enhancements

### [0.3.0] - Future  
- **Advanced Tooling** - Enhanced development experience
- **Plugin System** - Extensible engine architecture
- **Visual Tools** - Story design and editing interfaces

---

*QNCE Engine - Empowering interactive narratives with quantum-inspired mechanics.*
