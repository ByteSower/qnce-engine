# Contributing to QNCE Engine

Thank you for your interest in contributing to the Quantum Narrative Convergence Engine! This guide provides everything you need to know about contributing to this project.

## 🎯 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 Quick Start for Contributors

### 1. Set Up Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/qnce-engine.git
cd qnce-engine

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### 2. Verify Your Setup

```bash
# Run the quickstart demo
npm run demo:quickstart

# Run comprehensive tests
npm run test:all

# Check code style
npm run lint

# Verify performance benchmarks
npm run benchmark
```

## 📋 Types of Contributions

We welcome many different types of contributions:

### 🐛 Bug Reports

Help us improve by reporting bugs you encounter.

**Before Reporting:**
- Search [existing issues](https://github.com/ByteSower/qnce-engine/issues) for duplicates
- Test with the latest version
- Provide minimal reproduction cases

**Use our [Bug Report Template](https://github.com/ByteSower/qnce-engine/issues/new?template=bug_report.md)**

### ✨ Feature Requests

Suggest new features that would benefit the community.

**Good Feature Requests:**
- Address real use cases
- Align with project goals
- Consider backward compatibility
- Include implementation ideas

**Use our [Feature Request Template](https://github.com/ByteSower/qnce-engine/issues/new?template=feature_request.md)**

### 📚 Documentation

Improve documentation for better developer experience.

**Documentation Opportunities:**
- Fix typos and grammatical errors
- Add usage examples
- Improve API documentation
- Create tutorials and guides
- Translate documentation

### 🧪 Tests

Enhance test coverage and quality.

**Testing Opportunities:**
- Add unit tests for uncovered code
- Create integration tests
- Write performance regression tests
- Add edge case testing
- Improve test performance

### ⚡ Performance Improvements

Help make QNCE Engine faster and more efficient.

**Performance Guidelines:**
- Profile before and after changes
- Document performance impact
- Maintain backward compatibility
- Include benchmarks
- Consider memory usage

## 🛠️ Development Workflow

### Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Create bug fix branch
git checkout -b fix/issue-description

# Create documentation branch
git checkout -b docs/documentation-improvement
```

### Making Changes

#### 1. Code Style

We use strict TypeScript and consistent formatting:

```typescript
// Good: Clear, typed, well-documented
/**
 * Creates a new QNCE engine instance with the provided story data.
 * 
 * @param story - The story data to load
 * @param options - Configuration options for the engine
 * @returns A new QNCEEngine instance
 * @throws {ValidationError} When story data is invalid
 */
export function createQNCEEngine(
  story: QNCEStory,
  options: QNCEEngineOptions = {}
): QNCEEngine {
  // Implementation here
}

// Bad: Unclear, untyped, undocumented
export function create(story: any, opts?: any): any {
  // Implementation here
}
```

#### 2. Testing Requirements

All changes must include appropriate tests:

```typescript
// Example test structure
describe('QNCEEngine', () => {
  describe('Core Functionality', () => {
    it('should create engine with valid story', () => {
      const engine = createQNCEEngine(DEMO_STORY);
      expect(engine.getCurrentNode()).toBeDefined();
      expect(engine.getCurrentNode().id).toBe('start');
    });

    it('should handle invalid choice gracefully', () => {
      const engine = createQNCEEngine(DEMO_STORY);
      expect(() => engine.makeChoice(999)).toThrow('Invalid choice index');
    });
  });

  describe('Performance', () => {
    it('should complete state transitions within target time', () => {
      const engine = createQNCEEngine(LARGE_STORY);
      const startTime = performance.now();
      
      engine.makeChoice(0);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5); // 5ms target
    });
  });
});
```

#### 3. Documentation Standards

Update documentation for all public API changes:

```typescript
/**
 * Makes a choice and advances the story to the next node.
 * 
 * @param choiceIndex - Zero-based index of the choice to make
 * @throws {Error} When choice index is out of bounds
 * @throws {ValidationError} When choice conditions are not met
 * 
 * @example
 * ```typescript
 * const choices = engine.getAvailableChoices();
 * if (choices.length > 0) {
 *   engine.makeChoice(0); // Make the first choice
 * }
 * ```
 */
makeChoice(choiceIndex: number): void {
  // Implementation
}
```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
type(scope): description

# Examples
feat(engine): add AI-driven branch generation
fix(cli): resolve audit command hanging issue
docs(readme): update installation instructions
perf(core): optimize state transition performance
test(branching): add comprehensive branching tests
refactor(pooling): improve object pool efficiency
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `refactor`: Code refactoring without functional changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Scopes:**
- `engine`: Core engine functionality
- `branching`: Advanced branching system
- `cli`: Command-line tools
- `perf`: Performance infrastructure
- `docs`: Documentation
- `tests`: Test suite

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── engine/          # Core engine tests
│   ├── branching/       # Branching system tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── frameworks/      # Framework integration tests
│   └── cli/            # CLI tool tests
├── performance/         # Performance tests
│   ├── benchmarks/     # Performance benchmarks
│   └── regression/     # Regression tests
└── fixtures/           # Test data and fixtures
```

### Writing Tests

#### Unit Tests

```typescript
// tests/unit/engine/core.test.ts
import { createQNCEEngine } from '../../../src/engine/core';
import { DEMO_STORY } from '../../../src/engine/demo-story';

describe('createQNCEEngine', () => {
  it('should create engine with default options', () => {
    const engine = createQNCEEngine(DEMO_STORY);
    
    expect(engine).toBeDefined();
    expect(engine.getCurrentNode().id).toBe('start');
    expect(engine.getFlags()).toEqual({});
  });

  it('should apply custom options', () => {
    const engine = createQNCEEngine(DEMO_STORY, {
      enablePerformanceMode: true,
      enableBranching: true
    });
    
    expect(engine.isPerformanceModeEnabled()).toBe(true);
    expect(engine.isBranchingEnabled()).toBe(true);
  });
});
```

#### Integration Tests

```typescript
// tests/integration/frameworks/react.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { StoryComponent } from '../../../examples/react/StoryComponent';
import { DEMO_STORY } from '../../../src/engine/demo-story';

describe('React Integration', () => {
  it('should render story and handle choices', () => {
    render(<StoryComponent story={DEMO_STORY} />);
    
    // Check initial state
    expect(screen.getByText(/welcome to the demo/i)).toBeInTheDocument();
    
    // Make a choice
    const firstChoice = screen.getByText(/explore the forest/i);
    fireEvent.click(firstChoice);
    
    // Verify navigation
    expect(screen.getByText(/you enter the dark forest/i)).toBeInTheDocument();
  });
});
```

#### Performance Tests

```typescript
// tests/performance/state-transitions.test.ts
import { createQNCEEngine } from '../../src/engine/core';
import { generateLargeStory } from '../fixtures/large-story';

describe('State Transition Performance', () => {
  it('should complete transitions within target time', () => {
    const largeStory = generateLargeStory(1000); // 1000 nodes
    const engine = createQNCEEngine(largeStory, {
      enablePerformanceMode: true
    });

    const measurements: number[] = [];
    
    // Measure 100 transitions
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();
      
      if (engine.getAvailableChoices().length > 0) {
        engine.makeChoice(0);
      }
      
      const endTime = performance.now();
      measurements.push(endTime - startTime);
    }

    const avgTime = measurements.reduce((a, b) => a + b) / measurements.length;
    const maxTime = Math.max(...measurements);

    expect(avgTime).toBeLessThan(5); // 5ms average target
    expect(maxTime).toBeLessThan(20); // 20ms maximum target
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/engine/core.test.ts

# Run tests matching pattern
npm test -- --grep "branching"
```

## 📊 Performance Guidelines

### Performance Targets

All contributions should maintain or improve these performance targets:

| Metric | Target | Measurement |
|--------|--------|-------------|
| State Transitions | ≤5ms | Average over 100 operations |
| Flow Switches | ≤20ms | Average over 50 operations |
| Hot-reload Updates | <2ms | Single operation |
| Memory Usage | ≤50MB | Peak usage for typical story |
| Cache Hit Rate | ≥95% | Over 1000 operations |

### Performance Testing

```typescript
// Include performance assertions in relevant tests
it('should maintain performance targets', () => {
  const engine = createQNCEEngine(story, { enablePerformanceMode: true });
  
  // Warm up
  for (let i = 0; i < 10; i++) {
    engine.makeChoice(0);
    engine.reset();
  }
  
  // Measure
  const startTime = performance.now();
  engine.makeChoice(0);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(5);
});
```

### Memory Management

```typescript
// Check for memory leaks in long-running tests
it('should not leak memory during extended use', () => {
  const engine = createQNCEEngine(story);
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Simulate extended use
  for (let i = 0; i < 1000; i++) {
    engine.makeChoice(0);
    engine.reset();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
});
```

## 🎨 Code Style Guidelines

### TypeScript Standards

```typescript
// Use strict TypeScript configuration
// Prefer explicit types over 'any'
// Use meaningful interface and type names

// Good
interface StoryValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

function validateStory(story: QNCEStory): StoryValidationResult {
  // Implementation
}

// Bad
function validate(story: any): any {
  // Implementation
}
```

### File Organization

```
src/
├── engine/              # Core engine functionality
│   ├── core.ts         # Main engine class
│   ├── types.ts        # Type definitions
│   └── utils.ts        # Engine utilities
├── branching/          # Advanced branching system
│   ├── engine.ts       # Branching engine
│   ├── ai.ts          # AI integration
│   └── models.ts      # Data models
├── performance/        # Performance infrastructure
│   ├── monitor.ts     # Performance monitoring
│   ├── pooling.ts     # Object pooling
│   └── profiler.ts    # Profiling tools
├── cli/               # Command-line tools
│   ├── audit.ts       # Story audit tool
│   ├── init.ts        # Project initialization
│   └── perf.ts        # Performance monitoring
└── utils/             # Shared utilities
    ├── validation.ts  # Validation functions
    └── helpers.ts     # Helper functions
```

### Naming Conventions

```typescript
// Classes: PascalCase
class QNCEEngine { }
class PerformanceMonitor { }

// Functions: camelCase
function createQNCEEngine() { }
function validateStory() { }

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_CACHE_SIZE = 100;
const MAX_STORY_NODES = 10000;

// Types/Interfaces: PascalCase
interface QNCEStory { }
type PerformanceMetrics = { }

// Variables: camelCase
const currentNode = engine.getCurrentNode();
const availableChoices = engine.getAvailableChoices();
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create an Issue** (for non-trivial changes)
   - Describe the problem or enhancement
   - Discuss the approach with maintainers
   - Get feedback before implementation

2. **Check Prerequisites**
   - [ ] All tests pass (`npm test`)
   - [ ] Code follows style guidelines (`npm run lint`)
   - [ ] Documentation is updated
   - [ ] Performance benchmarks pass (`npm run benchmark`)

3. **Update Documentation**
   - [ ] Update README.md if needed
   - [ ] Update API documentation
   - [ ] Add/update examples
   - [ ] Update migration guides for breaking changes

### PR Template

Use our [Pull Request Template](https://github.com/ByteSower/qnce-engine/blob/main/.github/pull_request_template.md) which includes:

- **Description**: Clear explanation of changes
- **Type of Change**: Bug fix, feature, documentation, etc.
- **Testing**: How the changes were tested
- **Performance Impact**: Any performance considerations
- **Breaking Changes**: Migration guide if applicable

### PR Review Process

1. **Automated Checks**
   - CI/CD pipeline runs all tests
   - Code quality checks
   - Performance regression tests
   - Security scans

2. **Manual Review**
   - Code quality and style
   - Architecture and design
   - Test coverage and quality
   - Documentation completeness
   - Performance impact

3. **Approval and Merge**
   - At least one maintainer approval required
   - All checks must pass
   - Squash and merge for clean history

## 🌟 Recognition

Contributors are recognized in several ways:

### Contributors Section

All contributors are listed in the project README with links to their profiles and contributions.

### Release Notes

Significant contributions are highlighted in release notes with contributor attribution.

### Hall of Fame

Regular contributors may be invited to join the project's Hall of Fame, recognizing ongoing contributions to the project.

## 🚀 Advanced Contributing

### Becoming a Maintainer

Regular contributors who demonstrate:
- Consistent high-quality contributions
- Good understanding of project architecture
- Helpful community engagement
- Commitment to project goals

May be invited to become maintainers with additional responsibilities:
- Code review privileges
- Release management
- Community management
- Architecture decisions

### Core Development Areas

If you're interested in contributing to specific areas:

#### Core Engine
- State management optimization
- Choice evaluation performance
- Memory management
- Error handling

#### Branching System
- AI integration improvements
- Dynamic content generation
- Analytics and tracking
- Multi-user scenarios

#### Performance Infrastructure
- Object pooling optimizations
- Background processing
- Hot-reload improvements
- Profiling tools

#### Developer Experience
- CLI tool enhancements
- Framework integrations
- Documentation improvements
- Example applications

## 🤝 Community Guidelines

### Communication

- **Be respectful**: Treat all community members with respect
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that people have different experience levels
- **Be inclusive**: Welcome newcomers and help them get started

### Getting Help

- **GitHub Discussions**: General questions and community discussion
- **GitHub Issues**: Bug reports and feature requests
- **Discord** (coming soon): Real-time chat with other contributors

### Mentorship

We encourage experienced contributors to mentor newcomers:
- Help with first contributions
- Provide code review feedback
- Share knowledge and best practices
- Guide architectural decisions

---

## 📍 Wiki Navigation

**← Previous:** [API Reference](API-Reference) | **You are here:** Contributing | **Next:** [Release Notes →](Release-Notes)

**All Pages:** [Home](Home) • [Getting Started](Getting-Started) • [Branching Guide](Branching-Guide) • [Performance Tuning](Performance-Tuning) • [CLI Usage](CLI-Usage) • [API Reference](API-Reference) • **Contributing** • [Release Notes](Release-Notes)

---

*This documentation is maintained for QNCE Engine v1.2.2 with complete advanced feature set including Choice Validation, State Persistence, Conditional Choices, Autosave & Undo/Redo, and UI Components.*
