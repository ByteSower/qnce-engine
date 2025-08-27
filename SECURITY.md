# Security Policy

## Reporting Security Vulnerabilities

The QNCE Engine team takes security seriously. We appreciate your efforts to responsibly disclose security vulnerabilities.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred): Use GitHub's private vulnerability reporting feature at:
   https://github.com/ByteSower/qnce-engine/security/advisories/new

2. **Email**: Send details to the maintainers via the repository's issue tracking system with "SECURITY" in the subject line.

### What to Include

When reporting a security vulnerability, please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Affected versions of QNCE Engine
- Any proof-of-concept code (if applicable)
- Suggested fixes or mitigations (if known)

### Response Timeline

- **Initial Response**: We aim to acknowledge security reports within 48 hours
- **Status Updates**: We will provide status updates at least every 7 days
- **Resolution**: We target resolving critical security issues within 30 days

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.3.x   | ✅ Current Stable  | TBD            |
| 1.2.x   | ✅ Security Only   | 2025-12-31     |
| 1.1.x   | ❌ End of Life     | 2025-08-25     |
| 1.0.x   | ❌ End of Life     | 2025-07-15     |

**Note**: We follow [Semantic Versioning](https://semver.org/). Security patches will be backported to supported versions when feasible.

## Security Considerations for QNCE Engine

### For Library Users

When using QNCE Engine in your applications, consider these security best practices:

#### 1. Input Validation
- **Story Data**: Always validate story JSON/data from untrusted sources
- **User Choices**: Validate choice selections against available options
- **Flag Values**: Sanitize flag values, especially when accepting user input

```typescript
// Example: Validate choice selection
const availableChoices = engine.getAvailableChoices();
const isValidChoice = availableChoices.some(choice => choice.id === userChoiceId);
if (!isValidChoice) {
  throw new Error('Invalid choice selection');
}
```

#### 2. State Serialization Security
- **Trusted Sources Only**: Only load serialized states from trusted sources
- **Integrity Validation**: Use QNCE's built-in checksum validation
- **Version Compatibility**: Verify state compatibility before loading

```typescript
// Example: Safe state loading with validation
const result = await engine.loadState(serializedState);
if (!result.success) {
  console.error('State loading failed:', result.error);
  // Handle the error appropriately
}
```

#### 3. Dynamic Content Generation
- **XSS Prevention**: Sanitize any user-generated content in story text
- **HTML Escaping**: Escape HTML when displaying dynamic narrative content
- **Content Security Policy**: Implement CSP when using QNCE in web applications

#### 4. CLI Tool Security
- **File Permissions**: Ensure proper file permissions when using QNCE CLI tools
- **Path Traversal**: Validate file paths in CLI operations
- **Untrusted Input**: Be cautious when processing story files from untrusted sources

### For Contributors

#### Code Security Guidelines
- Follow secure coding practices in TypeScript/JavaScript
- Validate all inputs, especially in public APIs
- Use TypeScript's strict mode for better type safety
- Regularly update dependencies and address security advisories

#### Testing Security
- Include security test cases for input validation
- Test with malformed or malicious story data
- Verify that error handling doesn't leak sensitive information
- Test state serialization/deserialization edge cases

## Known Security Considerations

### Current Protections

1. **Input Validation**: The engine validates story structure and choice selections
2. **State Integrity**: Serialized states include checksums for integrity verification
3. **Type Safety**: TypeScript provides compile-time type checking
4. **Dependency Security**: Regular dependency audits (npm audit shows 0 vulnerabilities)

### Areas of Focus

1. **Serialization**: State serialization/deserialization requires careful validation
2. **Dynamic Content**: AI-generated or dynamic content should be sanitized
3. **File Operations**: CLI tools perform file I/O that requires proper validation
4. **User Input**: Flag values and choice data from external sources need validation

## Security Features by Version

### v1.3.x (Current)
- ✅ Enhanced input validation for story imports
- ✅ Semantic validation for story structure
- ✅ Safe state serialization with integrity checks
- ✅ CLI input validation and path sanitization

### v1.2.2 (Security Release)
- ✅ Repository security audit completed
- ✅ Documentation sanitization
- ✅ Enhanced .gitignore protection
- ✅ Professional metadata standards

### v1.2.x
- ✅ State integrity validation with checksums
- ✅ Type-safe API with comprehensive TypeScript definitions
- ✅ Error handling with proper validation

## Dependencies

We regularly monitor our dependencies for security vulnerabilities:

- **Direct Dependencies**: Minimal surface area with well-maintained packages
- **Security Audits**: Automated npm audit in CI/CD pipeline
- **Updates**: Regular dependency updates following security advisories

Current status: ✅ No known vulnerabilities (as of latest npm audit)

## Compliance and Standards

- **Secure Development**: Following OWASP secure coding practices
- **Dependency Management**: Regular security audits and updates
- **Version Support**: Clear versioning and support lifecycle
- **Disclosure**: Responsible vulnerability disclosure process

## Additional Resources

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](https://github.com/ByteSower/qnce-engine/blob/main/.github/CODE_OF_CONDUCT.md)
- [Issue Templates](https://github.com/ByteSower/qnce-engine/issues/new/choose)
- [npm Security Best Practices](https://docs.npmjs.com/security)

---

**Last Updated**: August 27, 2025  
**Policy Version**: 1.0

For questions about this security policy, please create an issue or contact the maintainers through the repository.