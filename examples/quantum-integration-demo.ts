// Example: Opt-in quantum helpers (FeatureFlags + attachQuantumFeatures)
// This demo is safe to run in Node or a browser bundler.

import { createQNCEEngine, type StoryData } from '../src/engine/core';
import { FeatureFlags } from '../src/quantum/flags';
import { Phase } from '../src/quantum/phase';
import { attachQuantumFeatures } from '../src/quantum/integration';

// Minimal story
const story: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You stand at a fork in the road.',
      choices: [
        { text: 'Take the left path', nextNodeId: 'left', flagEffects: { courage: 1 } },
        { text: 'Take the right path', nextNodeId: 'right', flagEffects: { wisdom: 1 } }
      ]
    },
    { id: 'left', text: 'The left path is quiet and calm.', choices: [] },
    { id: 'right', text: 'The right path is lively and bright.', choices: [] }
  ]
};

const engine = createQNCEEngine(story);

// Start with phases enabled, entanglement disabled
const flags = new FeatureFlags({ 'quantum.phases': true, 'quantum.entanglement': false });
const q = attachQuantumFeatures(engine, flags);

// Define a phase that activates when a flag is present
const bravePhase = new Phase('brave', ({ flags }) => Boolean(flags.courage));

console.log('Phase active before choice?', q.isPhaseActive(bravePhase)); // false

// Make a choice that sets courage
engine.makeChoice(0); // left path sets courage: 1

console.log('Phase active after choice?', q.isPhaseActive(bravePhase)); // true when quantum.phases enabled

// Toggle entanglement on and bind flags
q.flags.enable('quantum.entanglement');
q.entangle((e) => e.bind('courage', 'bravery'));

// After entanglement, downstream systems could read `bravery` too
const allFlags = engine.getFlags();
console.log('All flags (post-entangle):', allFlags);

// Detach when done (optional cleanup)
q.detach();
