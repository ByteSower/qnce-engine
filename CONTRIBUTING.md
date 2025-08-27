# Contributing to QNCE Engine 🤝

Thank you for your interest in contributing to the Quantum Narrative Convergence Engine! This guide will help you get started with contributing to this project.

## 🎯 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🔒 Security

Security is a priority for QNCE Engine. Please review our [Security Policy](SECURITY.md) before contributing. If you discover a security vulnerability, please report it privately through [GitHub Security Advisories](https://github.com/ByteSower/qnce-engine/security/advisories/new) rather than through public issues.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/qnce-engine.git
   cd qnce-engine
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```
5. **Run tests:**
   ```bash
   npm test
   ```

## 🛠️ Development Workflow

### Setting Up Your Development Environment

1. **Node.js Requirements:** Node.js 16+ is required
2. **IDE Setup:** We recommend VS Code with TypeScript support
3. **Git Configuration:** Ensure your Git is configured with your name and email

### Making Changes

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards

3. **Test your changes:**
   ```bash
   npm test                    # Run all tests
   npm run test:watch         # Run tests in watch mode
   npm run test:coverage      # Run tests with coverage
   ```

4. **Build and verify:**
   ```bash
   npm run build              # Build the project
   npm run demo:quickstart    # Test the quickstart demo
   ```

## 📋 Types of Contributions

We welcome many different types of contributions:

### 🐛 Bug Reports
- Use the bug report template
- Include clear reproduction steps
- Provide environment details
- Include relevant error messages

### ✨ Feature Requests
- Use the feature request template
- Explain the use case and rationale
- Consider backward compatibility
- Discuss API design implications

### 📚 Documentation
- Fix typos and clarify explanations
- Add usage examples
- Improve API documentation
- Update guides and tutorials

### 🧪 Tests
- Add test coverage for existing features
- Write tests for edge cases
- Improve test performance
- Add integration tests

### ⚡ Performance Improvements
- Profile before and after changes
- Document performance impact
- Maintain backward compatibility
- Include benchmarks

## 🎨 Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Document complex types with JSDoc
- Prefer explicit types over `any`

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing naming conventions

### Example Code Style
```typescript
/**
 * Creates a new QNCE engine instance with the provided story data.
 * 
 * @param story - The story data to load
 * @param options - Configuration options for the engine
 * @returns A new QNCEEngine instance
 */
export function createQNCEEngine(
  story: QNCEStory,
  options: QNCEEngineOptions = {}
): QNCEEngine {
  // Implementation here
}
```

### Commit Message Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

feat(engine): add AI-driven branch generation
fix(cli): resolve audit command hanging issue
docs(readme): update installation instructions
perf(core): optimize state transition performance
test(branching): add comprehensive branching tests
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

## 🧪 Testing Guidelines

### Test Structure
- Unit tests for individual functions/classes
- Integration tests for feature workflows
- Performance tests for critical paths
- End-to-end tests for CLI tools

### Writing Tests
```typescript
import { createQNCEEngine } from '../src/index';
import { DEMO_STORY } from '../src/engine/demo-story';

describe('QNCEEngine', () => {
  describe('Core Functionality', () => {
    it('should create engine with valid story', () => {
      const engine = createQNCEEngine(DEMO_STORY);
      expect(engine.getCurrentNode()).toBeDefined();
      expect(engine.getCurrentNode().id).toBe('start');
    });
  });
});
```

### Performance Testing
- Include performance assertions for critical paths
- Document performance targets
- Use consistent benchmarking methodology

## 📊 Performance Considerations

When contributing, please consider:

### Performance Targets
- State transitions: ≤5ms
- Flow switches: ≤20ms
- Hot-reload updates: <2ms
- Memory usage: ≤50MB for typical stories

### Performance Testing
```typescript
it('should complete state transitions within performance target', () => {
  const startTime = performance.now();
  engine.makeChoice(0);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(5); // 5ms target
});
```

## 🔄 Pull Request Process

1. **Create a clear PR title** following conventional commit format
2. **Fill out the PR template** completely
3. **Ensure all tests pass** and coverage is maintained
4. **Update documentation** if needed
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally

### PR Checklist
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Breaking changes documented
- [ ] Examples updated (if needed)

## 🏗️ Project Structure

```
qnce-engine/
├── src/                    # Source code
│   ├── engine/            # Core engine logic
│   ├── cli/               # CLI tools
│   └── utils/             # Utility functions
├── examples/              # Usage examples
├── scripts/               # Development scripts
├── tests/                 # Test suites
├── docs/                  # Documentation
└── dist/                  # Built output
```

## Release Process

For maintainers creating releases, please follow the standardized process documented in [`RELEASE-PROCESS.md`](./RELEASE-PROCESS.md). This ensures consistent versioning and smooth releases.

## 🤔 Questions or Need Help?

- **GitHub Discussions:** For questions and community discussion
- **GitHub Issues:** For bug reports and feature requests
- **Email:** Contact maintainers for sensitive issues

## 🎉 Recognition

Contributors are recognized in:
- Release notes
- README.md contributors section
- GitHub contributors page

## 📚 Resources

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Jest Testing Framework:** https://jestjs.io/docs/getting-started
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Semantic Versioning:** https://semver.org/

---

Thank you for contributing to QNCE Engine! Your efforts help make interactive storytelling better for everyone. 🎭✨
