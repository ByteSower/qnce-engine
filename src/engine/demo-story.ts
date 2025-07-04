import { StoryData } from './core.js';

// Demo narrative data for QNCE Engine
export const DEMO_STORY: StoryData = {
  initialNodeId: 'start',
  nodes: [
    {
      id: 'start',
      text: 'You stand at a crossroads in an ancient land. Mysterious energy flows through the air. Do you go left or right?',
      choices: [
        { text: 'Left', nextNodeId: 'river', flagEffects: { wentLeft: true, curiosity: 1 } },
        { text: 'Right', nextNodeId: 'mountain', flagEffects: { wentLeft: false, courage: 1 } },
      ],
    },
    {
      id: 'river',
      text: 'You encounter a rushing river. The water sparkles with an otherworldly light. Do you swim or build a raft?',
      choices: [
        { text: 'Swim', nextNodeId: 'swim', flagEffects: { gotWet: true, courage: 2 } },
        { text: 'Build a raft', nextNodeId: 'raft', flagEffects: { gotWet: false, patience: 1 } },
        { 
          text: 'Use magic to cross (requires curiosity)', 
          nextNodeId: 'magical_crossing', 
          flagEffects: { usedMagic: true, magicPower: 1 },
          condition: 'flags.curiosity >= 1'
        },
      ],
    },
    {
      id: 'mountain',
      text: 'You find a towering mountain shrouded in mist. Ancient runes glow faintly on its slopes. Do you climb or go around?',
      choices: [
        { text: 'Climb', nextNodeId: 'climb', flagEffects: { climbed: true, courage: 2 } },
        { text: 'Go around', nextNodeId: 'village', flagEffects: { climbed: false, patience: 1 } },
        {
          text: 'Study the runes (requires courage)',
          nextNodeId: 'rune_study',
          flagEffects: { studiedRunes: true, knowledge: 2 },
          condition: 'flags.courage >= 1'
        }
      ],
    },
    // --- Expanded Narrative Branches ---
    {
      id: 'magical_crossing',
      text: 'You focus your energy and step onto the water\'s surface. It holds! You walk across safely, your magical abilities awakened.',
      choices: [
        { text: 'Continue to the mystical grove', nextNodeId: 'mystical_grove', flagEffects: { discoveredGrove: true } },
      ],
    },
    {
      id: 'rune_study',
      text: 'The runes reveal ancient secrets of power. You feel wisdom flowing through you.',
      choices: [
        { text: 'Ascend the mountain with new knowledge', nextNodeId: 'peak_ascension', flagEffects: { enlightened: true } },
      ],
    },
    {
      id: 'swim',
      text: 'You swim across and reach the other side, but you are soaked and cold. Ahead, you see a cave and a campfire.',
      choices: [
        { text: 'Warm up by the campfire', nextNodeId: 'campfire', flagEffects: { warmedUp: true } },
        { text: 'Explore the cave', nextNodeId: 'cave', flagEffects: { exploredCave: true, curiosity: 1 } },
        {
          text: 'Use magic to dry yourself (requires magic power)',
          nextNodeId: 'magical_warmth',
          flagEffects: { magicallyDried: true },
          condition: 'flags.magicPower >= 1'
        }
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
      text: 'You enter a dense forest. The trees whisper ancient secrets. Multiple paths reveal themselves based on your journey.',
      choices: [
        { 
          text: 'Use the merchant\'s key (if you have it)', 
          nextNodeId: 'shortcut', 
          flagEffects: { usedKey: true },
          condition: 'flags.metMerchant'
        },
        { text: 'Push through the forest', nextNodeId: 'lost', flagEffects: { usedKey: false } },
        {
          text: 'Seek guidance from the spirits (requires wisdom)',
          nextNodeId: 'spirit_guidance',
          flagEffects: { talkedToSpirits: true },
          condition: 'flags.knowledge >= 2 || flags.studiedRunes'
        },
        {
          text: 'Use enhanced senses (requires multiple experiences)',
          nextNodeId: 'enhanced_path',
          flagEffects: { usedSenses: true },
          condition: 'flags.curiosity >= 1 && flags.courage >= 1'
        }
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
      text: 'You get lost in the forest. The paths seem to shift and change around you.',
      choices: [
        { text: 'Try to find your way back', nextNodeId: 'forest', flagEffects: { triedAgain: true } },
        {
          text: 'Meditate and center yourself (requires patience)',
          nextNodeId: 'inner_peace',
          flagEffects: { foundPeace: true },
          condition: 'flags.patience >= 1'
        }
      ],
    },
    // --- New Conditional Ending Nodes ---
    {
      id: 'mystical_grove',
      text: 'You discover a hidden grove where time seems to stand still. This is a sacred place of great power. (Magical Success!)',
      choices: [],
    },
    {
      id: 'peak_ascension',
      text: 'With ancient knowledge guiding you, you reach the mountain\'s peak and unlock the secrets of the realm. (Enlightened Success!)',
      choices: [],
    },
    {
      id: 'magical_warmth',
      text: 'Your magic flows through you, instantly drying your clothes and warming your body. You feel your power growing stronger. (Magical Mastery!)',
      choices: [],
    },
    {
      id: 'spirit_guidance',
      text: 'The forest spirits, impressed by your wisdom, guide you to a hidden sanctuary. (Spiritual Success!)',
      choices: [],
    },
    {
      id: 'enhanced_path',
      text: 'Your varied experiences have heightened your senses. You navigate the forest with ease and discover a treasure trove. (Master Explorer Success!)',
      choices: [],
    },
    {
      id: 'inner_peace',
      text: 'Through meditation, you find inner peace and the forest reveals its true beauty. You emerge transformed. (Peaceful Resolution!)',
      choices: [],
    },
  ],
};
