#!/usr/bin/env node

// Demo script to test the QNCE Engine
import { createQNCEEngine, DEMO_STORY } from './dist/index.js';

console.log('🚀 QNCE Engine Demo\n');

// Create engine instance
const engine = createQNCEEngine(DEMO_STORY);

// Display current state
console.log('📖 Current Story Node:');
console.log(engine.getCurrentNode().text);
console.log('');

console.log('🎯 Available Choices:');
const choices = engine.getAvailableChoices();
choices.forEach((choice, i) => {
  console.log(`${i + 1}. ${choice.text}`);
});
console.log('');

// Make a choice
if (choices.length > 0) {
  console.log(`✅ Selecting choice: "${choices[0].text}"`);
  engine.selectChoice(choices[0]);
  console.log('');
  
  console.log('📖 New Story Node:');
  console.log(engine.getCurrentNode().text);
  console.log('');
  
  console.log('🏁 Narrative Flags:');
  console.log(engine.getFlags());
  console.log('');
  
  console.log('📋 Choice History:');
  console.log(engine.getHistory());
}

console.log('\n✨ Demo complete!');
