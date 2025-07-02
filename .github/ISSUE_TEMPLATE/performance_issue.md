---
name: Performance Issue
about: Report a performance problem with QNCE Engine
title: '[PERF] '
labels: ['performance', 'needs-investigation']
assignees: ''
---

## ⚡ Performance Issue Report

### 📊 Performance Problem
A clear description of the performance issue you're experiencing.

### 🎯 Expected Performance
What performance were you expecting?
- **Target metric:** [e.g. <5ms state transitions, <20ms flow switches]
- **Expected behavior:** [e.g. Smooth real-time updates, No frame drops]

### 📉 Actual Performance
What performance are you actually seeing?
- **Measured metric:** [e.g. 50ms state transitions, 200ms flow switches]
- **Observable symptoms:** [e.g. UI lag, Memory leaks, High CPU usage]

### 🔬 Performance Measurements
Please provide specific measurements if available:

#### 📊 Timing Data
```
State Transition Time: X ms (target: ≤5ms)
Flow Switch Latency: X ms (target: ≤20ms) 
Hot-reload Update: X ms (target: <2ms)
Memory Usage: X MB (target: ≤50MB)
Cache Hit Rate: X% (target: ≥95%)
```

#### 🛠️ How Measured
- [ ] QNCE built-in performance monitoring (`qnce-perf`)
- [ ] Browser DevTools Performance tab
- [ ] Node.js performance monitoring
- [ ] Custom timing measurements
- [ ] Other: _______________

### 🖥️ Environment Details
- **QNCE Engine Version:** [e.g. v1.2.0]
- **Node.js Version:** [e.g. 18.15.0]
- **Framework:** [e.g. React 18, Vue 3, Node.js]
- **Performance Mode:** [Enabled/Disabled]
- **OS:** [e.g. macOS 13.4, Windows 11, Ubuntu 22.04]
- **Hardware:** [e.g. M1 MacBook Pro, Intel i7, ARM server]

### 📋 Story Characteristics
- **Story Size:** [e.g. 50 nodes, 200 choices, 10 flows]
- **Story Complexity:** [Simple linear, Multi-branched, Highly dynamic]
- **AI Features Used:** [Yes/No - which ones?]
- **Branching Features:** [Basic/Advanced/None]

### 🔄 Steps to Reproduce
Steps to reproduce the performance issue:
1. Load story with [characteristics]
2. Navigate to [specific section]
3. Perform [specific action]
4. Observe performance with [measurement method]

### 📊 Performance Profile
If you have performance profiling data, please attach:
- [ ] Browser DevTools performance recording
- [ ] Node.js profiler output
- [ ] QNCE performance metrics export
- [ ] Memory heap snapshots
- [ ] Other profiling data

### 🎮 Usage Pattern
- **Concurrent Users:** [if applicable]
- **Story Session Length:** [e.g. 5 minutes, 1 hour]
- **Update Frequency:** [e.g. Real-time, On user action]
- **Background Processing:** [Yes/No]

### 🔧 Configuration
Please share relevant configuration:

```typescript
// Engine configuration
const engineOptions = {
  enablePerformanceMode: true/false,
  enableBranching: true/false,
  // other options
};
```

### 🐛 Error Messages
Any related error messages or warnings:
```
[Error messages here]
```

### 💡 Potential Causes
If you have ideas about what might be causing the issue:
- [ ] Large story size
- [ ] Memory leaks
- [ ] Inefficient algorithms
- [ ] Excessive DOM updates
- [ ] Background processing overhead
- [ ] Other: _______________

### 🛠️ Workarounds
Any workarounds you've found:
- Workaround 1
- Workaround 2

### 📈 Impact Assessment
**Severity:** [Low/Medium/High/Critical]
**Affected Users:** [Just me/Some users/Many users/All users]
**Business Impact:** [None/Minor/Moderate/Severe]

---

**Note:** Performance issues are prioritized based on impact and reproducibility. Please provide as much detail as possible to help us investigate.
