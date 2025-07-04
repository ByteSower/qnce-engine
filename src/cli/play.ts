#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { createQNCEEngine, loadStoryData } from '../engine/core.js';
import { DEMO_STORY } from '../engine/demo-story.js';
import type { Choice } from '../engine/core.js';

/**
 * QNCE Interactive CLI Tool
 * Play through QNCE stories with undo/redo functionality
 */

interface InteractiveSession {
  engine: ReturnType<typeof createQNCEEngine>;
  rl: ReturnType<typeof createInterface>;
}

function displayNode(session: InteractiveSession): void {
  const { engine } = session;
  const currentNode = engine.getCurrentNode();
  const choices = engine.getAvailableChoices();
  
  console.log('\n' + '='.repeat(60));
  console.log(currentNode.text);
  console.log('='.repeat(60));
  
  if (choices.length > 0) {
    console.log('\nChoices:');
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.text}`);
    });
  } else {
    console.log('\n[Story Complete]');
  }
  
  // Show undo/redo status
  const undoCount = engine.getUndoCount();
  const redoCount = engine.getRedoCount();
  console.log(`\nUndo: ${undoCount} available | Redo: ${redoCount} available`);
}

function displayHelp(): void {
  console.log('\nCommands:');
  console.log('  1-9     : Select choice by number');
  console.log('  u, undo : Undo last action');
  console.log('  r, redo : Redo last undone action');
  console.log('  h, help : Show this help');
  console.log('  s, save : Save current state');
  console.log('  l, load : Load saved state');
  console.log('  f, flags: Show current flags');
  console.log('  hist    : Show history summary');
  console.log('  q, quit : Exit the session');
}

function displayFlags(session: InteractiveSession): void {
  const { engine } = session;
  const flags = engine.getState().flags;
  
  console.log('\n--- Current Flags ---');
  if (Object.keys(flags).length === 0) {
    console.log('No flags set');
  } else {
    Object.entries(flags).forEach(([key, value]) => {
      console.log(`${key}: ${JSON.stringify(value)}`);
    });
  }
}

function displayHistory(session: InteractiveSession): void {
  const { engine } = session;
  const summary = engine.getHistorySummary();
  
  console.log('\n--- History Summary ---');
  console.log(`Undo entries: ${summary.undoEntries.length}`);
  console.log(`Redo entries: ${summary.redoEntries.length}`);
  
  if (summary.undoEntries.length > 0) {
    console.log('\nRecent undo history:');
    summary.undoEntries.slice(-5).forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.action || 'Action'} (${entry.timestamp})`);
    });
  }
}

async function saveState(session: InteractiveSession): Promise<void> {
  const { engine, rl } = session;
  
  return new Promise((resolve) => {
    rl.question('Enter filename to save (or press Enter for default): ', async (filename) => {
      const saveFile = filename || 'qnce-save.json';
      
      try {
        const serializedState = await engine.saveState({
          includeFlowEvents: true
        });
        
        require('fs').writeFileSync(saveFile, JSON.stringify(serializedState, null, 2));
        console.log(`✅ State saved to ${saveFile}`);
      } catch (error: any) {
        console.error('❌ Failed to save state:', error?.message || error);
      }
      
      resolve();
    });
  });
}

async function loadState(session: InteractiveSession): Promise<void> {
  const { engine, rl } = session;
  
  return new Promise((resolve) => {
    rl.question('Enter filename to load (or press Enter for default): ', async (filename) => {
      const loadFile = filename || 'qnce-save.json';
      
      try {
        const data = readFileSync(loadFile, 'utf-8');
        const serializedState = JSON.parse(data);
        
        await engine.loadState(serializedState);
        console.log(`✅ State loaded from ${loadFile}`);
        displayNode(session);
      } catch (error: any) {
        console.error('❌ Failed to load state:', error?.message || error);
      }
      
      resolve();
    });
  });
}

function handleCommand(session: InteractiveSession, input: string): Promise<boolean> {
  const { engine } = session;
  const choices = engine.getAvailableChoices();
  
  return new Promise((resolve) => {
    const command = input.trim().toLowerCase();
    
    // Handle numeric choices
    const choiceNumber = parseInt(command);
    if (!isNaN(choiceNumber) && choiceNumber >= 1 && choiceNumber <= choices.length) {
      const selectedChoice = choices[choiceNumber - 1];
      engine.selectChoice(selectedChoice);
      displayNode(session);
      resolve(false);
      return;
    }
    
    // Handle text commands
    switch (command) {
      case 'u':
      case 'undo':
        const undoResult = engine.undo();
        if (undoResult.success) {
          console.log(`✅ Undid: ${undoResult.entry?.action || 'action'}`);
          displayNode(session);
        } else {
          console.log('❌ Nothing to undo');
        }
        resolve(false);
        break;
        
      case 'r':
      case 'redo':
        const redoResult = engine.redo();
        if (redoResult.success) {
          console.log(`✅ Redid: ${redoResult.entry?.action || 'action'}`);
          displayNode(session);
        } else {
          console.log('❌ Nothing to redo');
        }
        resolve(false);
        break;
        
      case 'h':
      case 'help':
        displayHelp();
        resolve(false);
        break;
        
      case 'f':
      case 'flags':
        displayFlags(session);
        resolve(false);
        break;
        
      case 'hist':
        displayHistory(session);
        resolve(false);
        break;
        
      case 's':
      case 'save':
        saveState(session).then(() => resolve(false));
        break;
        
      case 'l':
      case 'load':
        loadState(session).then(() => resolve(false));
        break;
        
      case 'q':
      case 'quit':
        console.log('👋 Thanks for playing!');
        resolve(true);
        break;
        
      default:
        console.log('❓ Unknown command. Type "help" for available commands.');
        resolve(false);
        break;
    }
  });
}

async function startInteractiveSession(session: InteractiveSession): Promise<void> {
  const { rl } = session;
  
  console.log('🎮 QNCE Interactive Session Started');
  console.log('Type "help" for available commands');
  
  // Configure undo/redo and autosave
  session.engine.configureUndoRedo({
    enabled: true,
    maxUndoEntries: 100,
    maxRedoEntries: 50
  });
  
  session.engine.configureAutosave({
    enabled: true,
    triggers: ['choice', 'flag-change'],
    throttleMs: 100,
    maxEntries: 20,
    includeMetadata: true
  });
  
  displayNode(session);
  
  const promptUser = async (): Promise<void> => {
    return new Promise((resolve) => {
      rl.question('\n> ', async (input) => {
        const shouldQuit = await handleCommand(session, input);
        if (shouldQuit) {
          rl.close();
          resolve();
        } else {
          await promptUser();
          resolve();
        }
      });
    });
  };
  
  await promptUser();
}

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('QNCE Interactive CLI');
    console.log('Usage: qnce-play [story-file.json]');
    console.log('');
    console.log('If no story file is provided, the demo story will be used.');
    console.log('');
    console.log('Commands during play:');
    displayHelp();
    return;
  }
  
  let storyData;
  const storyFile = args[0];
  
  if (storyFile) {
    try {
      console.log(`📖 Loading story: ${storyFile}`);
      const jsonData = JSON.parse(readFileSync(storyFile, 'utf-8'));
      storyData = loadStoryData(jsonData);
    } catch (error: any) {
      console.error(`❌ Failed to load story file: ${error?.message || error}`);
      process.exit(1);
    }
  } else {
    console.log('📖 Using demo story');
    storyData = DEMO_STORY;
  }
  
  const engine = createQNCEEngine(storyData);
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const session: InteractiveSession = { engine, rl };
  
  startInteractiveSession(session).catch((error) => {
    console.error('❌ Session error:', error.message);
    process.exit(1);
  });
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('play.js')) {
  main();
}

export { main as playInteractive };
