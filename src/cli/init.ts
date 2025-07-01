#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * QNCE Init CLI Tool
 * Scaffolds a new QNCE story project
 */

function initProject(projectName: string): void {
  try {
    console.log(`🚀 Initializing QNCE project: ${projectName}`);
    
    // Create project directory
    mkdirSync(projectName, { recursive: true });
    
    // Create basic story template
    const storyTemplate = {
      initialNodeId: 'start',
      nodes: [
        {
          id: 'start',
          text: 'Welcome to your QNCE story! This is the beginning.',
          choices: [
            {
              text: 'Continue',
              nextNodeId: 'middle',
              flagEffects: { started: true }
            }
          ]
        },
        {
          id: 'middle',
          text: 'You are now in the middle of your story. Where do you want to go next?',
          choices: [
            {
              text: 'Go to the ending',
              nextNodeId: 'end',
              flagEffects: { visitedMiddle: true }
            },
            {
              text: 'Go back to start',
              nextNodeId: 'start',
              flagEffects: { wentBack: true }
            }
          ]
        },
        {
          id: 'end',
          text: 'Congratulations! You have reached the end of your story.',
          choices: []
        }
      ]
    };
    
    // Write story file
    const storyPath = join(projectName, 'story.json');
    writeFileSync(storyPath, JSON.stringify(storyTemplate, null, 2));
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: 'A QNCE interactive narrative',
      main: 'story.json',
      scripts: {
        audit: 'qnce-audit story.json'
      },
      dependencies: {
        'qnce-engine': '^0.1.0'
      }
    };
    
    const packagePath = join(projectName, 'package.json');
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    
    // Create README
    const readme = `# ${projectName}

A QNCE (Quantum Narrative Convergence Engine) interactive story.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Edit your story in \`story.json\`

3. Audit your story for issues:
   \`\`\`bash
   npm run audit
   \`\`\`

## Story Structure

Your story is defined in \`story.json\` with the following structure:

- \`initialNodeId\`: The starting node of your story
- \`nodes\`: Array of narrative nodes, each with:
  - \`id\`: Unique identifier
  - \`text\`: The narrative text
  - \`choices\`: Array of choices leading to other nodes

## Using QNCE Engine

\`\`\`javascript
import { createQNCEEngine, loadStoryData } from 'qnce-engine';
import storyData from './story.json';

const engine = createQNCEEngine(storyData);
const currentNode = engine.getCurrentNode();
console.log(currentNode.text);
\`\`\`

Happy storytelling!
`;
    
    const readmePath = join(projectName, 'README.md');
    writeFileSync(readmePath, readme);
    
    console.log(`✅ Project created successfully!`);
    console.log(`📁 Files created:`);
    console.log(`   - ${storyPath}`);
    console.log(`   - ${packagePath}`);
    console.log(`   - ${readmePath}`);
    console.log('');
    console.log(`🎯 Next steps:`);
    console.log(`   cd ${projectName}`);
    console.log(`   npm install`);
    console.log(`   npm run audit`);
    
  } catch (error) {
    console.error(`❌ Error creating project:`, error);
    process.exit(1);
  }
}

// CLI entry point
const projectName = process.argv[2];
if (!projectName) {
  console.log('Usage: qnce-init <project-name>');
  process.exit(1);
}

initProject(projectName);
