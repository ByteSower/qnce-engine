// QNCE Branching Demo - JavaScript Quick Start
// Demonstrates v1.2.0 Advanced Branching API integration

const { createQNCEEngine } = require('../dist/engine/core');

console.log('🚀 QNCE Engine v1.2.0 - Advanced Branching Demo');
console.log('=================================================\n');

// Create a simple story for demonstration
const simpleStory = {
  nodes: [
    {
      id: 'start',
      text: 'You discover a mysterious quantum portal. What do you do?',
      choices: [
        {
          text: 'Step through the portal',
          nextNodeId: 'portal-world',
          flagEffects: { courage: 5, portal_used: true }
        },
        {
          text: 'Study the portal carefully',
          nextNodeId: 'study-portal',
          flagEffects: { wisdom: 5, careful: true }
        }
      ]
    },
    {
      id: 'portal-world',
      text: 'You emerge in a strange quantum realm where multiple realities overlap.',
      choices: []
    },
    {
      id: 'study-portal',
      text: 'Your careful study reveals ancient quantum equations etched around the portal\'s edge.',
      choices: []
    }
  ],
  initialNodeId: 'start'
};

// Create the QNCE engine
console.log('✅ Creating QNCE Engine...');
const engine = createQNCEEngine(simpleStory);

// Display current state
console.log('📖 Current Story Node:');
console.log('  ' + engine.getCurrentNode().text);

console.log('\n🎯 Available Choices:');
const choices = engine.getAvailableChoices();
choices.forEach((choice, i) => {
  console.log(`  ${i + 1}. ${choice.text}`);
});

// Make a choice automatically for demo
if (choices.length > 0) {
  console.log('\n🚀 Making choice: "' + choices[0].text + '"');
  engine.selectChoice(choices[0]);
  
  console.log('\n📖 New Story Node:');
  console.log('  ' + engine.getCurrentNode().text);
  
  console.log('\n🏴 Updated Flags:');
  const flags = engine.getFlags();
  Object.entries(flags).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n📚 Choice History:');
  const history = engine.getHistory();
  history.forEach((nodeId, i) => {
    console.log(`  ${i + 1}. ${nodeId}`);
  });
}

console.log('\n🎉 Demo Complete!');
console.log('=================');
console.log('✅ QNCE Engine v1.2.0 basic functionality working');
console.log('📚 For advanced branching features, see TypeScript examples');
console.log('🔗 Advanced features: AI generation, dynamic branches, analytics');
console.log('\n🚀 Ready for your interactive narratives!');
