## QNCE Engine Deprecation & Stability Policy

> Versioning follows Semantic Versioning and the project distinguishes between **Public Stable** and **Experimental (Opt‑in)** APIs.

### 1. API Classifications

| Classification | JSDoc Tag | Change Guarantees | Removal Window |
|----------------|-----------|-------------------|----------------|
| Stable (Public) | `@public` (implicit if untagged) | No breaking signature / behavior changes except in a MAJOR release | ≥ 1 minor cycle of advance notice |
| Experimental | `@experimental` | May change or be removed in any MINOR release; patch breaks avoided when feasible | No guarantee; best effort notice in CHANGELOG |

### 2. Deprecation Process (Stable APIs)
1. Mark with `@deprecated` + rationale & replacement.
2. Add CHANGELOG Unreleased entry under a `### Deprecated` section.
3. Maintain for ≥1 subsequent MINOR release (e.g. deprecated in 1.4.x earliest removal 1.5.0) unless next release is MAJOR.
4. Optionally emit one‑time dev `console.warn` (never in production builds) for high‑impact removals.
5. Remove in next MAJOR or after grace period if still MINOR and considered safe (rare).

### 3. Experimental APIs
Current experimental exports: FeatureFlags, Phase, Entangler, attachQuantumFeatures, Measurement, helper types (FeatureFlagKey, EntangleTransform, PhasePredicate, PhasePredicateContext).

Stabilization checklist:
- Real-world example(s)
- Performance baseline (latency & memory)
- Error modes documented
- ≥90% branch coverage
- DX review (naming + IntelliSense clarity)

### 4. SemVer Mapping
- PATCH: Fixes & docs. Experimental additions allowed. No stable breaking changes.
- MINOR: Additive stable features, experimental promotions, experimental breaking changes allowed.
- MAJOR: Removal of deprecated stable APIs, structural or contract changes.

### 5. Deprecation Annotation Template
```ts
/** @deprecated Use newMethod() – oldMethod will be removed in 2.0.0 */
export function oldMethod() {}
```
CHANGELOG snippet:
```
### Deprecated
- oldMethod(): scheduled removal in 2.0.0 – use newMethod()
```

### 6. Accidental Exposure
If an internal symbol is unintentionally exposed and adopted:
1. Mark `@experimental` + CHANGELOG note in next PATCH.
2. Decide within one MINOR to stabilize or remove.

### 7. Policy Evolution
This file may change in PATCH releases (meta only). Any reduction in guarantees is a MINOR with explicit CHANGELOG notice.

---
Questions? Open a Discussion tagged `api-governance`.
