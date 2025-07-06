# Release Notes

Complete version history and migration guides for QNCE Engine.

## � Version 1.2.2 - Security & Professional Standards Update

**Release Date:** July 5, 2025  
**NPM:** `npm install qnce-engine@1.2.2`

### 🔐 Security Improvements

- **Complete Repository Security Audit** - Comprehensive review and cleanup of all public repository content
- **Professional Metadata Standards** - Updated NPM package information to maintain professional presentation
- **Enhanced Privacy Protection** - Improved .gitignore patterns to prevent future sensitive file exposure

### 🧹 Repository Cleanup

- **Documentation Sanitization** - Removed internal development processes and team-specific references
- **Code Attribution Standards** - Updated all script and code attributions to professional standards
- **Public Content Quality** - Ensured all public-facing content maintains enterprise-level quality

### 📦 Migration from v1.2.2

No breaking changes or API modifications. This is a metadata and security update:

```bash
npm update qnce-engine
```

## �🔧 Version 1.2.1 - Documentation & Compatibility Update

**Released:** July 5, 2025  
**NPM:** `npm install qnce-engine@1.2.1`

### 🐛 Bug Fixes & Improvements

#### TypeScript Compatibility
- **Fixed Set spread operator** in condition.ts for better cross-environment compatibility
- **Enhanced package metadata** with correct homepage and bugs URLs

#### 📚 Complete Documentation Overhaul
- **React UI Components**: Added comprehensive documentation for `useQNCE` hook, `UndoRedoControls`, and `AutosaveIndicator` components
- **API Reference**: Enhanced with complete TypeScript interfaces and practical examples
- **Getting Started**: Updated React integration examples to use current v1.2.0 patterns
- **Feature Coverage**: Added missing v1.2.0 documentation for State Persistence, React UI, and Undo/Redo systems
- **Code Quality**: All documentation examples now compile successfully

### 📦 Migration from v1.2.0
No breaking changes - this is a documentation and compatibility update. Simply update:
```bash
npm install qnce-engine@1.2.1
```

## 🚀 Version 1.2.0 - Major Public Release

**Released:** July 2, 2025  
**NPM:** `npm install qnce-engine@1.2.0`

### 🎉 First Public Release!

This marks the first public release of the Quantum Narrative Convergence Engine. After extensive development and optimization, QNCE Engine is now ready for production use.

### ✨ Major Features

#### 🌿 Advanced Branching System
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion using configurable AI contexts
- **Real-time branch insertion/removal** for live content updates during gameplay
- **Comprehensive analytics** for narrative optimization and player behavior tracking
- **Dynamic branch evaluation** with custom condition evaluators

#### ⚡ Performance Infrastructure
- **🏊‍♂️ Object Pooling:** 90%+ allocation reduction, eliminating garbage collection pressure
- **🧵 Background Processing:** Non-blocking cache preloading and telemetry writes using thread pools
- **🔥 Hot-Reload:** Sub-3.5ms live story updates with intelligent delta patching
- **📊 Real-time Profiling:** Comprehensive event instrumentation and performance analysis
- **🖥️ Live Monitoring:** `qnce-perf` CLI dashboard with performance alerts and metrics

#### 🛠️ Enhanced CLI Tools
- **`qnce-audit`** - Advanced story validation with dead-end detection and reference checking
- **`qnce-init`** - Project scaffolding with multiple templates and configurations
- **`qnce-perf`** - Real-time performance monitoring with customizable dashboards

#### 📚 Improved Developer Experience
- **Framework-agnostic design** - Works with React, Vue, Node.js, vanilla JavaScript
- **TypeScript-first** with comprehensive type definitions and IntelliSense support
- **Modular architecture** allowing selective feature imports
- **Extensive examples** from basic quickstart to advanced enterprise scenarios

#### 💾 State Persistence & Autosave
- **Full state serialization** with compression and validation
- **Automatic save/restore** with configurable intervals and triggers
- **Checkpoint system** for implementing undo/redo functionality
- **Cross-session persistence** with localStorage and custom storage adapters
- **Save validation** ensuring data integrity and version compatibility

#### 🎨 React UI Components
- **`useQNCE` Hook** - Reactive state management for React components
- **`UndoRedoControls`** - Pre-built accessible undo/redo controls with theming
- **`AutosaveIndicator`** - Visual feedback for autosave status with timestamps
- **`useKeyboardShortcuts`** - Keyboard shortcut integration for common actions
- **Framework Integration** - Built-in React, Vue, and vanilla JS adapters

#### 🔄 Undo/Redo System
- **Multi-level undo/redo** with configurable history depth
- **Automatic checkpointing** before critical choices and state changes
- **Memory-efficient snapshots** using differential state compression
- **UI integration** with keyboard shortcuts and accessibility support

### 🎯 Core Concepts

- **Superposition:** Multiple narrative outcomes exist simultaneously until a choice is made
- **Collapse:** Player choices "collapse" the narrative to a specific path, updating state and flags
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories

### 📊 Performance Benchmarks

| Metric | Target | v1.2.0 Result | Status |
|--------|--------|---------------|--------|
| State Transitions | ≤5ms | ~3ms | ✅ Exceeds |
| Flow Switches | ≤20ms | ~12ms | ✅ Exceeds |
| Hot-reload Updates | <2ms | ~1.8ms | ✅ Meets |
| Memory Usage | ≤50MB | ~35MB | ✅ Exceeds |
| Cache Hit Rate | ≥95% | ~98% | ✅ Exceeds |

### 🚀 Installation

```bash
# Install QNCE Engine
npm install qnce-engine

# Global CLI installation
npm install -g qnce-engine

# Create new project
npx qnce-init my-story
```

### 🎮 Quick Start Example

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

// Create engine with performance optimization
const engine = createQNCEEngine(DEMO_STORY, {
  enablePerformanceMode: true,
  enableBranching: true
});

// Get current narrative state
const currentNode = engine.getCurrentNode();
console.log(currentNode.text);

// Display available choices
const choices = engine.getAvailableChoices();
choices.forEach((choice, index) => {
  console.log(`${index + 1}. ${choice.text}`);
});

// Make a choice and advance
engine.makeChoice(0);
```

### 🔧 Breaking Changes from v1.1.x

#### API Changes

```typescript
// v1.1.x
const engine = new QNCEEngine(story);

// v1.2.0 
const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  enableBranching: true
});
```

#### Configuration Updates

```typescript
// v1.1.x - Simple configuration
const options = {
  debug: true
};

// v1.2.0 - Structured configuration
const options = {
  enablePerformanceMode: true,
  performanceOptions: {
    objectPooling: { enable: true },
    backgroundProcessing: { enable: true }
  },
  enableBranching: true,
  validationMode: 'strict'
};
```

### 📚 Migration Guide

#### Updating from v1.1.x

1. **Update Constructor Calls**
   ```typescript
   // Old
   const engine = new QNCEEngine(story);
   
   // New
   const engine = createQNCEEngine(story);
   ```

2. **Update Configuration**
   ```typescript
   // Old
   const engine = new QNCEEngine(story, { debug: true });
   
   // New
   const engine = createQNCEEngine(story, {
     debugMode: true,
     enablePerformanceMode: true
   });
   ```

3. **Update CLI Commands**
   ```bash
   # Old
   qnce-validate story.json
   
   # New
   qnce-audit story.json
   ```

4. **Update Dependencies**
   ```bash
   npm uninstall qnce-engine-beta
   npm install qnce-engine@1.2.0
   ```

### 🧪 Testing & Quality

- **61/61 tests passing** ✅
- **90%+ code coverage**
- **Performance regression testing**
- **Memory leak detection**
- **Cross-platform compatibility** (Node.js 16+, modern browsers)

### 🔗 Framework Support

| Framework | Support Level | Integration Examples |
|-----------|---------------|---------------------|
| **React** | ✅ Full | `useQNCE` hook, component examples |
| **Vue 3** | ✅ Full | Composition API, reactive integration |
| **Node.js** | ✅ Full | Server-side rendering, API integration |
| **Vanilla JS** | ✅ Full | Browser integration, CDN support |
| **TypeScript** | ✅ Native | Full type definitions included |

### 📖 Documentation

- **[Complete Wiki](https://github.com/ByteSower/qnce-engine/wiki)** with guides and examples
- **[API Reference](https://github.com/ByteSower/qnce-engine/wiki/API-Reference)** with TypeScript definitions
- **[Performance Guide](https://github.com/ByteSower/qnce-engine/wiki/Performance-Tuning)** for optimization
- **[CLI Documentation](https://github.com/ByteSower/qnce-engine/wiki/CLI-Usage)** for all tools

### 🤝 Community & Contributing

- **[GitHub Repository](https://github.com/ByteSower/qnce-engine)** - Source code and issues
- **[GitHub Discussions](https://github.com/ByteSower/qnce-engine/discussions)** - Community Q&A
- **[Contributing Guide](https://github.com/ByteSower/qnce-engine/wiki/Contributing)** - How to contribute
- **[Issue Templates](https://github.com/ByteSower/qnce-engine/issues/new/choose)** - Report bugs or request features

### 🎯 What's Next? (Roadmap v1.3.0)

- **Visual story editor** with drag-and-drop interface
- **Advanced AI integration** with GPT and Claude support
- **Multiplayer narratives** with real-time synchronization
- **Visual novel renderer** for rich media stories
- **Analytics dashboard** with detailed player insights

---

## 📚 Version History

### 🚧 Pre-Release Versions

#### v1.1.0-beta
- **Released:** June 2025
- Basic branching system implementation
- Initial performance infrastructure
- CLI tools prototype
- TypeScript migration

#### v1.0.0-alpha
- **Released:** May 2025
- Core engine implementation
- Basic story format
- Node.js support
- Initial testing framework

#### v0.9.x (Development)
- **Released:** April 2025 (Development)
- Proof of concept
- Core narrative mechanics
- Basic JavaScript implementation

---

## 🛠️ Technical Changes

### Architecture Improvements

#### v1.2.0
- **Object-oriented design** with clean separation of concerns
- **Modular architecture** allowing selective imports
- **Plugin system** for extending functionality
- **Event-driven architecture** for reactive programming

#### Performance Optimizations
- **Object pooling** reducing allocations by 90%+
- **Background processing** for non-blocking operations
- **Intelligent caching** with 98% hit rates
- **Memory management** with automatic cleanup

#### Developer Experience
- **TypeScript-first** development with full type safety
- **Comprehensive testing** with 61 test cases
- **Professional CLI tools** for all development tasks
- **Framework integrations** for popular platforms

### Build System

#### v1.2.0
- **Modern build pipeline** with TypeScript compilation
- **ES modules and CommonJS** dual package support
- **Tree-shaking optimization** for smaller bundles
- **Source maps** for debugging
- **Automated testing** with CI/CD integration

---

## 🔄 Migration Guides

### From v1.1.x to v1.2.0

#### 1. Update Installation

```bash
# Remove old version
npm uninstall qnce-engine-beta

# Install stable version
npm install qnce-engine@1.2.0
```

#### 2. Update Imports

```typescript
// v1.1.x
import { QNCEEngine } from 'qnce-engine';

// v1.2.0 - Recommended
import { createQNCEEngine } from 'qnce-engine';

// v1.2.0 - Direct class import still supported
import { QNCEEngine } from 'qnce-engine';
```

#### 3. Update Engine Creation

```typescript
// v1.1.x
const engine = new QNCEEngine(story, {
  debug: true,
  performance: false
});

// v1.2.0
const engine = createQNCEEngine(story, {
  debugMode: true,
  enablePerformanceMode: true,
  enableBranching: false // Add if needed
});
```

#### 4. Update Story Format (Optional)

While v1.2.0 maintains backward compatibility, you can optionally upgrade to the new branching format:

```typescript
// v1.1.x - Basic format (still supported)
const basicStory = {
  nodes: [
    {
      id: 'start',
      text: 'Story text...',
      choices: [
        { text: 'Choice 1', nextNodeId: 'node1' }
      ]
    }
  ]
};

// v1.2.0 - Enhanced format (recommended for new projects)
const enhancedStory: QNCEStory = {
  id: 'my-story',
  title: 'My Interactive Story',
  version: '1.0.0',
  metadata: {
    author: 'Your Name',
    description: 'Story description'
  },
  branchingConfig: {
    maxActiveBranches: 5,
    enableDynamicInsertion: true,
    enableAnalytics: true
  },
  chapters: [
    {
      id: 'chapter-1',
      title: 'Beginning',
      flows: [
        {
          id: 'main-flow',
          nodes: [
            {
              id: 'start',
              text: 'Enhanced story text...',
              choices: [
                {
                  text: 'Enhanced choice',
                  nextNodeId: 'node1',
                  flagEffects: { courage: 1 }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
```

#### 5. Update CLI Commands

```bash
# v1.1.x
qnce-validate story.json
qnce-monitor story.json

# v1.2.0
qnce-audit story.json
qnce-perf monitor story.json
```

### Breaking Changes Summary

| Area | v1.1.x | v1.2.0 | Migration |
|------|--------|--------|-----------|
| **Constructor** | `new QNCEEngine()` | `createQNCEEngine()` | Use factory function |
| **Options** | Flat object | Structured config | Restructure options |
| **CLI** | `qnce-validate` | `qnce-audit` | Update commands |
| **Performance** | Manual | Automatic | Enable in options |
| **Types** | Basic | Comprehensive | Update imports |

---

## 🐛 Known Issues

### v1.2.0

#### Minor Issues
- **Hot-reload performance warning:** In very large stories (2000+ nodes), hot-reload may occasionally exceed the 2ms target. This doesn't affect functionality but may trigger performance warnings.
  - **Workaround:** Increase performance warning threshold in development
  - **Fix planned:** v1.2.2

#### Compatibility Notes
- **Node.js 14:** While not officially supported, basic functionality works on Node.js 14. Node.js 16+ recommended for full feature support.
- **Internet Explorer:** Not supported. Modern browsers (Chrome 80+, Firefox 75+, Safari 13+) required.

---

## 🔮 Future Roadmap

### v1.3.0 - Visual Tools & Advanced AI
**Planned:** Q3 2025

- **Visual Story Editor** with drag-and-drop interface
- **Advanced AI Integration** with GPT and Claude
- **Real-time Collaboration** for team story development
- **Performance Dashboard** with detailed analytics

### v1.4.0 - Multiplayer & Real-time
**Planned:** Q4 2025

- **Multiplayer Narratives** with synchronized choices
- **Real-time Story Sharing** across devices
- **Live Events System** for dynamic content
- **Advanced Analytics** with player behavior insights

### v2.0.0 - Next Generation
**Planned:** 2026

- **3D Story Visualization** with immersive interfaces
- **Voice Integration** with speech recognition
- **Machine Learning** for adaptive storytelling
- **Platform Integrations** with game engines and platforms

---

## 📄 License

QNCE Engine is released under the [MIT License](https://github.com/ByteSower/qnce-engine/blob/main/LICENSE).

## 🙏 Acknowledgments

Special thanks to all contributors, beta testers, and the community for making QNCE Engine possible!

---

## 📍 Wiki Navigation

**← Previous:** [Contributing](Contributing) | **You are here:** Release Notes

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • [Contributing](Contributing) • **Release Notes**

---

<div align="center">

**🎉 Thank you for using QNCE Engine! 🎉**

[Get Started →](Getting-Started) | [View Examples →](https://github.com/ByteSower/qnce-engine/tree/main/examples) | [Join Community →](https://github.com/ByteSower/qnce-engine/discussions)

*Built with ❤️ by the QNCE development team*

</div>

---

## 📍 Wiki Navigation

**← Previous:** [Contributing](Contributing) | **You are here:** Release Notes

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • [Contributing](Contributing) • **Release Notes**

---

*This documentation is maintained for QNCE Engine v1.2.2 with complete advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
