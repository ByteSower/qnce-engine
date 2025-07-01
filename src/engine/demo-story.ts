import { StoryData } from './core.js';

// Demo narrative data for QNCE Engine
export const DEMO_STORY: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You stand at a crossroads. Do you go left or right?',
      choices: [
        { text: 'Left', nextNodeId: 'river', flagEffects: { wentLeft: true } },
        { text: 'Right', nextNodeId: 'mountain', flagEffects: { wentLeft: false } },
      ],
    },
    {
      id: 'river',
      text: 'You encounter a river. Do you swim or build a raft?',
      choices: [
        { text: 'Swim', nextNodeId: 'swim', flagEffects: { gotWet: true } },
        { text: 'Build a raft', nextNodeId: 'raft', flagEffects: { gotWet: false } },
      ],
    },
    {
      id: 'mountain',
      text: 'You find a mountain. Do you climb or go around?',
      choices: [
        { text: 'Climb', nextNodeId: 'climb', flagEffects: { climbed: true } },
        { text: 'Go around', nextNodeId: 'village', flagEffects: { climbed: false } },
      ],
    },
    // --- Expanded Narrative Branches ---
    {
      id: 'swim',
      text: 'You swim across and reach the other side, but you are soaked and cold. Ahead, you see a cave and a campfire.',
      choices: [
        { text: 'Warm up by the campfire', nextNodeId: 'campfire', flagEffects: { warmedUp: true } },
        { text: 'Explore the cave', nextNodeId: 'cave', flagEffects: { exploredCave: true } },
      ],
    },
    {
      id: 'raft',
      text: 'You build a raft and float safely. On the far bank, a merchant greets you.',
      choices: [
        { text: 'Trade with the merchant', nextNodeId: 'merchant', flagEffects: { metMerchant: true } },
        { text: 'Ignore and continue', nextNodeId: 'forest', flagEffects: { metMerchant: false } },
      ],
    },
    {
      id: 'climb',
      text: 'You climb and see a vast land. The wind is strong. Do you signal for help or descend?',
      choices: [
        { text: 'Signal for help', nextNodeId: 'signal', flagEffects: { signaled: true } },
        { text: 'Descend', nextNodeId: 'forest', flagEffects: { signaled: false } },
      ],
    },
    {
      id: 'village',
      text: 'You go around and find a village. The villagers are wary. Do you introduce yourself or sneak past?',
      choices: [
        { text: 'Introduce yourself', nextNodeId: 'welcome', flagEffects: { welcomed: true } },
        { text: 'Sneak past', nextNodeId: 'forest', flagEffects: { welcomed: false } },
      ],
    },
    // --- New Unique Outcomes & Entanglement ---
    {
      id: 'campfire',
      text: 'You warm up by the fire. A traveler offers you advice. (Success!)',
      choices: [],
    },
    {
      id: 'cave',
      text: 'Inside the cave, you find ancient markings. Suddenly, you slip and must return to the river bank. (Loop)',
      choices: [
        { text: 'Return to river', nextNodeId: 'river', flagEffects: { slipped: true } },
      ],
    },
    {
      id: 'merchant',
      text: 'The merchant gives you a mysterious key. (Reward!)',
      choices: [],
    },
    {
      id: 'forest',
      text: 'You enter a dense forest. If you met the merchant, you can unlock a shortcut.',
      choices: [
        { text: 'Use the key (if you have it)', nextNodeId: 'shortcut', flagEffects: { usedKey: true } },
        { text: 'Push through the forest', nextNodeId: 'lost', flagEffects: { usedKey: false } },
      ],
    },
    {
      id: 'signal',
      text: 'Your signal is seen! A rescue party arrives. (Success!)',
      choices: [],
    },
    {
      id: 'welcome',
      text: 'The villagers welcome you and offer food. (Success!)',
      choices: [],
    },
    {
      id: 'shortcut',
      text: 'You use the key to unlock a hidden path and escape the forest. (Success!)',
      choices: [],
    },
    {
      id: 'lost',
      text: 'You get lost in the forest. (Failure/Loop)',
      choices: [
        { text: 'Try to find your way back', nextNodeId: 'forest', flagEffects: { triedAgain: true } },
      ],
    },
  ],
};
