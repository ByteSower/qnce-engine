import { createQNCEEngine, DEMO_STORY } from '../src';
import { Checkpoint } from '../src/engine/types';

/**
 * Demonstrates the state persistence and checkpoint features of the QNCE Engine.
 * This example covers:
 * 1. Saving the complete narrative state.
 * 2. Loading that state into a new engine instance.
 * 3. Creating lightweight checkpoints for undo/redo functionality.
 * 4. Restoring the state from a checkpoint.
 */
async function runPersistenceDemo() {
  console.log('🚀 Starting QNCE Engine Persistence Demo 🚀\n');

  // 1. Initialize the engine and advance the story
  const engine = createQNCEEngine(DEMO_STORY);
  console.log('Initial Node:', engine.getCurrentNode().text);

  let choices = engine.getAvailableChoices();
  engine.selectChoice(choices[1]); // Choose "Examine the shimmering portal."
  console.log('\nChoice Made. Current Node:', engine.getCurrentNode().text);

  choices = engine.getAvailableChoices();
  engine.selectChoice(choices[0]); // Choose "Step through the portal."
  console.log('Choice Made. Current Node:', engine.getCurrentNode().text);
  console.log('Current Flags:', engine.getFlags());

  // 2. Create a checkpoint before making another choice
  console.log('\n💾 Creating a checkpoint...');
  const checkpoint = await engine.createCheckpoint('Before the final choice');
  console.log(`Checkpoint '${checkpoint.name}' created with ID: ${checkpoint.id}`);

  // 3. Save the complete engine state to a string
  console.log('\n💾 Saving engine state to JSON...');
  const savedState = await engine.saveState({ prettyPrint: true });
  const savedStateJSON = JSON.stringify(savedState);
  console.log('State saved successfully! Size:', savedStateJSON.length, 'bytes');
  // In a real application, you would store this JSON string in localStorage,
  // a file, or a remote database.

  // 4. Continue the story
  choices = engine.getAvailableChoices();
  engine.selectChoice(choices[0]);
  console.log('\nMade one more choice. Current Node:', engine.getCurrentNode().text);
  console.log('Final Flags:', engine.getFlags());


  // 5. Restore from the checkpoint to "undo" the last choice
  console.log(`\n🔄 Restoring from checkpoint '${checkpoint.name}'...`);
  await engine.restoreFromCheckpoint(checkpoint.id);
  console.log('State restored from checkpoint!');
  console.log('Current Node after restore:', engine.getCurrentNode().text);
  console.log('Flags after restore:', engine.getFlags());


  // 6. Create a new engine instance and load the saved state
  console.log('\n🔄 Creating a new engine and loading the saved state...');
  const newEngine = createQNCEEngine(DEMO_STORY);

  // The state can be loaded from a JSON string or a parsed object
  await newEngine.loadState(savedState);
  console.log('State loaded into new engine instance!');

  // 7. Verify that the state was restored correctly
  console.log('\n🔍 Verifying restored state...');
  console.log('Restored Node:', newEngine.getCurrentNode().text);
  console.log('Restored Flags:', newEngine.getFlags());
  console.log(
    'History length:',
    newEngine.getHistory().length,
    '| Expected:',
    2
  );

  const areFlagsEqual = JSON.stringify(engine.getFlags()) === JSON.stringify(newEngine.getFlags());
  console.log('Verification successful:', areFlagsEqual);


  console.log('\n✅ Persistence Demo Completed Successfully! ✅');
}

runPersistenceDemo().catch(error => {
  console.error('An error occurred during the persistence demo:', error);
});
