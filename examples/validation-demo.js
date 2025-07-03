#!/usr/bin/env node

// QNCE Choice Validation Demo
// Demonstrates the choice validation system with various error scenarios

import { 
  createQNCEEngine, 
  ChoiceValidationError, 
  isChoiceValidationError,
  createChoiceValidator,
  StandardValidationRules 
} from '../src/engine/core.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the validation demo story
const storyPath = path.join(__dirname, 'validation-demo-story.json');
const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));

console.log('🛡️ QNCE Choice Validation Demo');
console.log('=====================================\n');

// Create engine with demo story
const engine = createQNCEEngine(storyData);

function displayCurrentState() {
  const currentNode = engine.getCurrentNode();
  const availableChoices = engine.getAvailableChoices();
  
  console.log(`\n📍 Current Location: ${currentNode.id}`);
  console.log(`📝 ${currentNode.text}\n`);
  
  console.log('✅ Available Choices:');
  availableChoices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.text}`);
  });
  
  if (availableChoices.length === 0) {
    console.log('  (No choices available - story complete)');
  }
  
  // Show current state
  const state = engine.getState();
  console.log(`\n🏷️  Current Flags: ${JSON.stringify(state.flags, null, 2)}`);
}

function demonstrateValidationError(choiceIndex, errorType) {
  console.log(`\n❌ Testing ${errorType}...`);
  try {
    engine.makeChoice(choiceIndex);
    console.log('✅ Choice executed successfully (unexpected!)');
  } catch (error) {
    if (isChoiceValidationError(error)) {
      console.log(`🚫 ChoiceValidationError caught: ${error.message}`);
      console.log(`📋 Failed conditions: ${error.validationResult.failedConditions?.join(', ') || 'none'}`);
      
      const userMessage = error.getUserFriendlyMessage();
      console.log(`👤 User-friendly message:\n${userMessage}`);
      
      const debugInfo = error.getDebugInfo();
      console.log(`🔧 Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
    } else {
      console.log(`❗ Other error: ${error.message}`);
    }
  }
}

async function runDemo() {
  try {
    // Display initial state
    displayCurrentState();
    
    // Test 1: Try a valid choice first
    console.log('\n🧪 Test 1: Valid Choice');
    console.log('Attempting choice 1 (Try to force the door open)...');
    engine.makeChoice(0);
    displayCurrentState();
    
    // Reset to entrance
    engine.goToNodeById('entrance');
    displayCurrentState();
    
    // Test 2: Flag requirement failure
    console.log('\n🧪 Test 2: Flag Requirement Failure');
    demonstrateValidationError(1, 'missing flag requirement (hasGoldenKey)');
    
    // Test 3: Disabled choice
    console.log('\n🧪 Test 3: Disabled Choice');
    demonstrateValidationError(2, 'disabled choice');
    
    // Test 4: Inventory requirement failure
    console.log('\n🧪 Test 4: Inventory Requirement Failure');
    demonstrateValidationError(3, 'insufficient inventory (gold and reputation)');
    
    // Test 5: Time requirement failure
    console.log('\n🧪 Test 5: Time Requirement Failure');
    demonstrateValidationError(4, 'time condition not met');
    
    // Test 6: Out of bounds choice
    console.log('\n🧪 Test 6: Out of Bounds Choice');
    try {
      engine.makeChoice(99);
    } catch (error) {
      console.log(`🚫 Navigation error: ${error.message}`);
    }
    
    // Test 7: Add custom validation rule
    console.log('\n🧪 Test 7: Custom Validation Rule');
    const validator = engine.getChoiceValidator();
    validator.addRule({
      name: 'weather-safety',
      priority: 10,
      validate: (choice, context) => {
        if (choice.text.includes('outside') && !context.state.flags.hasUmbrella) {
          return {
            isValid: false,
            reason: 'Too dangerous to go outside without an umbrella!',
            failedConditions: ['no-umbrella'],
            suggestedChoices: context.currentNode.choices.filter(c => !c.text.includes('outside'))
          };
        }
        return { isValid: true };
      }
    });
    
    // This should now fail our custom rule
    console.log('Added custom weather-safety validation rule...');
    demonstrateValidationError(2, 'custom weather rule failure');
    
    // Test 8: Show successful path with proper flags
    console.log('\n🧪 Test 8: Successful Path with Flags');
    
    // Set up proper flags for success
    const state = engine.getState();
    state.flags.hasGoldenKey = true;
    state.flags.inventory = { gold: 100, reputation: 10 };
    
    console.log('Set hasGoldenKey=true and sufficient inventory...');
    displayCurrentState();
    
    console.log('Now attempting choice 2 (Use the golden key)...');
    engine.makeChoice(1); // This should work now
    displayCurrentState();
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\nKey takeaways:');
    console.log('- ChoiceValidationError provides rich error information');
    console.log('- Multiple validation rules can be applied in priority order');
    console.log('- Custom validation rules can be added for game-specific logic');
    console.log('- Flag, inventory, time, and enabled state validation work seamlessly');
    console.log('- Error messages are both user-friendly and developer-friendly');
    
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runDemo();
