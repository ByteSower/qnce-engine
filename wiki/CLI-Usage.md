# CLI Usage Guide

The QNCE Engine includes powerful command-line tools for project management, performance monitoring, and story validation. This guide covers all CLI commands and their usage.

## 🛠️ CLI Tools Overview

QNCE Engine provides four main CLI tools:

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **`qnce-init`** | Project scaffolding | Templates, quick setup, configuration |
| **`qnce-import`** | Story import/normalize | Convert Custom JSON, Twison, minimal Ink into QNCE StoryData |
| **`qnce-audit`** | Story validation | Dead-end detection, reference checking, performance analysis |
| **`qnce-perf`** | Performance monitoring | Real-time dashboards, profiling, alerts |
| **`qnce-play`** | Interactive play | Play stories in terminal; persistence via adapters |

## � qnce-import - Story Import & Normalization

Normalize external story formats into QNCE `StoryData`.

### Basic Usage

```bash
qnce-import <input-file>|(stdin) [--out <file>|stdout] [--id-prefix <prefix>] [--format json|twison|ink] [--strict] [--experimental-ink]
```

### Options

- `--format` json|twison|ink: Override auto-detection
- `--out` file|stdout: Output destination (default stdout if piped)
- `--strict`: Enforce JSON Schema validation; errors on unknown keys (Custom JSON)
- `--id-prefix`: Namespace node IDs during import
- `--experimental-ink`: Enable extra heuristics for Ink JSON (best-effort)

### Exit Codes

- 0: Success without schema warnings
- 1: Success with schema warnings (lenient mode)
- 2: Errors (parse/validation/IO failures)

### Notes

- Twison tags are mapped to `node.meta.tags` in the output. Post-process tags into flags/requirements if needed.
- The engine performs a final validation pass via `loadStoryData` before writing.

## �📦 Installation

### Global Installation (Recommended)

```bash
# Install globally for CLI access
npm install -g qnce-engine

# Verify installation
qnce-init --version
qnce-audit --version
qnce-perf --version
```

### Local Project Installation

```bash
# Install in project
npm install qnce-engine

# Use with npx
npx qnce-init --help
npx qnce-audit story.json
npx qnce-perf dashboard
```

## 🚀 qnce-init - Project Scaffolding

Create new QNCE projects with pre-configured templates and examples.

### Basic Usage

```bash
# Create a new project
qnce-init my-story

# Create with specific template
qnce-init my-rpg --template rpg-dialogue

# Interactive setup
qnce-init --interactive
```

### Command Options

```bash
qnce-init [project-name] [options]

Options:
  --template, -t     Template to use (default: basic)
  --framework, -f    Target framework (react, vue, node, vanilla)
  --typescript       Use TypeScript (default: true)
  --git             Initialize git repository (default: true)
  --install         Auto-install dependencies (default: true)
  --examples        Include example stories (default: true)
  --performance     Enable performance features (default: true)
  --branching       Enable advanced branching (default: false)
  --interactive, -i  Interactive setup mode
  --help, -h        Show help
  --version, -v     Show version
```

### Available Templates

#### Basic Templates

```bash
# Simple interactive fiction
qnce-init story --template interactive-fiction

# Visual novel style
qnce-init novel --template visual-novel

# Educational content
qnce-init learning --template educational

# Game dialogue system
qnce-init rpg --template rpg-dialogue
```

#### Framework-Specific Templates

```bash
# React project with QNCE integration
qnce-init react-story --template react --framework react

# Vue 3 project
qnce-init vue-story --template vue --framework vue

# Node.js server
qnce-init server-story --template server --framework node

# Vanilla JavaScript
qnce-init vanilla-story --template vanilla --framework vanilla
```

#### Advanced Templates

```bash
# Full-featured branching story
qnce-init advanced-story --template branching-advanced

# AI-integrated narrative
qnce-init ai-story --template ai-integration

# Multiplayer narrative
qnce-init multiplayer --template multiplayer

# Performance-optimized large story
qnce-init large-story --template enterprise
```

### Example: Creating a React Story Project

```bash
# Create React project with TypeScript and branching
qnce-init my-react-story \\
  --template react \\
  --framework react \\
  --typescript \\
  --branching \\
  --performance

# This creates:
my-react-story/
├── src/
│   ├── components/
│   │   ├── StoryComponent.tsx
│   │   ├── ChoiceSelector.tsx
│   │   └── StateDebugger.tsx
│   ├── hooks/
│   │   └── useQNCE.ts
│   ├── story/
│   │   └── demo-story.ts
│   └── App.tsx
├── package.json
├── tsconfig.json
├── README.md
└── qnce.config.js
```

### Generated Project Structure

```
my-story/
├── src/                    # Source code
│   ├── story/             # Story data files
│   │   ├── main-story.ts  # Main story definition
│   │   └── demo-story.ts  # Demo/example story
│   ├── components/        # UI components (if framework specified)
│   ├── utils/            # Utility functions
│   └── index.ts          # Entry point
├── examples/             # Example implementations
├── tests/               # Test files
├── docs/                # Documentation
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── qnce.config.js       # QNCE configuration
└── README.md           # Project documentation
```

## 🔍 qnce-audit - Story Validation

Comprehensive story analysis and validation tool.

### Basic Usage

```bash
# Audit a story file
qnce-audit story.json

# Audit with detailed output
qnce-audit story.json --verbose

# Audit with performance analysis
qnce-audit story.json --performance
```

### Command Options

```bash
qnce-audit <story-file> [options]

Options:
  --verbose, -v         Detailed output with warnings and suggestions
  --performance, -p     Include performance analysis
  --format, -f          Output format (text, json, html) (default: text)
  --output, -o          Output file (default: stdout)
  --fix                 Auto-fix common issues where possible
  --config, -c          Custom audit configuration file
  --strict              Strict mode with additional checks
  --exclude             Exclude specific checks (comma-separated)
  --include-only        Only run specific checks (comma-separated)
  --help, -h           Show help
```

### Audit Checks

#### Structure Validation

```bash
# Check story structure integrity
qnce-audit story.json --include-only structure

# Checks performed:
# ✓ Valid JSON structure
# ✓ Required fields present
# ✓ Node ID uniqueness
# ✓ Choice target validation
# ✓ Initial node existence
# ✓ Circular reference detection
```

#### Dead-End Detection

```bash
# Find nodes with no exit options
qnce-audit story.json --include-only dead-ends

# Example output:
# ❌ Dead-end detected: node 'trapped-cave' has no choices
# ❌ Unreachable node: 'secret-room' cannot be reached from start
# ⚠️  Potential dead-end: 'boss-fight' only accessible with high stats
```

#### Flag Analysis

```bash
# Analyze flag usage and consistency
qnce-audit story.json --include-only flags

# Checks:
# ✓ Flag naming consistency
# ✓ Undefined flag references
# ✓ Flag type consistency
# ✓ Unused flag definitions
# ✓ Flag dependency cycles
```

#### Performance Analysis

```bash
# Performance and optimization suggestions
qnce-audit story.json --performance

# Analysis includes:
# - Story size metrics
# - Choice complexity analysis
# - Memory usage estimates
# - Optimization recommendations
```

### Example Audit Output

```bash
$ qnce-audit examples/large-story.json --verbose

🔍 Auditing QNCE story: examples/large-story.json
📊 Story Analysis
================
📖 Title: "The Grand Adventure"
🔢 Nodes: 234 total
🌐 Choices: 456 total
🚀 Initial node: "story-start"
🏷️  Flags: 23 defined, 19 used

✅ Structure Validation
======================
✅ Valid JSON structure
✅ All required fields present
✅ Node IDs are unique
✅ All choice targets exist
✅ Initial node exists

⚠️  Potential Issues
==================
⚠️  Node 'ancient-temple-3' has only 1 choice (consider adding alternatives)
⚠️  Flag 'player_luck' is defined but never used
⚠️  Long choice text in node 'complex-decision' may affect UI

❌ Critical Issues
=================
❌ Dead-end detected: node 'game-over-trap' has no choices
❌ Unreachable: node 'secret-ending' cannot be reached from start

📈 Performance Analysis
======================
📊 Estimated memory usage: 12.3 MB
⚡ Average choice evaluation: ~2.1ms
🎯 Optimization score: 85/100

💡 Recommendations
==================
1. Add exit choice to 'game-over-trap' node
2. Create path to 'secret-ending' or remove if unused
3. Consider breaking long choice text into multiple lines
4. Remove unused 'player_luck' flag

📋 Summary: 2 critical issues, 3 warnings, 85% optimization score
```

### Auto-Fix Common Issues

```bash
# Automatically fix common problems
qnce-audit story.json --fix

# What gets fixed:
# ✓ Adds default "Continue" choice to dead-ends
# ✓ Removes unused flag definitions
# ✓ Fixes common typos in node references
# ✓ Standardizes flag naming conventions
# ✓ Optimizes choice ordering for performance
```

### Custom Audit Configuration

```javascript
// qnce-audit.config.js
module.exports = {
  checks: {
    structure: true,
    deadEnds: true,
    flags: true,
    performance: true,
    accessibility: true,
    localization: false
  },
  strictMode: true,
  performance: {
    maxNodes: 1000,
    maxChoicesPerNode: 8,
    maxFlagDepth: 5
  },
  rules: {
    choiceTextLength: { max: 100, warn: 80 },
    nodeTextLength: { max: 500, warn: 300 },
    flagNaming: 'snake_case'
  }
};
```

## ⚡ qnce-perf - Performance Monitoring

Real-time performance monitoring and profiling tool.

### Basic Usage

```bash
# Launch performance dashboard
qnce-perf dashboard

# Monitor specific story file
qnce-perf monitor story.json

# Generate performance report
qnce-perf report --output performance-report.json

# Stream NDJSON (metrics per line)
qnce-perf stream 1000 | jq '.'

# Export JSON including flush metrics
qnce-perf export > perf.json
# perf.json excerpt
# {
#   "timestamp": "...",
#   "performanceSummary": { /* ... */ },
#   "flushMetrics": {
#     "p95DispatchLatencyMs": 12.3,
#     "smoothedP95DispatchLatencyMs": 10.8,
#     "rejectionRate": 0.0,
#     "backoffActive": false,
#     "consecutiveRejects": 0,
#     "backoffDelayMs": 0,
#     "rejectedFlushesSinceLastSuccess": 0
#   },
#   "threadPoolStats": { /* ... */ }
# }
```

### Command Options

```bash
qnce-perf <command> [options]

Commands:
  dashboard             Launch interactive performance dashboard
  monitor <file>        Monitor story performance in real-time
  report [file]         Generate performance report
  profile <file>        Deep performance profiling
  benchmark            Run performance benchmarks
  compare <file1> <file2>  Compare performance between stories

Global Options:
  --verbose, -v         Detailed output
  --format, -f          Output format (text, json, html)
  --output, -o          Output file
  --config, -c          Configuration file
  --help, -h           Show help
```

## 🎮 qnce-play - Interactive Story Player

Play QNCE stories in the terminal with undo/redo and optional persistence via StorageAdapters.

### Basic Usage

```bash
qnce-play [story-file.json] [--storage <type>] [--storage-prefix <p>] [--storage-dir <dir>] [--storage-db <name>]
```

If no story file is provided, the demo story is used.

### Non-interactive Mode (scriptable)

```bash
qnce-play [story-file.json] --non-interactive [--save-key <key>] [--load-key <key>] [--storage ...]
```

Outputs a final JSON line with at least:

```json
{ "currentNodeId": "start", "storageKeys": ["slot1"] }
```

### Storage Options

- `--storage` memory|localStorage|sessionStorage|file|indexedDB
- `--storage-prefix` prefix for local/session keys (browser)
- `--storage-dir` directory for file storage (Node)
- `--storage-db` database name for IndexedDB (browser)

See: [Persistence Adapters](Persistence-Adapters)

### Interactive Commands

- 1-9: select choice
- u/undo, r/redo
- s/save, l/load (file-based save/load prompts)
- f/flags, hist, h/help, q/quit

### Performance Dashboard

```bash
# Launch real-time dashboard
qnce-perf dashboard

# Dashboard features:
# - Real-time memory usage graph
# - State transition timing
# - Cache hit rate monitoring
# - Background task queue status
# - Performance alerts and warnings
# - Interactive story navigation testing
```

Dashboard Interface:
```
┌─ QNCE Performance Dashboard ─────────────────────────────────────┐
│                                                                  │
│ 📊 Memory Usage         🚀 Transition Times      💾 Cache Stats │
│ Current: 23.4 MB        Avg: 2.1ms                Hit Rate: 94% │
│ Peak: 31.2 MB           Max: 8.7ms                Misses: 127   │
│ ▓▓▓▓▓▓▓░░░ 67%         ▓▓▓▓▓▓▓▓▓░ 87%          ▓▓▓▓▓▓▓▓▓▓ 94% │
│                                                                  │
│ 🔄 Background Tasks     ⚠️  Alerts               📈 Throughput  │
│ Queue: 3 pending        None active              245 ops/sec    │
│ Workers: 2/4 active     Last: 2m ago             Peak: 312/sec  │
│                                                                  │
│ 🎯 Story Navigation Test                                        │
│ Current Node: forest-entrance                                   │
│ [1] Enter the dark forest    [2] Circle around                 │
│ [3] Set up camp             [4] Call for help                  │
│                                                                  │
│ Press 'q' to quit, 'r' to refresh, '1-4' to test choices      │
└──────────────────────────────────────────────────────────────────┘
```

### Real-time Monitoring

```bash
# Monitor with live updates
qnce-perf monitor story.json --live --interval 1000

# Example output:
# 📊 Live Performance Monitor - story.json
# ========================================
# 
# [14:23:45] Memory: 24.1MB (+0.3) | Transitions: 2.3ms | Cache: 93% | Queue: 2
# [14:23:46] Memory: 24.1MB (+0.0) | Transitions: 1.9ms | Cache: 94% | Queue: 1
# [14:23:47] Memory: 24.3MB (+0.2) | Transitions: 3.1ms | Cache: 92% | Queue: 3
# [14:23:48] ⚠️  Slow transition detected: 5.2ms (node: complex-battle)
```

### Performance Profiling

```bash
# Deep performance profiling
qnce-perf profile story.json --duration 5m --detailed

# Profiling output:
# 🔬 Performance Profile Report
# ============================
# 
# 📊 Function Call Analysis:
# makeChoice():           1,234 calls, avg 2.1ms, total 2.6s
# evaluateConditions():   3,456 calls, avg 0.8ms, total 2.8s
# updateFlags():          2,109 calls, avg 0.3ms, total 0.6s
# 
# 🧠 Memory Allocation Hotspots:
# Choice objects:         45% of allocations
# Node objects:           23% of allocations
# Flag updates:           18% of allocations
# 
# 💡 Optimization Suggestions:
# 1. Enable object pooling for Choice objects (45% allocation reduction)
# 2. Cache condition evaluation results (30% performance improvement)
# 3. Batch flag updates (15% memory reduction)
```

### Performance Benchmarking

```bash
# Run standard benchmarks
qnce-perf benchmark

# Benchmark results:
# 🏃‍♂️ QNCE Engine Benchmarks
# ==========================
# 
# State Transitions:      2.1ms avg (target: ≤5ms) ✅
# Flow Switches:          12.3ms avg (target: ≤20ms) ✅
# Hot-reload:             1.8ms avg (target: <2ms) ✅
# Memory Usage:           34.2MB peak (target: ≤50MB) ✅
# Cache Performance:      94% hit rate (target: ≥95%) ⚠️
# 
# Overall Score: 92/100 (Excellent)
```

### Performance Comparison

```bash
# Compare two story files
qnce-perf compare story-v1.json story-v2.json

# Comparison output:
# 📊 Performance Comparison
# ========================
# 
# Metric              v1.json    v2.json    Change
# --------------------------------------------------
# Avg Transition      2.5ms      2.1ms      -16% ⬇️
# Memory Usage        45.2MB     34.1MB     -25% ⬇️
# Cache Hit Rate      89%        94%        +5% ⬆️
# Story Size          156 nodes  234 nodes  +50% ⬆️
# 
# 💡 Analysis:
# v2.json shows significant performance improvements despite being 50% larger.
# Memory optimizations and better caching contribute to better overall performance.
```

### Export Performance Data

```bash
# Export detailed performance data
qnce-perf report story.json --format json --output perf-data.json

# Export for external analysis
qnce-perf report story.json --format csv --metrics all

# Generate HTML report
qnce-perf report story.json --format html --output report.html
```

## 🔧 CLI Configuration

### Global Configuration

```javascript
// ~/.qnce/config.js
module.exports = {
  // Default options for all CLI tools
  defaults: {
    typescript: true,
    performance: true,
    verbose: false
  },
  
  // Template preferences
  templates: {
    preferred: 'interactive-fiction',
    customPath: '~/.qnce/templates'
  },
  
  // Performance monitoring settings
  performance: {
    alertThresholds: {
      memoryUsage: '50MB',
      transitionTime: '5ms',
      cacheHitRate: '90%'
    },
    reportFormat: 'json',
    autoExport: true
  }
};
```

### Project Configuration

```javascript
// qnce.config.js (in project root)
module.exports = {
  // Story configuration
  story: {
    format: 'typescript',
    validation: 'strict',
    optimization: 'production'
  },
  
  // Performance settings
  performance: {
    enableProfiling: true,
    objectPooling: true,
    backgroundProcessing: true
  },
  
  // CLI behavior
  cli: {
    audit: {
      autoFix: false,
      strictMode: true
    },
    performance: {
      dashboard: {
        refreshRate: 1000,
        theme: 'dark'
      }
    }
  }
};
```

## 🚀 Advanced CLI Usage

### Automation and CI/CD

```bash
# Story validation in CI/CD pipeline
#!/bin/bash

# Validate all story files
for story in src/stories/*.json; do
  qnce-audit "$story" --strict --format json > "audit-$(basename "$story").json"
  if [ $? -ne 0 ]; then
    echo "❌ Validation failed for $story"
    exit 1
  fi
done

# Performance regression testing
qnce-perf benchmark --format json > benchmark-results.json
if ! jq -e '.overallScore >= 85' benchmark-results.json; then
  echo "❌ Performance regression detected"
  exit 1
fi

echo "✅ All stories validated and performance checks passed"
```

### Custom Scripts Integration

```javascript
// scripts/validate-and-deploy.js
const { execSync } = require('child_process');

async function validateAndDeploy() {
  try {
    // Audit all stories
    execSync('qnce-audit src/stories/*.json --strict', { stdio: 'inherit' });
    
    // Run performance tests
    const benchmarkResult = execSync('qnce-perf benchmark --format json', { encoding: 'utf8' });
    const metrics = JSON.parse(benchmarkResult);
    
    if (metrics.overallScore < 85) {
      throw new Error(`Performance score too low: ${metrics.overallScore}`);
    }
    
    // Deploy if all checks pass
    execSync('npm run deploy', { stdio: 'inherit' });
    console.log('✅ Deployment successful');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateAndDeploy();
```

### Monitoring Scripts

```bash
# Continuous monitoring script
#!/bin/bash

# Start background monitoring
qnce-perf monitor story.json --live --background --alerts &
MONITOR_PID=$!

# Run your application
npm start &
APP_PID=$!

# Cleanup on exit
trap "kill $MONITOR_PID $APP_PID" EXIT

# Wait for application to finish
wait $APP_PID
```

---

<div align="center">

**Need help with CLI tools?**

[Getting Started →](Getting-Started) | [API Reference →](API-Reference) | [GitHub Issues →](https://github.com/ByteSower/qnce-engine/issues)

*Built with ❤️ by the QNCE development team*

</div>

---

## 📍 Wiki Navigation

**You are here:** CLI Usage

**Previous:** [Performance Tuning ←](Performance-Tuning) | **Next:** [API Reference →](API-Reference)

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • **CLI Usage** • [API Reference](API-Reference) • [Contributing](Contributing) • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.2.2 with complete advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
