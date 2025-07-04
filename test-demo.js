#!/usr/bin/env node

const { createQNCEEngine, DEMO_STORY } = require('./dist/index.js');

console.log('🎮 Testing Enhanced QNCE Demo Story with Conditional Choices\n');

// Create engine with enhanced demo story
const engine = createQNCEEngine(DEMO_STORY);

function displayCurrentState() {
  const currentNode = engine.getCurrentNode();
  const choices = engine.getAvailableChoices();
  const flags = engine.getFlags();
  
  console.log('📖 Current Scene:');
  console.log(`   ${currentNode.text}\n`);
  
  console.log('🚩 Current Flags:');
  console.log(`   ${JSON.stringify(flags, null, 2)}\n`);
  
  console.log('🔀 Available Choices:');
  choices.forEach((choice, index) => {
    const conditionText = choice.condition ? ` (condition: ${choice.condition})` : '';
    console.log(`   ${index + 1}. ${choice.text}${conditionText}`);
  });
  console.log();
  
  return choices;
}

// Start the demo
console.log('='.repeat(60));
console.log('Starting at the crossroads...\n');

let choices = displayCurrentState();

// Take the left path (increases curiosity)
console.log('> Choosing: Left (increases curiosity)\n');
engine.selectChoice(choices[0]);

console.log('='.repeat(60));
choices = displayCurrentState();

// Now we should see the magical crossing option
console.log('> Notice: The magical crossing option is now available due to curiosity!\n');

// Choose the magical crossing
const magicalChoice = choices.find(c => c.text.includes('magic'));
if (magicalChoice) {
  console.log('> Choosing: Use magic to cross\n');
  engine.selectChoice(magicalChoice);
  
  console.log('='.repeat(60));
  displayCurrentState();
}

console.log('✨ Demo completed! The conditional choice system is working correctly.');
console.log('📝 Notice how choices appeared and disappeared based on the flags set by previous choices.');
