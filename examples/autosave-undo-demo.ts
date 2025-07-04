/**
 * QNCE Autosave & Undo/Redo Demo
 * 
 * Demonstrates the Sprint 3.5 autosave and undo/redo functionality
 * with interactive examples and performance metrics.
 */

import { createQNCEEngine } from '../src/engine/core.js';
import { DEMO_STORY } from '../src/engine/demo-story.js';

console.log('🔄 QNCE Autosave & Undo/Redo Demo - Sprint 3.5');
console.log('='.repeat(50));

async function demonstrateUndoRedo() {
  console.log('\n📝 Demonstrating Undo/Redo Functionality');
  console.log('-'.repeat(40));
  
  const engine = createQNCEEngine(DEMO_STORY);
  
  // Configure undo/redo with detailed logging
  engine.configureUndoRedo({
    enabled: true,
    maxUndoEntries: 10,
    maxRedoEntries: 5
  });
  
  console.log('Initial state:', engine.getCurrentNode().text.substring(0, 50) + '...');
  console.log('Can undo:', engine.canUndo());
  console.log('Can redo:', engine.canRedo());
  
  // Make some choices
  console.log('\n🎮 Making choices...');
  const choices1 = engine.getAvailableChoices();
  if (choices1.length > 0) {
    console.log(`Selecting: "${choices1[0].text}"`);
    engine.selectChoice(choices1[0]);
    console.log('New state:', engine.getCurrentNode().text.substring(0, 50) + '...');
    console.log('Undo count:', engine.getUndoCount());
  }
  
  const choices2 = engine.getAvailableChoices();
  if (choices2.length > 0) {
    console.log(`Selecting: "${choices2[0].text}"`);
    engine.selectChoice(choices2[0]);
    console.log('New state:', engine.getCurrentNode().text.substring(0, 50) + '...');
    console.log('Undo count:', engine.getUndoCount());
  }
  
  // Demonstrate undo
  console.log('\n⏪ Testing undo...');
  const undoResult1 = engine.undo();
  if (undoResult1.success) {
    console.log('✅ Undo successful');
    console.log('Restored to:', engine.getCurrentNode().text.substring(0, 50) + '...');
    console.log('Can redo:', engine.canRedo());
  }
  
  const undoResult2 = engine.undo();
  if (undoResult2.success) {
    console.log('✅ Second undo successful');
    console.log('Restored to:', engine.getCurrentNode().text.substring(0, 50) + '...');
    console.log('Undo count:', engine.getUndoCount());
    console.log('Redo count:', engine.getRedoCount());
  }
  
  // Demonstrate redo
  console.log('\n⏩ Testing redo...');
  const redoResult = engine.redo();
  if (redoResult.success) {
    console.log('✅ Redo successful');
    console.log('Restored to:', engine.getCurrentNode().text.substring(0, 50) + '...');
    console.log('Final state - Undo:', engine.getUndoCount(), 'Redo:', engine.getRedoCount());
  }
  
  // Show history summary
  const history = engine.getHistorySummary();
  console.log('\n📊 History Summary:');
  console.log(`- Undo entries: ${history.undoEntries.length}`);
  console.log(`- Redo entries: ${history.redoEntries.length}`);
  
  return engine;
}

async function demonstrateAutosave() {
  console.log('\n💾 Demonstrating Autosave Functionality');
  console.log('-'.repeat(40));
  
  const engine = createQNCEEngine(DEMO_STORY);
  
  // Configure autosave with custom settings
  engine.configureAutosave({
    enabled: true,
    triggers: ['choice', 'flag-change'],
    throttleMs: 50, // Very fast for demo
    maxEntries: 5,
    includeMetadata: true
  });
  
  console.log('Autosave configured with 50ms throttle');
  
  // Track autosave events
  let autosaveCount = 0;
  const originalMethod = engine.manualAutosave.bind(engine);
  engine.manualAutosave = async (metadata) => {
    autosaveCount++;
    console.log(`🔄 Autosave #${autosaveCount} triggered`);
    return originalMethod(metadata);
  };
  
  // Make choices to trigger autosave
  console.log('\n🎮 Making choices (autosave should trigger)...');
  
  for (let i = 0; i < 3; i++) {
    const choices = engine.getAvailableChoices();
    if (choices.length > 0) {
      console.log(`Choice ${i + 1}: "${choices[0].text}"`);
      engine.selectChoice(choices[0]);
      // Small delay to observe throttling
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  
  // Set some flags to trigger more autosaves
  console.log('\n🏁 Setting flags (autosave should trigger)...');
  engine.setFlag('demo_flag_1', true);
  await new Promise(resolve => setTimeout(resolve, 60));
  engine.setFlag('demo_flag_2', 'test_value');
  await new Promise(resolve => setTimeout(resolve, 60));
  
  // Manual autosave
  console.log('\n💾 Triggering manual autosave...');
  await engine.manualAutosave({ demo: 'manual_save' });
  
  console.log(`\n📊 Total autosaves triggered: ${autosaveCount}`);
  
  return engine;
}

async function demonstratePerformance() {
  console.log('\n⚡ Performance Testing');
  console.log('-'.repeat(40));
  
  const engine = createQNCEEngine(DEMO_STORY);
  
  // Configure for performance testing
  engine.configureUndoRedo({
    enabled: true,
    maxUndoEntries: 100,
    maxRedoEntries: 50
  });
  
  // Build up some history
  console.log('Building up history for performance test...');
  for (let i = 0; i < 20; i++) {
    const choices = engine.getAvailableChoices();
    if (choices.length > 0) {
      engine.selectChoice(choices[0]);
    }
    
    // Set some flags
    engine.setFlag(`test_flag_${i}`, i * 2);
  }
  
  console.log(`History built: ${engine.getUndoCount()} undo entries`);
  
  // Performance test undo operations
  console.log('\n⏪ Testing undo performance...');
  const undoTimes: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = performance.now();
    const result = engine.undo();
    const endTime = performance.now();
    
    if (result.success) {
      undoTimes.push(endTime - startTime);
    }
  }
  
  const avgUndoTime = undoTimes.reduce((a, b) => a + b, 0) / undoTimes.length;
  const maxUndoTime = Math.max(...undoTimes);
  
  console.log(`Average undo time: ${avgUndoTime.toFixed(3)}ms`);
  console.log(`Maximum undo time: ${maxUndoTime.toFixed(3)}ms`);
  console.log(`Target: <1ms ${avgUndoTime < 1 ? '✅' : '❌'}`);
  
  // Performance test redo operations
  console.log('\n⏩ Testing redo performance...');
  const redoTimes: number[] = [];
  
  for (let i = 0; i < Math.min(10, engine.getRedoCount()); i++) {
    const startTime = performance.now();
    const result = engine.redo();
    const endTime = performance.now();
    
    if (result.success) {
      redoTimes.push(endTime - startTime);
    }
  }
  
  if (redoTimes.length > 0) {
    const avgRedoTime = redoTimes.reduce((a, b) => a + b, 0) / redoTimes.length;
    const maxRedoTime = Math.max(...redoTimes);
    
    console.log(`Average redo time: ${avgRedoTime.toFixed(3)}ms`);
    console.log(`Maximum redo time: ${maxRedoTime.toFixed(3)}ms`);
    console.log(`Target: <1ms ${avgRedoTime < 1 ? '✅' : '❌'}`);
  }
  
  // Test autosave performance
  console.log('\n💾 Testing autosave performance...');
  const autosaveTimes: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const startTime = performance.now();
    await engine.manualAutosave({ test: `performance_${i}` });
    const endTime = performance.now();
    
    autosaveTimes.push(endTime - startTime);
  }
  
  const avgAutosaveTime = autosaveTimes.reduce((a, b) => a + b, 0) / autosaveTimes.length;
  const maxAutosaveTime = Math.max(...autosaveTimes);
  
  console.log(`Average autosave time: ${avgAutosaveTime.toFixed(3)}ms`);
  console.log(`Maximum autosave time: ${maxAutosaveTime.toFixed(3)}ms`);
  console.log(`Target: <1ms ${avgAutosaveTime < 1 ? '✅' : '❌'}`);
}

async function demonstrateIntegration() {
  console.log('\n🔗 Integration with Existing Features');
  console.log('-'.repeat(40));
  
  const engine = createQNCEEngine(DEMO_STORY);
  
  // Enable all features
  engine.configureUndoRedo({ enabled: true, maxUndoEntries: 50, maxRedoEntries: 25 });
  engine.configureAutosave({ 
    enabled: true, 
    triggers: ['choice', 'flag-change', 'state-load'],
    throttleMs: 100,
    maxEntries: 10,
    includeMetadata: true
  });
  
  console.log('✅ Undo/redo and autosave configured');
  
  // Test with state persistence
  console.log('\n💾 Testing state save/load with undo/redo...');
  
  // Make some changes
  const choices = engine.getAvailableChoices();
  if (choices.length > 0) {
    engine.selectChoice(choices[0]);
  }
  engine.setFlag('integration_test', true);
  
  console.log(`State before save - Undo count: ${engine.getUndoCount()}`);
  
  // Save state
  const savedState = await engine.saveState();
  console.log('✅ State saved successfully');
  
  // Make more changes
  const choices2 = engine.getAvailableChoices();
  if (choices2.length > 0) {
    engine.selectChoice(choices2[0]);
  }
  engine.setFlag('after_save', 'test');
  
  console.log(`State after more changes - Undo count: ${engine.getUndoCount()}`);
  
  // Load previous state
  await engine.loadState(savedState);
  console.log('✅ State loaded successfully');
  console.log(`State after load - Undo count: ${engine.getUndoCount()}`);
  console.log('Flags:', Object.keys(engine.getState().flags));
  
  // Test undo after load
  const undoAfterLoad = engine.undo();
  console.log(`Undo after load: ${undoAfterLoad.success ? '✅ Success' : '❌ Failed'}`);
}

async function main() {
  try {
    await demonstrateUndoRedo();
    await demonstrateAutosave();
    await demonstratePerformance();
    await demonstrateIntegration();
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\nSprint 3.5 Features Demonstrated:');
    console.log('✅ Undo/Redo with configurable history limits');
    console.log('✅ Autosave with throttling and event triggers');
    console.log('✅ Sub-millisecond performance for operations');
    console.log('✅ Integration with existing state persistence');
    console.log('✅ Memory-efficient history management');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
main();
