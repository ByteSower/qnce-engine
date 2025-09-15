# QNCE Engine Wiki

<div align="center">

![QNCE Engine Logo](https://img.shields.io/badge/QNCE-Engine-blue?style=for-the-badge)

[![NPM Version](https://img.shields.io/npm/v/qnce-engine?style=flat-square)](https://www.npmjs.com/package/qnce-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-61%2F61%20Passing-green?style=flat-square)](#)
[![Performance](https://img.shields.io/badge/Performance-Optimized-orange?style=flat-square)](#)

**Quantum Narrative Convergence Engine** - Framework-agnostic interactive storytelling with quantum-inspired mechanics

</div>

## 🌟 Welcome to QNCE Engine

The **Quantum Narrative Convergence Engine (QNCE)** is a powerful TypeScript library that enables developers to create sophisticated interactive narrative experiences. Drawing inspiration from quantum mechanics, QNCE provides unique storytelling capabilities through **superposition**, **collapse**, and **entanglement** mechanics.

## ⚡ Key Features

### 🌿 **Advanced Branching System**
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion
- **Real-time branch insertion/removal** for live content updates
- **Dynamic branch evaluation** with custom condition evaluators

### 🚀 **Performance Infrastructure**
- **Object Pooling:** 90%+ allocation reduction
- **Background Processing:** Non-blocking cache preloading
- **Hot-Reload:** Sub-3.5ms live story updates
- **Real-time Profiling:** Comprehensive performance analysis

### 🛠️ **Developer Experience**
- **Framework-agnostic** - Works with React, Vue, Node.js, vanilla JS
- **TypeScript-first** with comprehensive type definitions
- **Modular architecture** allowing selective feature imports
- **CLI tools** for project scaffolding and performance monitoring

### 💾 **State Management**
- **Full state persistence** with compression and validation
- **Automatic save/restore** with configurable intervals
- **Checkpoint system** for implementing undo/redo functionality
- **Cross-session persistence** with localStorage and custom storage adapters

### 🎨 **UI Components**
- **React integration** with `useQNCE` hook for reactive state management
- **Pre-built components** - UndoRedoControls, AutosaveIndicator
- **Keyboard shortcuts** for common actions and accessibility
- **Customizable theming** and responsive design support

## 🎯 Core Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **Superposition** | Multiple narrative outcomes exist simultaneously | Player facing multiple potential story paths |
| **Collapse** | Choices "collapse" the narrative to a specific path | Making a decision that locks in story direction |
| **Entanglement** | Early decisions affect later outcomes | A kindness in chapter 1 affecting chapter 5 |

## 🚀 Quick Start

```bash
# Install QNCE Engine
npm install qnce-engine

# Create a new project
npx qnce-init my-story

# Run performance monitoring
npx qnce-perf --watch
```

```javascript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

// Create engine instance
const engine = createQNCEEngine(DEMO_STORY);

// Get current narrative state
console.log(engine.getCurrentNode().text);

// Display available choices
const choices = engine.getAvailableChoices();
choices.forEach((choice, i) => {
  console.log(`${i + 1}. ${choice.text}`);
});

// Make a choice and advance the story
engine.makeChoice(0);
```

## 📚 Documentation Structure

| Page | Description | Quick Link |
|------|-------------|------------|
| **[Getting Started](Getting-Started)** | Installation, basic usage, first steps | 🏁 Start here! |
| **[Beginner Guide](Beginner-Guide)** | No-code: make and play a story via CLI | 🎉 New users |
| **[Branching Guide](Branching-Guide)** | Advanced branching system and AI integration | 🌿 Power features |
| **[Performance Tuning](Performance-Tuning)** | Optimization, monitoring, and profiling | ⚡ Speed it up |
| **[CLI Usage](CLI-Usage)** | Command-line tools and automation | 🛠️ Developer tools |
| **[Analytics & Telemetry](Analytics-and-Telemetry)** | Opt-in, privacy-safe pipeline and CLI reporting | 📈 Insights |
| **[API Reference](API-Reference)** | Complete API documentation | 📖 Technical specs |
| **[Persistence Adapters](Persistence-Adapters)** | How to save/load engine state across backends | 💾 Persistence |
| **[Error Handling & Debug](Error-Handling-and-Debug)** | Structured errors, logging & diagnostics | 🧯 Reliability |
| **[Contributing](Contributing)** | How to contribute to the project | 🤝 Join us! |
| **[Release Notes](Release-Notes)** | Version history and migration guides | 📋 What's new |

## 🎮 Use Cases

### 🎭 **Interactive Fiction**
Create branching narratives with complex storylines and character development.

### 🎲 **Game Narratives**
Power RPG dialogue systems, quest lines, and story-driven gameplay.

### 📚 **Educational Content**
Build interactive learning experiences with adaptive pathways.

### 🏢 **Enterprise Applications**
Create guided user experiences, onboarding flows, and decision trees.

## 📊 Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| State Transitions | ≤5ms | ~3ms | ✅ Exceeds |
| Flow Switches | ≤20ms | ~12ms | ✅ Exceeds |
| Hot-reload Updates | <2ms | ~1.8ms | ✅ Meets |
| Memory Usage | ≤50MB | ~35MB | ✅ Exceeds |
| Cache Hit Rate | ≥95% | ~98% | ✅ Exceeds |

## 🌐 Framework Support

QNCE Engine works seamlessly with popular frameworks:

| Framework | Support Level | Integration Guide |
|-----------|---------------|-------------------|
| **React** | ✅ Full | [React Integration](Getting-Started#react-integration) |
| **Vue 3** | ✅ Full | [Vue Integration](Getting-Started#vue-integration) |
| **Node.js** | ✅ Full | [Server Integration](Getting-Started#nodejs-integration) |
| **Vanilla JS** | ✅ Full | [Vanilla JS Guide](Getting-Started#vanilla-javascript) |
| **TypeScript** | ✅ Native | [TypeScript Examples](Getting-Started#typescript-examples) |

## 🔗 Important Links

### 📦 **Package & Repository**
- **[NPM Package](https://www.npmjs.com/package/qnce-engine)** - Install via `npm install qnce-engine`
- **[GitHub Repository](https://github.com/ByteSower/qnce-engine)** - Source code and issues
- **[Release Page](https://github.com/ByteSower/qnce-engine/releases)** - Download releases

### 📚 **Learning Resources**
- **[Examples Directory](https://github.com/ByteSower/qnce-engine/tree/main/examples)** - Working code examples
- **[Performance Guide](https://github.com/ByteSower/qnce-engine/blob/main/docs/PERFORMANCE.md)** - Optimization strategies
- **[Contributing Guidelines](https://github.com/ByteSower/qnce-engine/blob/main/CONTRIBUTING.md)** - How to contribute

### 🤝 **Community**
- **[GitHub Discussions](https://github.com/ByteSower/qnce-engine/discussions)** - Ask questions and share ideas
- **[GitHub Issues](https://github.com/ByteSower/qnce-engine/issues)** - Report bugs and request features

## 🚀 What's Next?

### 🗺️ **Roadmap for v1.3.0**
- **Visual story editor** with drag-and-drop interface
- **Advanced AI integration** with GPT and Claude support
- **Multiplayer narratives** with real-time synchronization
- **Visual novel renderer** for rich media stories

## 📄 License

QNCE Engine is released under the [MIT License](https://github.com/ByteSower/qnce-engine/blob/main/LICENSE).

---

<div align="center">

**Ready to build your next interactive narrative?**

[Get Started →](Getting-Started) | [View Examples →](https://github.com/ByteSower/qnce-engine/tree/main/examples) | [Join Community →](https://github.com/ByteSower/qnce-engine/discussions)

*Built with ❤️ by the QNCE development team*

</div>

---

## 📍 Wiki Navigation

**You are here:** Home

**Next:** [Getting Started →](Getting-Started)

**All Pages:** [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [Analytics & Telemetry](Analytics-and-Telemetry) • [API Reference](API-Reference) • [Persistence Adapters](Persistence-Adapters) • [Error Handling & Debug](Error-Handling-and-Debug) • [Contributing](Contributing) • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.3.0 with advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
