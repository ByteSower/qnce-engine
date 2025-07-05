import { useEffect, useCallback } from 'react';
import { KeyboardShortcutsConfig } from '../types';
import { QNCEEngine } from '../../engine/core';

/**
 * useKeyboardShortcuts Hook
 * 
 * Provides keyboard shortcuts for common QNCE operations like undo/redo and autosave.
 * 
 * Features:
 * - Configurable key bindings
 * - Support for modifier keys (Ctrl, Alt, Shift, Meta)
 * - Automatic cleanup on unmount
 * - Prevention of default browser behavior
 * - Accessibility-friendly implementation
 * 
 * Default shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Cmd+Y / Ctrl+Shift+Z: Redo
 * - Ctrl+S / Cmd+S: Manual autosave
 * - Ctrl+R / Cmd+R: Reset narrative (disabled by default)
 */
export function useKeyboardShortcuts(
  engine: QNCEEngine,
  config: KeyboardShortcutsConfig = {}
): void {
  const {
    enabled = true,
    bindings = {
      undo: ['ctrl+z', 'cmd+z'],
      redo: ['ctrl+y', 'cmd+y', 'ctrl+shift+z'],
      save: ['ctrl+s', 'cmd+s'],
      reset: [] // Disabled by default for safety
    },
    preventDefault = true,
    target = document
  } = config;

  // Parse key combination string into components
  const parseKeyCombo = useCallback((combo: string) => {
    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);

    return {
      key,
      ctrl: modifiers.includes('ctrl'),
      alt: modifiers.includes('alt'),
      shift: modifiers.includes('shift'),
      meta: modifiers.includes('cmd') || modifiers.includes('meta')
    };
  }, []);

  // Check if a keyboard event matches a key combination
  const matchesKeyCombo = useCallback((event: KeyboardEvent, combo: string): boolean => {
    const parsed = parseKeyCombo(combo);
    
    return (
      event.key.toLowerCase() === parsed.key &&
      event.ctrlKey === parsed.ctrl &&
      event.altKey === parsed.alt &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta
    );
  }, [parseKeyCombo]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (!enabled || !engine) return;

    // Skip if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }

    let handled = false;

    // Check undo shortcuts
    for (const combo of bindings.undo || []) {
      if (matchesKeyCombo(keyboardEvent, combo)) {
        if (engine.canUndo()) {
          try {
            engine.undo();
          } catch (error) {
            console.error('[QNCE] Undo failed:', error);
          }
          handled = true;
          break;
        }
      }
    }

    // Check redo shortcuts
    if (!handled) {
      for (const combo of bindings.redo || []) {
        if (matchesKeyCombo(keyboardEvent, combo)) {
          if (engine.canRedo()) {
            try {
              engine.redo();
            } catch (error) {
              console.error('[QNCE] Redo failed:', error);
            }
            handled = true;
            break;
          }
        }
      }
    }

    // Check autosave shortcuts
    if (!handled) {
      for (const combo of bindings.save || []) {
        if (matchesKeyCombo(keyboardEvent, combo)) {
          engine.manualAutosave().catch((error) => {
            console.warn('[QNCE] Manual autosave failed:', error.message);
          });
          handled = true;
          break;
        }
      }
    }

    // Check reset shortcuts (if enabled)
    if (!handled && bindings.reset && bindings.reset.length > 0) {
      for (const combo of bindings.reset) {
        if (matchesKeyCombo(keyboardEvent, combo)) {
          // Add confirmation for reset to prevent accidental data loss
          if (window.confirm('Are you sure you want to reset the narrative? This will lose all progress.')) {
            try {
              engine.resetNarrative();
            } catch (error) {
              console.error('[QNCE] Reset failed:', error);
            }
            handled = true;
            break;
          }
        }
      }
    }

    // Prevent default browser behavior if we handled the event
    if (handled && preventDefault) {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
    }
  }, [enabled, engine, bindings, matchesKeyCombo, preventDefault]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!enabled || !target) return;

    const currentTarget = target as Document | HTMLElement;
    currentTarget.addEventListener('keydown', handleKeyDown);

    return () => {
      currentTarget.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, target, handleKeyDown]);

  // Log active shortcuts for debugging (development only)
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'production') return;

    const shortcuts = [];
    if (bindings.undo?.length) shortcuts.push(`Undo: ${bindings.undo.join(', ')}`);
    if (bindings.redo?.length) shortcuts.push(`Redo: ${bindings.redo.join(', ')}`);
    if (bindings.save?.length) shortcuts.push(`Save: ${bindings.save.join(', ')}`);
    if (bindings.reset?.length) shortcuts.push(`Reset: ${bindings.reset.join(', ')}`);

    if (shortcuts.length > 0) {
      console.log('[QNCE] Active keyboard shortcuts:', shortcuts.join(' | '));
    }
  }, [enabled, bindings]);
}
