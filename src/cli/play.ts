#!/usr/bin/env node

import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { createQNCEEngine, loadStoryData, NarrativeNode, StoryData } from '../engine/core';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function playStory(filePath: string) {
  try {
    console.log(`▶️  Loading story: ${filePath}`);
    const storyContent = readFileSync(filePath, 'utf-8');
    const storyData: StoryData = loadStoryData(JSON.parse(storyContent));
    const engine = createQNCEEngine(storyData);

    console.log('🚀 Story started. Type "quit" to exit, "help" for commands.');

    let currentNode: NarrativeNode;

    while ((currentNode = engine.getCurrentNode()) && !engine.isComplete) {
      console.log('\n---\n');
      console.log(currentNode.text);
      console.log('\n');

      const choices = engine.getAvailableChoices();
      if (choices.length > 0) {
        choices.forEach((choice, index) => {
          console.log(`${index + 1}: ${choice.text}`);
        });
        console.log('\n');
      } else {
        console.log('✨ The end. ✨');
        break;
      }

      const answer = await prompt('Your choice? ');

      if (answer.toLowerCase() === 'quit') {
        break;
      }
      
      if (answer.toLowerCase() === 'help') {
        console.log('\nAvailable commands:');
        console.log('  <number>    - Make a choice');
        console.log('  goto <nodeId> - Go to a specific node');
        console.log('  flags       - Show current flags');
        console.log('  history     - Show navigation history');
        console.log('  help        - Show this help message');
        console.log('  quit        - Exit the story');
        continue;
      }

      if (answer.toLowerCase().startsWith('goto ')) {
        const nodeId = answer.split(' ')[1];
        try {
          engine.goToNodeById(nodeId);
          console.log(`🚀 Jumped to node: ${nodeId}`);
        } catch (e: unknown) {
          console.log(`❌ Error: ${(e as Error).message}`);
        }
        continue;
      }
      
      if (answer.toLowerCase() === 'flags') {
        console.log('🚩 Current flags:');
        console.log(engine.flags);
        continue;
      }
      
      if (answer.toLowerCase() === 'history') {
        console.log('📜 History:');
        console.log(engine.history.join(' -> '));
        continue;
      }

      const choiceIndex = parseInt(answer, 10) - 1;
      if (choiceIndex >= 0 && choiceIndex < choices.length) {
        engine.makeChoice(choiceIndex);
      } else {
        console.log('❌ Invalid choice. Please try again.');
      }
    }
  } catch (error: unknown) {
    console.error(`❌ Error playing story: ${(error as Error).message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: qnce-play <story-file.json>');
  process.exit(1);
}

playStory(filePath);
