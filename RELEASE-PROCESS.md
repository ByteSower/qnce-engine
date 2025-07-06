# QNCE Engine Release Process

This document outlines the standardized versioning and release process for the QNCE Engine to ensure consistency across all releases.

## Semantic Versioning Guidelines

We follow [Semantic Versioning (SemVer)](https://semver.org/) with the following rules:

### Version Bump Types

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| **Features** | Minor version | `1.2.1` → `1.3.0` |
| **Bug fixes/docs/metadata** | Patch version | `1.2.1` → `1.2.2` |
| **Breaking changes** | Major version | `1.2.1` → `2.0.0` |

### Examples

- ✅ **Minor (1.x → 1.x+1)**: New engine features, new CLI commands, enhanced APIs
- ✅ **Patch (1.x.x → 1.x.x+1)**: Bug fixes, documentation updates, metadata changes, dependency updates
- ✅ **Major (1.x.x → 2.0.0)**: Breaking API changes, removed features, incompatible changes

## Release Steps Checklist

Follow these steps in order for every release:

### 1. Pre-Release Validation
- [ ] All tests pass (`npm test`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Code coverage meets standards (`npm run test:coverage`)
- [ ] No TypeScript errors
- [ ] All examples work correctly

### 2. Documentation Updates
- [ ] Update `CHANGELOG.md` with new version section
- [ ] Update relevant files in `/wiki/` directory
- [ ] Update `README.md` if needed
- [ ] Verify all new features are documented

### 3. Version Bump
- [ ] Update `package.json` version field
- [ ] Ensure version follows SemVer guidelines above

### 4. Commit and Tag
- [ ] Commit changes with message: `chore(release): bump to x.y.z`
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push commit: `git push origin main`
- [ ] Push tag: `git push origin vX.Y.Z`

### 5. Publish
- [ ] Verify final build: `npm run build`
- [ ] Publish to NPM: `npm publish`
- [ ] Verify package is available: `npm view qnce-engine version`

### 6. Post-Release
- [ ] Create GitHub release with release notes
- [ ] Announce on relevant channels
- [ ] Update any dependent projects
- [ ] Close related issues/milestones

## Release Commands Reference

```bash
# Pre-release validation
npm test
npm run build
npm run test:coverage

# Version bump (choose one)
npm version patch  # for bug fixes/docs
npm version minor  # for new features
npm version major  # for breaking changes

# Manual tagging (if not using npm version)
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

# Publish
npm run build
npm publish

# Verify
npm view qnce-engine version
```

## Branch Strategy

- **main**: Production-ready code, protected branch
- **feature/**: Feature development branches
- **docs/**: Documentation update branches
- **hotfix/**: Critical bug fix branches

All releases are made from the `main` branch after proper testing and review.

## Notes

- Always test the published package in a clean environment before announcing
- Keep release notes focused on user-facing changes
- Consider backward compatibility when planning version bumps
- Document any migration steps needed for major versions

---

*This process was established on July 5, 2025 for QNCE Engine v1.2.1+*
