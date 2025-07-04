import { DEMO_STORY } from '../src/engine/demo-story';
import { writeFileSync } from 'fs';
import { join } from 'path';

const jsonStory = JSON.stringify(DEMO_STORY, null, 2);
const outputPath = join(__dirname, '..', 'demo-story.json');
writeFileSync(outputPath, jsonStory);

console.log(`Story converted to JSON at ${outputPath}`);
