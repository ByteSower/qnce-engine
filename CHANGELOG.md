# Changelog

All notable changes to the QNCE Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
