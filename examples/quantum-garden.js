// Example: Complete QNCE Engine Integration
import { createQNCEEngine } from '../dist/index.js';

// Define a custom story
const customStory = {
  initialNodeId: "garden_entrance",
  nodes: [
    {
      id: "garden_entrance",
      text: "You approach a shimmering garden where flowers exist in quantum superposition, both blooming and wilted until observed. What do you do?",
      choices: [
        {
          text: "Observe the flowers carefully",
          nextNodeId: "collapsed_garden",
          flagEffects: { flowersObserved: true }
        },
        {
          text: "Enter with eyes closed",
          nextNodeId: "superposition_garden",
          flagEffects: { preservedSuperposition: true }
        }
      ]
    },
    {
      id: "collapsed_garden",
      text: "Your observation collapses the quantum state. The flowers are now definitively wilted, their beauty lost to the measurement.",
      choices: [
        {
          text: "Plant new seeds",
          nextNodeId: "rebirth",
          flagEffects: { plantedSeeds: true }
        }
      ]
    },
    {
      id: "superposition_garden",
      text: "Moving blindly, you preserve the flowers' superposition. You feel their quantum essence - simultaneously beautiful and decayed.",
      choices: [
        {
          text: "Meditate in the quantum space",
          nextNodeId: "enlightenment",
          flagEffects: { achievedEnlightenment: true }
        }
      ]
    },
    {
      id: "rebirth",
      text: "Your seeds grow instantly, creating new quantum flowers. The cycle begins anew.",
      choices: []
    },
    {
      id: "enlightenment",
      text: "You achieve quantum consciousness, understanding that observation and preservation can coexist.",
      choices: []
    }
  ]
};

// Create and use the engine
const engine = createQNCEEngine(customStory);

// Interactive session example
function playSession() {
  console.log(`🌟 Welcome to "The Quantum Garden"`);
  console.log(`📖 A tale of superposition and choice\n`);
  
  while (true) {
    const node = engine.getCurrentNode();
    console.log(`📍 ${node.text}\n`);
    
    const choices = engine.getAvailableChoices();
    if (choices.length === 0) {
      console.log("🏁 Story Complete!");
      console.log("Final state:", engine.getFlags());
      break;
    }
    
    // Display choices
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.text}`);
    });
    
    // For demo, select first choice
    const selected = choices[0];
    console.log(`\n➡️  Selecting: "${selected.text}"\n`);
    engine.selectChoice(selected);
    
    // Show state changes
    const flags = engine.getFlags();
    if (Object.keys(flags).length > 0) {
      console.log("🏷️  Updated flags:", flags, "\n");
    }
    
    console.log("---\n");
  }
}

// Run the demo
playSession();
