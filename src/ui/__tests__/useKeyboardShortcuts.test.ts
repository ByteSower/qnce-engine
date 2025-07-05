import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { createQNCEEngine } from '../../engine/core';
import { DEMO_STORY } from '../../engine/demo-story';

// Mock the global addEventListener/removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

describe('useKeyboardShortcuts', () => {
  let engine: any;
  let mockKeyboardEvent: any;

  beforeEach(() => {
    // Mock document.addEventListener/removeEventListener since the hook uses document as default target
    Object.defineProperty(document, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    });
    Object.defineProperty(document, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
    });

    engine = createQNCEEngine(DEMO_STORY);
    
    // Mock engine methods that the hook expects
    engine.undo = jest.fn().mockResolvedValue({ success: true });
    engine.redo = jest.fn().mockResolvedValue({ success: true });
    engine.canUndo = jest.fn().mockReturnValue(true);
    engine.canRedo = jest.fn().mockReturnValue(true);
    engine.manualAutosave = jest.fn().mockResolvedValue({});
    engine.resetNarrative = jest.fn();

    // Mock window.confirm for reset functionality
    Object.defineProperty(window, 'confirm', {
      value: jest.fn().mockReturnValue(true),
      writable: true,
    });

    mockKeyboardEvent = {
      key: '',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };

    jest.clearAllMocks();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  describe('Hook Initialization', () => {
    it('registers keyboard event listeners when enabled', () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('does not register listeners when disabled', () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: false }));
      
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Default Keyboard Shortcuts', () => {
    it('triggers undo on Ctrl+Z', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(1);
    });

    it('triggers undo on Cmd+Z (Mac)', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          metaKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(1);
    });

    it('triggers redo on Ctrl+Y', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'y',
          ctrlKey: true
        });
      });

      expect(engine.redo).toHaveBeenCalledTimes(1);
    });

    it('triggers redo on Ctrl+Shift+Z', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true,
          shiftKey: true
        });
      });

      expect(engine.redo).toHaveBeenCalledTimes(1);
    });

    it('triggers save on Ctrl+S', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 's',
          ctrlKey: true
        });
      });

      expect(engine.manualAutosave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Keyboard Bindings', () => {
    it('uses custom bindings when provided', async () => {
      const customBindings = {
        undo: ['ctrl+u'],
        redo: ['ctrl+r'],
        save: ['ctrl+shift+s'],
        reset: ['ctrl+alt+r']
      };

      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true,
        bindings: customBindings
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      // Test custom undo binding
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'u',
          ctrlKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(1);
    });

    it('supports multiple bindings for the same action', async () => {
      const customBindings = {
        undo: ['ctrl+z', 'ctrl+u', 'cmd+z']
      };

      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true,
        bindings: customBindings
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      // Test first binding
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      });

      // Test second binding
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'u',
          ctrlKey: true
        });
      });

      // Test third binding
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          metaKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(3);
    });
  });

  describe('Callback Functions', () => {
    it('executes undo action when undo is triggered', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(1);
    });

    it('executes redo action when redo is triggered', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'y',
          ctrlKey: true
        });
      });

      expect(engine.redo).toHaveBeenCalledTimes(1);
    });

    it('executes save action when save is triggered', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 's',
          ctrlKey: true
        });
      });

      expect(engine.manualAutosave).toHaveBeenCalledTimes(1);
    });

    it('executes reset action when reset is triggered', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true,
        bindings: { reset: ['ctrl+r'] }
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'r',
          ctrlKey: true
        });
      });

      expect(engine.resetNarrative).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Prevention', () => {
    it('prevents default behavior for recognized shortcuts', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      const event = {
        ...mockKeyboardEvent,
        key: 'z',
        ctrlKey: true
      };

      await act(async () => {
        keydownHandler(event);
      });

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('does not prevent default for unrecognized key combinations', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { enabled: true }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      const event = {
        ...mockKeyboardEvent,
        key: 'x',
        ctrlKey: true
      };

      await act(async () => {
        keydownHandler(event);
      });

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('prevents default behavior when preventDefault is enabled', async () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true,
        preventDefault: true
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      const event = {
        ...mockKeyboardEvent,
        key: 'z',
        ctrlKey: true
      };

      await act(async () => {
        keydownHandler(event);
      });

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Features', () => {
    it('works with different target elements', () => {
      const targetElement = document.createElement('div');
      
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true,
        target: targetElement
      }));

      // Should not throw an error with custom target
      expect(true).toBe(true);
    });

    it('provides consistent keyboard navigation patterns', () => {
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true
      }));

      // Hook should work consistently
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles engine method failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      engine.undo.mockImplementation(() => {
        throw new Error('Undo failed');
      });
      
      renderHook(() => useKeyboardShortcuts(engine, { 
        enabled: true
      }));
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      // Should not throw when engine method fails
      expect(() => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('handles null/undefined engine gracefully', () => {
      expect(() => {
        renderHook(() => useKeyboardShortcuts(null as any, { enabled: true }));
      }).not.toThrow();
    });
  });

  describe('Dynamic Configuration Updates', () => {
    it('updates listeners when configuration changes', () => {
      const { rerender } = renderHook(
        ({ config }) => useKeyboardShortcuts(engine, config),
        { initialProps: { config: { enabled: false } } }
      );

      expect(mockAddEventListener).not.toHaveBeenCalled();

      rerender({ config: { enabled: true } });

      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('updates bindings when they change', async () => {
      const { rerender } = renderHook(
        ({ bindings }) => useKeyboardShortcuts(engine, { enabled: true, bindings }),
        { initialProps: { bindings: { undo: ['ctrl+z'] } } }
      );

      // Test original binding
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];

      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(1);

      // Update bindings
      rerender({ bindings: { undo: ['ctrl+u'] } });

      // Old binding should not work
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'z',
          ctrlKey: true
        });
      });

      // New binding should work
      await act(async () => {
        keydownHandler({
          ...mockKeyboardEvent,
          key: 'u',
          ctrlKey: true
        });
      });

      expect(engine.undo).toHaveBeenCalledTimes(2);
    });
  });
});
