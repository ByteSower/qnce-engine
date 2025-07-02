# QNCE Engine v1.2.0 - Public Release 🚀

## 🎉 Public Repository Launch

The **Quantum Narrative Convergence Engine (QNCE)** is now publicly available! This framework-agnostic TypeScript library enables creation of interactive narrative experiences with quantum-inspired mechanics.

## ✨ New Features in v1.2.0

### 🌿 Advanced Branching System
- **Multi-path narratives** with conditional logic and flag-based branching
- **AI-driven content generation** for dynamic story expansion  
- **Real-time branch insertion/removal** for live content updates
- **Comprehensive analytics** for narrative optimization

### ⚡ Performance Infrastructure
- **🏊‍♂️ Object Pooling:** 90%+ allocation reduction, eliminating GC pressure
- **🧵 Background Processing:** Non-blocking cache preloading and telemetry writes
- **🔥 Hot-Reload:** <3.5ms live story updates with delta patching
- **📊 Real-time Profiling:** Comprehensive event instrumentation and analysis
- **🖥️ Live Monitoring:** `qnce-perf` CLI dashboard with performance alerts

## 📦 Installation

```bash
npm install qnce-engine
```

## 🚀 Quick Start

```typescript
import { createQNCEEngine, DEMO_STORY } from 'qnce-engine';

const engine = createQNCEEngine(DEMO_STORY);
console.log(engine.getCurrentNode().text);
```

## 📚 Examples & Documentation

- **📖 Quick Start:** `examples/quickstart-demo.js` - Simple JavaScript demo
- **🌿 Basic Branching:** `examples/branching-quickstart.ts` - TypeScript starter
- **🚀 Advanced Features:** `examples/branching-advanced-demo.ts` - Full feature showcase
- **🔬 Real-world Validation:** `scripts/validation-real-world.ts` - Complex scenarios

## 🛠️ CLI Tools

```bash
# Validate story structure
npx qnce-audit story.json

# Create new project  
npx qnce-init my-story

# Performance monitoring
npx qnce-perf --watch
```

## 🔧 Framework Integration

Works seamlessly with:
- **React** - Hook-based integration
- **Vue** - Composable integration  
- **Node.js** - Server-side narratives
- **Vanilla JS** - Direct integration

## 🎯 Core Concepts

- **Superposition:** Multiple narrative outcomes exist until a choice is made
- **Collapse:** Choices "collapse" the narrative to a specific path
- **Entanglement:** Early decisions affect later outcomes for complex stories

## 📋 Migration from Previous Versions

This is a major release with significant architectural improvements. See the [Migration Guide](docs/branching/MIGRATION.md) for upgrading from v1.1.x.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) and check out the [GitHub Issues](https://github.com/ByteSower/qnce-engine/issues) for ways to get involved.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository:** https://github.com/ByteSower/qnce-engine
- **Documentation:** [README.md](README.md)
- **Examples:** [examples/](examples/)
- **Performance Docs:** [docs/PERFORMANCE.md](docs/PERFORMANCE.md)

---

**Ready to build your next interactive narrative? Let's make stories that adapt and evolve! 🎭✨**
