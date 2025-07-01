#!/usr/bin/env node

import { readFileSync } from 'fs';
import { loadStoryData } from '../engine/core.js';

/**
 * QNCE Audit CLI Tool
 * Validates narrative structure and checks for loops, dead ends, etc.
 */

function auditStory(filePath: string): void {
  try {
    console.log(`🔍 Auditing QNCE story: ${filePath}`);
    
    const jsonData = JSON.parse(readFileSync(filePath, 'utf-8'));
    const storyData = loadStoryData(jsonData);
    
    // Basic validation
    console.log(`📖 Story contains ${storyData.nodes.length} nodes`);
    console.log(`🚀 Initial node: ${storyData.initialNodeId}`);
    
    // Check for missing nodes
    const nodeIds = new Set(storyData.nodes.map(n => n.id));
    const referencedIds = new Set<string>();
    
    storyData.nodes.forEach(node => {
      node.choices.forEach(choice => {
        referencedIds.add(choice.nextNodeId);
      });
    });
    
    // Find dead ends
    const deadEnds = storyData.nodes.filter(node => node.choices.length === 0);
    console.log(`🔚 Dead ends found: ${deadEnds.length}`);
    deadEnds.forEach(node => console.log(`   - ${node.id}: "${node.text.slice(0, 50)}..."`));
    
    // Find missing node references
    const missingNodes = Array.from(referencedIds).filter(id => !nodeIds.has(id));
    if (missingNodes.length > 0) {
      console.log(`❌ Missing nodes referenced:`);
      missingNodes.forEach(id => console.log(`   - ${id}`));
    } else {
      console.log(`✅ All node references are valid`);
    }
    
    // Find unreachable nodes
    const reachableIds = new Set<string>();
    const toVisit = [storyData.initialNodeId];
    
    while (toVisit.length > 0) {
      const currentId = toVisit.pop()!;
      if (reachableIds.has(currentId)) continue;
      
      reachableIds.add(currentId);
      const node = storyData.nodes.find(n => n.id === currentId);
      if (node) {
        node.choices.forEach(choice => {
          if (!reachableIds.has(choice.nextNodeId)) {
            toVisit.push(choice.nextNodeId);
          }
        });
      }
    }
    
    const unreachableNodes = storyData.nodes.filter(node => !reachableIds.has(node.id));
    if (unreachableNodes.length > 0) {
      console.log(`⚠️  Unreachable nodes found: ${unreachableNodes.length}`);
      unreachableNodes.forEach(node => console.log(`   - ${node.id}`));
    } else {
      console.log(`✅ All nodes are reachable`);
    }
    
    console.log(`✨ Audit complete!`);
    
  } catch (error) {
    console.error(`❌ Error auditing story:`, error);
    process.exit(1);
  }
}

// CLI entry point
const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: qnce-audit <story-file.json>');
  process.exit(1);
}

auditStory(filePath);
