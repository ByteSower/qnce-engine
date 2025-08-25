# QNCE Engine v1.3.0 — Story Import & Persistence 🚀

## ✨ What’s New in v1.3.0

### 📥 Story Import (Developer Preview)
- New `qnce-import` CLI to normalize stories into QNCE StoryData
- Adapters: Custom JSON (strict/lenient schema validation), Twison/Twine (tags → `node.meta.tags`, improved start detection), minimal Ink JSON (`--experimental-ink` for richer mapping)

### 💾 Persistence Adapters
- Memory, LocalStorage, SessionStorage, File, IndexedDB backends via `createStorageAdapter()`
- Engine helpers: `attachStorageAdapter`, `saveToStorage`, `loadFromStorage`, `listStorageKeys`, and more
- `qnce-play` adds `--storage` flags and `--non-interactive` mode for scripts/CI

### 🧪 Quality
- New unit and CLI tests for import and persistence flows
- Docs and wiki updated (CLI Usage, Persistence Adapters, Release Notes)

---
# QNCE Engine v1.2.0 - Major Public Release 🚀

## 🎉 Welcome to the Public Release!

The **Quantum Narrative Convergence Engine (QNCE)** is now publicly available! This framework-agnostic TypeScript library enables creation of interactive narrative experiences with quantum-inspired mechanics.

## ✨ What's New in v1.2.0

### 🌿 Advanced Branching System
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion using configurable AI contexts
- **Real-time branch insertion/removal** for live content updates during gameplay
- **Comprehensive analytics** for narrative optimization and player behavior tracking
- **Dynamic branch evaluation** with custom condition evaluators

### ⚡ Performance Infrastructure
- **🏊‍♂️ Object Pooling:** 90%+ allocation reduction, eliminating garbage collection pressure
- **🧵 Background Processing:** Non-blocking cache preloading and telemetry writes using thread pools
- **🔥 Hot-Reload:** Sub-3.5ms live story updates with intelligent delta patching
- **📊 Real-time Profiling:** Comprehensive event instrumentation and performance analysis
- **🖥️ Live Monitoring:** `qnce-perf` CLI dashboard with performance alerts and metrics

### 🛠️ Enhanced CLI Tools
- **`qnce-audit`** - Advanced story validation with dead-end detection and reference checking
- **`qnce-init`** - Project scaffolding with multiple templates and configurations
- **`qnce-perf`** - Real-time performance monitoring with customizable dashboards

### 📚 Improved Developer Experience
- **Framework-agnostic design** - Works with React, Vue, Node.js, vanilla JavaScript
- **TypeScript-first** with comprehensive type definitions and IntelliSense support
- **Modular architecture** allowing selective feature imports
- **Extensive examples** from basic quickstart to advanced enterprise scenarios

## 📦 Installation

```bash
npm install qnce-engine
```

## 🚀 Quick Start

### JavaScript (ES6+)
```javascript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

const engine = createQNCEEngine(DEMO_STORY);
console.log(engine.getCurrentNode().text);

// Get available choices
const choices = engine.getAvailableChoices();
choices.forEach((choice, i) => {
  console.log(`${i + 1}. ${choice.text}`);
});

// Make a choice
engine.makeChoice(0);
```

### TypeScript (Advanced)
```typescript
import { 
  createQNCEEngine, 
  QNCEStory, 
  BranchingEngine,
  AIContext 
} from 'qnce-engine';

// Create engine with performance mode
const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  enableBranching: true
});

// Set up AI context for dynamic content
const aiContext: AIContext = {
  playerProfile: { name: 'Alex', preferences: ['adventure', 'mystery'] },
  storyThemes: ['quantum-mechanics', 'time-travel'],
  difficultyLevel: 'intermediate'
};

engine.setAIContext(aiContext);

// Generate dynamic branches
const dynamicBranches = engine.generateAIBranches();
```

## 📚 Examples & Documentation

### 🎯 Ready-to-Run Examples
- **📖 `examples/quickstart-demo.js`** - Simple JavaScript introduction
- **🌿 `examples/branching-quickstart.ts`** - TypeScript starter with branching
- **🚀 `examples/branching-advanced-demo.ts`** - Full feature showcase with AI integration
- **🔬 `scripts/validation-real-world.ts`** - Complex real-world scenarios
- **🧪 `scripts/validation-comprehensive.ts`** - Enterprise-grade validation

### 🛠️ CLI Usage
```bash
# Validate story structure and find issues
npx qnce-audit story.json

# Create new project with templates
npx qnce-init my-interactive-story

# Monitor performance in real-time
npx qnce-perf --watch --dashboard
```

## 🔧 Framework Integration Examples

### React Integration
```typescript
import { useQNCE } from 'qnce-engine/react';

function StoryComponent() {
  const { currentNode, choices, makeChoice, flags } = useQNCE(story);
  
  return (
    <div>
      <p>{currentNode.text}</p>
      {choices.map((choice, i) => (
        <button key={i} onClick={() => makeChoice(i)}>
          {choice.text}
        </button>
      ))}
    </div>
  );
}
```

### Vue 3 Integration
```typescript
import { useQNCE } from 'qnce-engine/vue';

export default {
  setup() {
    const { currentNode, choices, makeChoice } = useQNCE(story);
    return { currentNode, choices, makeChoice };
  }
};
```

### Node.js Server Integration
```typescript
import express from 'express';
import { createQNCEEngine } from 'qnce-engine';

const app = express();
const engine = createQNCEEngine(story);

app.post('/story/choice', (req, res) => {
  const { choiceIndex } = req.body;
  engine.makeChoice(choiceIndex);
  
  res.json({
    node: engine.getCurrentNode(),
    choices: engine.getAvailableChoices(),
    flags: engine.getFlags()
  });
});
```

## 🎯 Core Concepts

- **Superposition:** Multiple narrative outcomes exist simultaneously until a choice is made
- **Collapse:** Player choices "collapse" the narrative to a specific path, updating state and flags
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories

## 📊 Performance Benchmarks

- **State Transitions:** <5ms (target: ≤5ms) ✅
- **Flow Switches:** <20ms (target: ≤20ms) ✅  
- **Hot-reload Updates:** <3.5ms (target: <2ms) ⚡
- **Memory Footprint:** Optimized with object pooling
- **Cache Hit Rate:** 95%+ with intelligent preloading

## 🔄 Migration from v1.1.x

### Breaking Changes
- `QNCEEngine` constructor now accepts options object
- Performance mode must be explicitly enabled
- Some CLI command flags have changed

### Migration Guide
```typescript
// v1.1.x
const engine = new QNCEEngine(story);

// v1.2.0
const engine = createQNCEEngine(story, {
  enablePerformanceMode: true,
  enableBranching: true
});
```

## 🧪 Testing & Quality

- **61/61 tests passing** ✅
- **90%+ code coverage**
- **Performance regression testing**
- **Memory leak detection**
- **Cross-platform compatibility** (Node.js 16+, browsers)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Run tests:** `npm test`
4. **Submit a pull request**

### Development Setup
```bash
git clone https://github.com/ByteSower/qnce-engine.git
cd qnce-engine
npm install
npm run build
npm test
```

## 📋 What's Next?

### Roadmap for v1.3.0
- **Visual story editor** with drag-and-drop interface
- **Advanced AI integration** with GPT and Claude support
- **Multiplayer narratives** with real-time synchronization
- **Visual novel renderer** for rich media stories
- **Analytics dashboard** with detailed player insights

## 🔗 Links & Resources

- **📚 Documentation:** [README.md](README.md)
- **🛠️ Examples:** [examples/](examples/)
- **⚡ Performance:** [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
- **🔀 Branching Guide:** [docs/branching/](docs/branching/)
- **🐛 Issues:** [GitHub Issues](https://github.com/ByteSower/qnce-engine/issues)
- **💬 Discussions:** [GitHub Discussions](https://github.com/ByteSower/qnce-engine/discussions)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to the community for feedback and testing during the development process!

---

**Ready to build your next interactive narrative? Let's create stories that adapt, evolve, and amaze! 🎭✨**

*Built with ❤️ by the ByteSower team*
