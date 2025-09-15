#!/usr/bin/env node

/* CLI logger integration replaces most console usage (remaining direct stdout writes are intentional). */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { createQNCEEngine, loadStoryData } from '../engine/core.js';
import { createTelemetry, createTelemetryAdapter } from '../telemetry/core.js';
import { createStorageAdapter } from '../persistence/StorageAdapters.js';
import { DEMO_STORY } from '../engine/demo-story.js';
import { createLogger, deriveLogLevel, Logger } from '../utils/logger';

/**
 * QNCE Interactive CLI Tool
 * Play through QNCE stories with undo/redo functionality
 */

interface InteractiveSession {
  engine: ReturnType<typeof createQNCEEngine>;
  rl: ReturnType<typeof createInterface>;
  telemetry?: ReturnType<typeof createTelemetry>;
}

function displayNode(session: InteractiveSession): void {
  const { engine } = session;
  const currentNode = engine.getCurrentNode();
  const choices = engine.getAvailableChoices();
  const logger = (session as InteractiveSession & { logger: Logger }).logger;
  logger.info('\n' + '='.repeat(60));
  logger.info(currentNode.text);
  logger.info('='.repeat(60));
  
  if (choices.length > 0) {
    logger.info('\nChoices:');
    choices.forEach((choice, index) => {
      logger.info(`${index + 1}. ${choice.text}`);
    });
  } else {
    logger.info('\n[Story Complete]');
  }
  
  // Show undo/redo status
  const undoCount = engine.getUndoCount();
  const redoCount = engine.getRedoCount();
  logger.info(`\nUndo: ${undoCount} available | Redo: ${redoCount} available`);
}

function displayHelp(logger = createLogger()): void {
  logger.info('\nCommands:');
  logger.info('  1-9     : Select choice by number');
  logger.info('  u, undo : Undo last action');
  logger.info('  r, redo : Redo last undone action');
  logger.info('  h, help : Show this help');
  logger.info('  s, save : Save current state');
  logger.info('  l, load : Load saved state');
  logger.info('  f, flags: Show current flags');
  logger.info('  hist    : Show history summary');
  logger.info('  q, quit : Exit the session');
}

function displayFlags(session: InteractiveSession): void {
  const { engine } = session;
  const flags = engine.getState().flags;
  const logger = (session as InteractiveSession & { logger: Logger }).logger;
  logger.info('\n--- Current Flags ---');
  if (Object.keys(flags).length === 0) {
    logger.info('No flags set');
  } else {
    Object.entries(flags).forEach(([key, value]) => {
      logger.info(`${key}: ${JSON.stringify(value)}`);
    });
  }
}

function displayHistory(session: InteractiveSession): void {
  const { engine } = session;
  const summary = engine.getHistorySummary();
  const logger = (session as InteractiveSession & { logger: Logger }).logger;
  logger.info('\n--- History Summary ---');
  logger.info(`Undo entries: ${summary.undoEntries.length}`);
  logger.info(`Redo entries: ${summary.redoEntries.length}`);
  
  if (summary.undoEntries.length > 0) {
    logger.info('\nRecent undo history:');
    summary.undoEntries.slice(-5).forEach((entry, index) => {
      logger.info(`  ${index + 1}. ${entry.action || 'Action'} (${entry.timestamp})`);
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
  (session as InteractiveSession & { logger: Logger }).logger.success(`State saved to ${saveFile}`);
      } catch (error: unknown) {
        const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : String(error);
  (session as InteractiveSession & { logger: Logger }).logger.error(`Failed to save state: ${msg}`);
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
  (session as InteractiveSession & { logger: Logger }).logger.success(`State loaded from ${loadFile}`);
        displayNode(session);
      } catch (error: unknown) {
        const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : String(error);
  (session as InteractiveSession & { logger: Logger }).logger.error(`Failed to load state: ${msg}`);
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
          (session as InteractiveSession & { logger: Logger }).logger.success(`Undid: ${undoResult.entry?.action || 'action'}`);
          displayNode(session);
        } else {
          (session as InteractiveSession & { logger: Logger }).logger.warn('Nothing to undo');
        }
        resolve(false);
        break;
        
      case 'r':
      case 'redo':
        const redoResult = engine.redo();
        if (redoResult.success) {
          (session as InteractiveSession & { logger: Logger }).logger.success(`Redid: ${redoResult.entry?.action || 'action'}`);
          displayNode(session);
        } else {
          (session as InteractiveSession & { logger: Logger }).logger.warn('Nothing to redo');
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
  (session as InteractiveSession & { logger: Logger }).logger.info('👋 Thanks for playing!');
        resolve(true);
        break;
        
      default:
  (session as InteractiveSession & { logger: Logger }).logger.warn('Unknown command. Type "help" for available commands.');
        resolve(false);
        break;
    }
  });
}

async function startInteractiveSession(session: InteractiveSession): Promise<void> {
  const { rl } = session;
  
  (session as InteractiveSession & { logger: Logger }).logger.info('🎮 QNCE Interactive Session Started');
  (session as InteractiveSession & { logger: Logger }).logger.info('Type "help" for available commands');
  
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
  const quiet = args.includes('--quiet');
  const verbose = args.includes('--verbose');
  const logger = createLogger({ level: deriveLogLevel({ quiet, verbose }) });
  
  if (args.includes('--help') || args.includes('-h')) {
  logger.info('QNCE Interactive CLI');
  logger.info('Usage: qnce-play [story-file.json] [--storage <type>] [--storage-prefix <p>] [--storage-dir <dir>] [--storage-db <name>] [--non-interactive] [--save-key <key>] [--load-key <key>] [--telemetry <console|file|none>] [--telemetry-file <path>] [--telemetry-sample <0..1>] [--telemetry-report] [--quiet|--verbose]');
  logger.info('');
  logger.info('If no story file is provided, the demo story will be used.');
  logger.info('');
  logger.info('Commands during play:');
  displayHelp(logger);
    return;
  }
  
  let storyData;
  // Parse args to find a positional story file (skip option values)
  const optsWithValue = new Set([
    '--storage',
    '--storage-prefix',
    '--storage-dir',
    '--storage-db',
    '--save-key',
    '--load-key',
    // telemetry flags with values
    '--telemetry',
    '--telemetry-file',
    '--telemetry-sample'
  ]);
  let storyFile: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('-')) {
      if (optsWithValue.has(a)) i++; // skip its value
      continue;
    }
    // first non-option token is treated as story file
    storyFile = a;
    break;
  }
  
  if (storyFile) {
    try {
  logger.info(`Loading story: ${storyFile}`);
      const jsonData = JSON.parse(readFileSync(storyFile, 'utf-8'));
      storyData = loadStoryData(jsonData);
    } catch (error: any) {
      logger.error(`Failed to load story file: ${error?.message || error}`);
      process.exit(1);
    }
  } else {
    logger.info('Using demo story');
    storyData = DEMO_STORY;
  }
  
  // Telemetry flags
  const telemetryIdx = args.indexOf('--telemetry');
  const telemetryKind = telemetryIdx >= 0 ? (args[telemetryIdx + 1] || 'none') : 'none';
  const telemetrySampleIdx = args.indexOf('--telemetry-sample');
  const telemetrySample = telemetrySampleIdx >= 0 ? Math.max(0, Math.min(1, parseFloat(args[telemetrySampleIdx + 1]))) : undefined;
  const telemetryFileIdx = args.indexOf('--telemetry-file');
  const telemetryPath = telemetryFileIdx >= 0 ? args[telemetryFileIdx + 1] : undefined;
  const telemetryReport = args.includes('--telemetry-report');

  let telemetry: ReturnType<typeof createTelemetry> | undefined;
  if (telemetryKind && telemetryKind !== 'none') {
    const adapter = telemetryKind === 'file' ? createTelemetryAdapter('file', { path: telemetryPath || 'qnce-telemetry.ndjson' }) : createTelemetryAdapter('console');
    telemetry = createTelemetry({ adapter, enabled: true, sampleRate: telemetrySample ?? (process.env.NODE_ENV === 'production' ? 0 : 0.25), defaultCtx: { engineVersion: '1.3.2', env: (process.env.NODE_ENV as any) || 'dev', sessionId: '' } });
  }

  const engine = createQNCEEngine(storyData, undefined, false, undefined, telemetry ? { telemetry, env: (process.env.NODE_ENV as any) || 'dev' } : undefined);

  // Storage adapter selection
  const storageIdx = args.indexOf('--storage');
  const storageType = storageIdx >= 0 ? args[storageIdx + 1] : undefined;
  if (storageType) {
    try {
      const adapterOptions: any = {};
      const idxPrefix = args.indexOf('--storage-prefix');
      if (idxPrefix >= 0) adapterOptions.prefix = args[idxPrefix + 1];
      const idxDir = args.indexOf('--storage-dir');
      if (idxDir >= 0) adapterOptions.directory = args[idxDir + 1];
      const idxDb = args.indexOf('--storage-db');
      if (idxDb >= 0) adapterOptions.databaseName = args[idxDb + 1];

      const adapter = createStorageAdapter(storageType as any, adapterOptions);
      (engine as any).attachStorageAdapter?.(adapter);
    logger.success(`Storage adapter attached: ${storageType}`);
    // Always print attachment line to stdout so tests relying on substring pass even in quiet
    } catch (e: any) {
  logger.error(`Failed to attach storage adapter '${storageType}': ${e?.message || e}`);
      process.exit(1);
    }
  }

  // Non-interactive mode for scripting/tests
  const nonInteractive = args.includes('--non-interactive');
  const saveKeyIdx = args.indexOf('--save-key');
  const saveKey = saveKeyIdx >= 0 ? args[saveKeyIdx + 1] : undefined;
  const loadKeyIdx = args.indexOf('--load-key');
  const loadKey = loadKeyIdx >= 0 ? args[loadKeyIdx + 1] : undefined;

  if (nonInteractive) {
    (async () => {
      try {
        if (loadKey) {
          if ((engine as any).loadFromStorage) {
            await (engine as any).loadFromStorage(loadKey);
            logger.success(`Loaded state from key '${loadKey}'`);
          } else {
            logger.warn('No storage adapter attached; cannot load');
          }
        }
        if (saveKey) {
          if ((engine as any).saveToStorage) {
            await (engine as any).saveToStorage(saveKey);
            logger.success(`Saved state to key '${saveKey}'`);
          } else {
            logger.warn('No storage adapter attached; cannot save');
          }
        }
        const summary: any = {
          currentNodeId: engine.getState().currentNodeId,
        };
        if ((engine as any).listStorageKeys) {
          try { summary.storageKeys = await (engine as any).listStorageKeys(); } catch {}
        }
  process.stdout.write(JSON.stringify(summary) + '\n');
          // If telemetry report requested in non-interactive mode, print it here before exit
          if (telemetry && telemetryReport) {
            await telemetry.flush();
            const s = telemetry.stats();
            logger.info('\nTelemetry Report');
            logger.info('----------------');
            logger.info(`queued : ${s.queued}`);
            logger.info(`sent   : ${s.sent}`);
            logger.info(`dropped:${s.dropped}`);
            if (typeof s.p50 === 'number' || typeof s.p95 === 'number') {
              logger.info(`p50 send latency: ${s.p50 ?? 'n/a'} ms`);
              logger.info(`p95 send latency: ${s.p95 ?? 'n/a'} ms`);
              logger.info('\nBatch send latency (ms):');
              logger.info(`p50: ${s.p50 ?? 'n/a'} | p95: ${s.p95 ?? 'n/a'}`);
            }
          }
        process.exit(0);
      } catch (error: unknown) {
        const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : String(error);
        logger.error(`Non-interactive run failed: ${msg}`);
        process.exit(1);
      }
    })();
    return;
  }
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const session: InteractiveSession & { logger: Logger } = Object.assign({ engine, rl, telemetry }, { logger });
  
  startInteractiveSession(session).catch((error: unknown) => {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : String(error);
    logger.error(`Session error: ${msg}`);
    process.exit(1);
  });

  // Print telemetry report on exit
  if (telemetry && telemetryReport) {
    process.on('beforeExit', async () => {
      await telemetry!.flush();
      const s = telemetry!.stats();
      // Minimal ASCII report
      logger.info('\nTelemetry Report');
      logger.info('----------------');
      logger.info(`queued : ${s.queued}`);
      logger.info(`sent   : ${s.sent}`);
      logger.info(`dropped:${s.dropped}`);
      if (typeof s.p50 === 'number' || typeof s.p95 === 'number') {
        logger.info(`p50 send latency: ${s.p50 ?? 'n/a'} ms`);
        logger.info(`p95 send latency: ${s.p95 ?? 'n/a'} ms`);
      }
      if (typeof s.p50 === 'number' || typeof s.p95 === 'number') {
        logger.info('\nBatch send latency (ms):');
        logger.info(`p50: ${s.p50 ?? 'n/a'} | p95: ${s.p95 ?? 'n/a'}`);
      }
    });
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('play.js')) {
  main();
}

export { main as playInteractive };
